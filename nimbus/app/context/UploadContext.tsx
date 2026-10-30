"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/api";
import { uploadStorage, PersistentUpload } from "../../lib/uploadDb";

export interface CompletedFileData {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
}

export interface UploadStats {
    activeUploadsCount: number;
    queuedCount: number;
    pausedCount: number;
    completedCount: number;
    failedCount: number;
    cancelledCount: number;
    totalFilesCount: number;
    totalUploadedBytes: number;
    totalQueueBytes: number;
    overallProgress: number;
    uploadSpeed: number; // bytes per second
    estimatedSecondsRemaining: number;
}

interface UploadContextType {
    uploads: PersistentUpload[];
    stats: UploadStats;
    isOnline: boolean;
    concurrency: number;
    setConcurrency: (val: number) => void;
    isDrawerOpen: boolean;
    setIsDrawerOpen: (open: boolean) => void;
    recentFiles: CompletedFileData[];
    loadingRecent: boolean;
    queueUploads: (files: File[]) => Promise<void>;
    pauseUpload: (id: string) => void;
    resumeUpload: (id: string) => void;
    retryUpload: (id: string) => void;
    cancelUpload: (id: string) => void;
    removeUpload: (id: string) => void;
    pauseAll: () => void;
    resumeAll: () => void;
    cancelAll: () => void;
    retryFailed: () => void;
    clearCompleted: () => void;
    refreshRecentFiles: () => Promise<void>;
    // Backward compatibility shortcuts
    activeUploadsCount: number;
    queuedCount: number;
    pausedCount: number;
    completedCount: number;
    failedCount: number;
    overallProgress: number;
    overallSpeed: number;
}

