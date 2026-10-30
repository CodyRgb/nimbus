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

interface UploadContextType {
    uploads: PersistentUpload[];
    activeUploadsCount: number;
    queuedCount: number;
    completedCount: number;
    failedCount: number;
    overallProgress: number;
    isOnline: boolean;
    recentFiles: CompletedFileData[];
    loadingRecent: boolean;
    queueUploads: (files: File[]) => Promise<void>;
    pauseUpload: (id: string) => void;
    resumeUpload: (id: string) => void;
    retryUpload: (id: string) => void;
    cancelUpload: (id: string) => void;
    clearCompleted: () => void;
    refreshRecentFiles: () => Promise<void>;
}

const UploadContext = createContext<UploadContextType | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
    const [uploads, setUploads] = useState<PersistentUpload[]>([]);
    const [recentFiles, setRecentFiles] = useState<CompletedFileData[]>([]);
    const [loadingRecent, setLoadingRecent] = useState<boolean>(true);
    const [isOnline, setIsOnline] = useState<boolean>(true);

    const abortControllers = useRef<{ [key: string]: AbortController }>({});
    const activeUploadsRef = useRef<Set<string>>(new Set());
    const isProcessingRef = useRef<boolean>(false);
    const lastProgressSaveRef = useRef<{ [key: string]: number }>({});

    // Fetch verified recent files from backend
    const refreshRecentFiles = useCallback(async () => {
        try {
            setLoadingRecent(true);
            const res = await api.get("/files");
            const files = (res.data.files || []).slice(0, 10);
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
                // Check online status
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
                    // Reset any 'uploading' to 'queued' so they resume cleanly after refresh
                    const sanitized = storedUploads.map(item => {
                        if (item.status === 'uploading') {
                            return { ...item, status: 'queued' as const, progress: 0, uploadedBytes: 0 };
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

    // Network status listeners
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Trigger auto-resume for queued/interrupted items
            setUploads(prev => prev.map(u => {
                if (u.status === 'error' && u.error?.includes('Network')) {
                    return { ...u, status: 'queued', error: undefined };
                }
                return u;
            }));
        };

        const handleOffline = () => {
            setIsOnline(false);
            // Pause any active controllers
            Object.values(abortControllers.current).forEach(c => c.abort());
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
                u.id === uploadItem.id ? { ...u, status: 'queued', error: 'Waiting for network connection...' } : u
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
        // Upload accepts File or Blob
        formData.append('files', uploadItem.file, uploadItem.name);

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

                    setUploads(prev => prev.map(u =>
                        u.id === uploadItem.id ? {
                            ...u,
                            progress: percent,
                            uploadedBytes: loaded,
                            totalBytes: total
                        } : u
                    ));

                    // Throttle IndexedDB progress updates to every 1.5 seconds
                    const now = Date.now();
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
                        completedAt: Date.now()
                    } : u
                ));

                await uploadStorage.updateStatus(uploadItem.id, 'completed');

                // Trigger recent list synchronization
                await refreshRecentFiles();
            } else {
                throw new Error(res.data?.message || 'Server upload processing error');
            }

        } catch (err: any) {
            if (isAxiosError(err) && (err.code === 'ERR_CANCELED' || err.name === 'CanceledError')) {
                setUploads(prev => prev.map(u =>
                    u.id === uploadItem.id ? { ...u, status: 'paused' } : u
                ));
                await uploadStorage.updateStatus(uploadItem.id, 'paused');
            } else {
                const message = isAxiosError(err) ? (err.response?.data?.message || err.message || 'Upload failed') : (err.message || 'Upload failed');
                setUploads(prev => prev.map(u =>
                    u.id === uploadItem.id ? { ...u, status: 'error', error: message } : u
                ));
                await uploadStorage.updateStatus(uploadItem.id, 'error', message);
            }
        } finally {
            delete abortControllers.current[uploadItem.id];
            activeUploadsRef.current.delete(uploadItem.id);
        }
    };

    // Queue processor: limits concurrent uploads to 2 to prevent connection saturating
    useEffect(() => {
        const processQueue = async () => {
            if (isProcessingRef.current || !isOnline) return;

            const MAX_CONCURRENT = 2;
            if (activeUploadsRef.current.size >= MAX_CONCURRENT) return;

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

        const timer = setTimeout(processQueue, 300);
        return () => clearTimeout(timer);
    }, [uploads, isOnline]);

    // Public methods
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
            createdAt: Date.now()
        }));

        setUploads(prev => [...newItems, ...prev]);
        await uploadStorage.saveMultiple(newItems);
    };

    const pauseUpload = (id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
        }
        setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'paused' } : u));
        uploadStorage.updateStatus(id, 'paused');
    };

    const resumeUpload = (id: string) => {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'queued', error: undefined } : u));
        uploadStorage.updateStatus(id, 'queued');
    };

    const retryUpload = (id: string) => {
        setUploads(prev => prev.map(u =>
            u.id === id ? { ...u, status: 'queued', progress: 0, uploadedBytes: 0, error: undefined } : u
        ));
        uploadStorage.updateStatus(id, 'queued');
    };

    const cancelUpload = async (id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
        }
        setUploads(prev => prev.filter(u => u.id !== id));
        await uploadStorage.remove(id);
    };

    const clearCompleted = async () => {
        setUploads(prev => prev.filter(u => u.status !== 'completed'));
        await uploadStorage.clearCompleted();
    };

    // Computations
    const activeUploadsCount = uploads.filter(u => u.status === 'uploading').length;
    const queuedCount = uploads.filter(u => u.status === 'queued').length;
    const completedCount = uploads.filter(u => u.status === 'completed').length;
    const failedCount = uploads.filter(u => u.status === 'error').length;

    const inProgress = uploads.filter(u => u.status === 'uploading' || u.status === 'queued');
    const overallProgress = inProgress.length === 0 ? 0 : Math.round(
        inProgress.reduce((acc, curr) => acc + curr.progress, 0) / inProgress.length
    );

    return (
        <UploadContext.Provider
            value={{
                uploads,
                activeUploadsCount,
                queuedCount,
                completedCount,
                failedCount,
                overallProgress,
                isOnline,
                recentFiles,
                loadingRecent,
                queueUploads,
                pauseUpload,
                resumeUpload,
                retryUpload,
                cancelUpload,
                clearCompleted,
                refreshRecentFiles
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