const UploadContext = createContext<UploadContextType | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
    const [uploads, setUploads] = useState<PersistentUpload[]>([]);
    const [recentFiles, setRecentFiles] = useState<CompletedFileData[]>([]);
    const [loadingRecent, setLoadingRecent] = useState<boolean>(true);
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [concurrency, setConcurrencyState] = useState<number>(2);
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

    const abortControllers = useRef<{ [key: string]: AbortController }>({});
    const activeUploadsRef = useRef<Set<string>>(new Set());
    const isProcessingRef = useRef<boolean>(false);
    const lastProgressSaveRef = useRef<{ [key: string]: number }>({});
    const speedTrackerRef = useRef<{ [id: string]: { lastBytes: number; lastTime: number } }>({});

    // Read stored concurrency setting
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedConcurrency = localStorage.getItem("ciphervault_upload_concurrency");
            if (savedConcurrency) {
                const parsed = parseInt(savedConcurrency, 10);
                if (parsed >= 1 && parsed <= 5) setConcurrencyState(parsed);
            }
        }
    }, []);

    const setConcurrency = (val: number) => {
        const clamped = Math.max(1, Math.min(5, val));
        setConcurrencyState(clamped);
        if (typeof window !== "undefined") {
            localStorage.setItem("ciphervault_upload_concurrency", clamped.toString());
        }
    };

    // Fetch verified recent files from backend
    const refreshRecentFiles = useCallback(async () => {
        try {
            setLoadingRecent(true);
            const res = await api.get("/files");
            const files = (res.data.files || []).slice(0, 15);
            setRecentFiles(files);
            await uploadStorage.saveRecentCompleted(files);
        } catch (err) {
            console.error("Failed to fetch recent files:", err);
            // Fallback to cached verified files
            const cached = await uploadStorage.getRecentCompleted();
            if (cached.length > 0) setRecentFiles(cached);
        } finally {
            setLoadingRecent(false);
        }
    }, []);

    // Load initial queue and recent files from IndexedDB
    useEffect(() => {
        let isMounted = true;

        const initializeStorage = async () => {
            try {
                if (typeof window !== "undefined") {
                    setIsOnline(navigator.onLine);
                }

                // Load cached recent files first for instant render
                const cachedRecent = await uploadStorage.getRecentCompleted();
                if (isMounted && cachedRecent.length > 0) {
                    setRecentFiles(cachedRecent);
                    setLoadingRecent(false);
                }

                // Load existing upload queue
                const storedUploads = await uploadStorage.getAll();
                if (isMounted && storedUploads.length > 0) {
                    // Mark any previously 'uploading' items as 'paused' with an explanation of OS termination
                    const sanitized = storedUploads.map(item => {
                        if (item.status === 'uploading') {
                            return {
                                ...item,
                                status: 'paused' as const,
                                error: 'Interrupted during previous app session. Tap Resume to continue.'
                            };
                        }
                        return item;
                    });
                    setUploads(sanitized);
                }
            } catch (e) {
                console.error("Initialization of upload storage failed:", e);
            }
        };

        initializeStorage();
        refreshRecentFiles();

        return () => {
            isMounted = false;
        };
    }, [refreshRecentFiles]);

    // Network status listeners with auto-recovery
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Trigger auto-resume for interrupted network items
            setUploads(prev => prev.map(u => {
                if (u.status === 'error' && (u.error?.includes('Network') || u.error?.includes('connection'))) {
                    return { ...u, status: 'queued', error: undefined };
                }
                return u;
            }));
        };

        const handleOffline = () => {
            setIsOnline(false);
            // Abort active controllers and flag connection drop
            Object.values(abortControllers.current).forEach(c => c.abort());
            setUploads(prev => prev.map(u => {
                if (u.status === 'uploading') {
                    return { ...u, status: 'error', error: 'Network connection lost. Waiting to auto-resume...' };
                }
                return u;
            }));
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Upload individual file
    const executeUpload = async (uploadItem: PersistentUpload) => {
        if (!navigator.onLine) {
            setUploads(prev => prev.map(u =>
                u.id === uploadItem.id ? { ...u, status: 'error', error: 'Waiting for network connection...' } : u
            ));
            return;
        }

        const controller = new AbortController();
        abortControllers.current[uploadItem.id] = controller;
        activeUploadsRef.current.add(uploadItem.id);

        setUploads(prev => prev.map(u =>
            u.id === uploadItem.id ? { ...u, status: 'uploading', error: undefined } : u
        ));
        await uploadStorage.updateStatus(uploadItem.id, 'uploading');

        const formData = new FormData();
        formData.append('files', uploadItem.file, uploadItem.name);

        speedTrackerRef.current[uploadItem.id] = { lastBytes: 0, lastTime: Date.now() };

        try {
            const res = await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                signal: controller.signal,
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || uploadItem.size || 1;
                    const loaded = progressEvent.loaded;
                    const percent = Math.min(99, Math.round((loaded * 100) / total));

                    // Calculate instantaneous speed
                    const now = Date.now();
                    const tracker = speedTrackerRef.current[uploadItem.id];
                    let currentSpeed = 0;
                    if (tracker && now > tracker.lastTime) {
                        const bytesDiff = loaded - tracker.lastBytes;
                        const timeDiff = (now - tracker.lastTime) / 1000;
                        if (timeDiff > 0.3) {
                            currentSpeed = Math.round(bytesDiff / timeDiff);
                            speedTrackerRef.current[uploadItem.id] = { lastBytes: loaded, lastTime: now };
                        }
                    }

                    setUploads(prev => prev.map(u =>
                        u.id === uploadItem.id ? {
                            ...u,
                            progress: percent,
                            uploadedBytes: loaded,
                            totalBytes: total,
                            speed: currentSpeed || u.speed || 0
                        } : u
                    ));

                    // Throttle IndexedDB progress updates to every 1.5s
                    if (!lastProgressSaveRef.current[uploadItem.id] || now - lastProgressSaveRef.current[uploadItem.id] > 1500) {
                        lastProgressSaveRef.current[uploadItem.id] = now;
                        uploadStorage.updateProgress(uploadItem.id, percent, loaded, total);
                    }
                },
            });

            // Upload verified by backend response
            if (res.data && res.data.success !== false) {
                setUploads(prev => prev.map(u =>
                    u.id === uploadItem.id ? {
                        ...u,
                        status: 'completed',
                        progress: 100,
                        uploadedBytes: u.totalBytes,
                        speed: 0,
                        completedAt: Date.now()
                    } : u
                ));

                await uploadStorage.updateStatus(uploadItem.id, 'completed');

                // Trigger recent list live synchronization
                await refreshRecentFiles();
            } else {
                throw new Error(res.data?.message || 'Server upload processing error');
            }

        } catch (err: any) {
            if (isAxiosError(err) && (err.code === 'ERR_CANCELED' || err.name === 'CanceledError')) {
                // If cancelled vs paused
                setUploads(prev => prev.map(u => {
                    if (u.id === uploadItem.id) {
                        return u.status === 'cancelled' ? u : { ...u, status: 'paused', speed: 0 };
                    }
                    return u;
                }));
            } else {
                const message = isAxiosError(err) 
                    ? (err.response?.data?.message || err.message || 'Upload failed') 
                    : (err.message || 'Upload failed');
                
                const newRetryCount = (uploadItem.retryCount || 0) + 1;
                setUploads(prev => prev.map(u =>
                    u.id === uploadItem.id ? { ...u, status: 'error', error: message, speed: 0, retryCount: newRetryCount } : u
                ));
                await uploadStorage.updateStatus(uploadItem.id, 'error', message);
            }
        } finally {
            delete abortControllers.current[uploadItem.id];
            delete speedTrackerRef.current[uploadItem.id];
            activeUploadsRef.current.delete(uploadItem.id);
        }
    };

    // Queue processor with dynamic concurrency
    useEffect(() => {
        const processQueue = async () => {
            if (isProcessingRef.current || !isOnline) return;

            if (activeUploadsRef.current.size >= concurrency) return;

            const nextInQueue = uploads.find(u =>
                u.status === 'queued' && !activeUploadsRef.current.has(u.id)
            );

            if (!nextInQueue) return;

            isProcessingRef.current = true;
            try {
                await executeUpload(nextInQueue);
            } finally {
                isProcessingRef.current = false;
            }
        };

        const timer = setTimeout(processQueue, 250);
        return () => clearTimeout(timer);
    }, [uploads, isOnline, concurrency]);

    // Public controls
    const queueUploads = async (files: File[]) => {
        if (!files || files.length === 0) return;

        const newItems: PersistentUpload[] = files.map(file => ({
            id: 'upl-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6),
            file,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            progress: 0,
            status: 'queued',
            uploadedBytes: 0,
            totalBytes: file.size,
            speed: 0,
            retryCount: 0,
            createdAt: Date.now()
        }));

        setUploads(prev => [...newItems, ...prev]);
        await uploadStorage.saveMultiple(newItems);
    };

    const pauseUpload = (id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
        }
        setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'paused', speed: 0 } : u));
        uploadStorage.updateStatus(id, 'paused');
    };

    const resumeUpload = (id: string) => {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'queued', error: undefined } : u));
        uploadStorage.updateStatus(id, 'queued');
    };

    const retryUpload = (id: string) => {
        setUploads(prev => prev.map(u =>
            u.id === id ? { ...u, status: 'queued', progress: 0, uploadedBytes: 0, error: undefined, speed: 0 } : u
        ));
        uploadStorage.updateStatus(id, 'queued');
    };

    const cancelUpload = async (id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
        }
        setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'cancelled', speed: 0 } : u));
        await uploadStorage.updateStatus(id, 'cancelled');
    };

    const removeUpload = async (id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
        }
        setUploads(prev => prev.filter(u => u.id !== id));
        await uploadStorage.remove(id);
    };

    const pauseAll = () => {
        Object.values(abortControllers.current).forEach(c => c.abort());
        setUploads(prev => prev.map(u =>
            (u.status === 'uploading' || u.status === 'queued') ? { ...u, status: 'paused', speed: 0 } : u
        ));
        uploads.forEach(u => {
            if (u.status === 'uploading' || u.status === 'queued') {
                uploadStorage.updateStatus(u.id, 'paused');
            }
        });
    };

    const resumeAll = () => {
        setUploads(prev => prev.map(u =>
            u.status === 'paused' ? { ...u, status: 'queued', error: undefined } : u
        ));
        uploads.forEach(u => {
            if (u.status === 'paused') {
                uploadStorage.updateStatus(u.id, 'queued');
            }
        });
    };

    const cancelAll = () => {
        Object.values(abortControllers.current).forEach(c => c.abort());
        setUploads(prev => prev.map(u =>
            (u.status === 'uploading' || u.status === 'queued' || u.status === 'paused') ? { ...u, status: 'cancelled', speed: 0 } : u
        ));
        uploads.forEach(u => {
            if (u.status === 'uploading' || u.status === 'queued' || u.status === 'paused') {
                uploadStorage.updateStatus(u.id, 'cancelled');
            }
        });
    };

    const retryFailed = () => {
        setUploads(prev => prev.map(u =>
            u.status === 'error' ? { ...u, status: 'queued', progress: 0, uploadedBytes: 0, error: undefined, speed: 0 } : u
        ));
        uploads.forEach(u => {
            if (u.status === 'error') {
                uploadStorage.updateStatus(u.id, 'queued');
            }
        });
    };

    const clearCompleted = async () => {
        setUploads(prev => prev.filter(u => u.status !== 'completed' && u.status !== 'cancelled'));
        await uploadStorage.clearCompleted();
    };

    // Computations & Stats
    const activeUploadsCount = uploads.filter(u => u.status === 'uploading').length;
    const queuedCount = uploads.filter(u => u.status === 'queued').length;
    const pausedCount = uploads.filter(u => u.status === 'paused').length;
    const completedCount = uploads.filter(u => u.status === 'completed').length;
    const failedCount = uploads.filter(u => u.status === 'error').length;
    const cancelledCount = uploads.filter(u => u.status === 'cancelled').length;
    const totalFilesCount = uploads.length;

    const inProgress = uploads.filter(u => u.status === 'uploading' || u.status === 'queued');
    const overallProgress = inProgress.length === 0 ? 0 : Math.round(
        inProgress.reduce((acc, curr) => acc + curr.progress, 0) / inProgress.length
    );

    const totalUploadedBytes = uploads.reduce((acc, u) => acc + (u.uploadedBytes || 0), 0);
    const totalQueueBytes = uploads.reduce((acc, u) => acc + (u.totalBytes || u.size || 0), 0);
    const aggregateSpeed = uploads.reduce((acc, u) => acc + (u.status === 'uploading' ? (u.speed || 0) : 0), 0);

    const remainingBytes = Math.max(0, totalQueueBytes - totalUploadedBytes);
    const estimatedSecondsRemaining = aggregateSpeed > 0 ? Math.round(remainingBytes / aggregateSpeed) : 0;

    const stats: UploadStats = {
        activeUploadsCount,
        queuedCount,
        pausedCount,
        completedCount,
        failedCount,
        cancelledCount,
        totalFilesCount,
        totalUploadedBytes,
        totalQueueBytes,
        overallProgress,
        uploadSpeed: aggregateSpeed,
        estimatedSecondsRemaining
    };

    return (
        <UploadContext.Provider
            value={{
                uploads,
                stats,
                isOnline,
                concurrency,
                setConcurrency,
                isDrawerOpen,
                setIsDrawerOpen,
                recentFiles,
                loadingRecent,
                queueUploads,
                pauseUpload,
                resumeUpload,
                retryUpload,
                cancelUpload,
                removeUpload,
                pauseAll,
                resumeAll,
                cancelAll,
                retryFailed,
                clearCompleted,
                refreshRecentFiles,
                activeUploadsCount,
                queuedCount,
                pausedCount: stats.pausedCount,
                completedCount,
                failedCount,
                overallProgress,
                overallSpeed: stats.uploadSpeed
            }}
        >
            {children}
        </UploadContext.Provider>
    );
}

export function useUpload() {
    const context = useContext(UploadContext);
    if (!context) {
        throw new Error("useUpload must be used within an UploadProvider");
    }
    return context;
}

