"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { isAxiosError } from "axios";
import UploadProgressItem from "../../components/UploadProgressItem";

interface FileData {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
}

interface UploadState {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'paused' | 'error' | 'completed' | 'queued';
    uploadedBytes: number;
    totalBytes: number;
    error?: string;
}

interface CategoryStats {
    images: number;
    documents: number;
    videos: number;
    other: number;
}

interface StorageStats {
    totalUsed: number;
    categoryStats: CategoryStats;
}

export default function UploadPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [recentFiles, setRecentFiles] = useState<FileData[]>([]);
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState<UploadState[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const abortControllers = useRef<{ [key: string]: AbortController }>({});
    const isProcessingQueue = useRef(false);

    const fetchRecentFiles = useCallback(async () => {
        setLoadingFiles(true);
        try {
            const res = await api.get("/files");
            // Show up to 5 recent files
            setRecentFiles((res.data.files || []).slice(0, 5));
        } catch (error) {
            console.error("Failed to fetch recent files", error);
        } finally {
            setLoadingFiles(false);
        }
    }, []);

    const fetchStorageStats = useCallback(async () => {
        try {
            const res = await api.get("/files/storage");
            setStorageStats(res.data);
        } catch (error) {
            console.error("Failed to fetch storage stats", error);
        }
    }, []);

    useEffect(() => {
        fetchRecentFiles();
        fetchStorageStats();
    }, [fetchRecentFiles, fetchStorageStats]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('pdf')) return 'picture_as_pdf';
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'movie';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return 'folder_zip';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'description';
        return 'description';
    };

    const getFileIconColor = (mimeType: string) => {
        if (mimeType.includes('pdf')) return 'bg-red-500/20 text-red-400';
        if (mimeType.startsWith('image/')) return 'bg-blue-500/20 text-blue-400';
        if (mimeType.startsWith('video/')) return 'bg-purple-500/20 text-purple-400';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return 'bg-yellow-500/20 text-yellow-400';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'bg-green-500/20 text-green-400';
        return 'bg-gray-500/20 text-gray-400';
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    };

    const startUpload = async (uploadId: string, file: File) => {
        const controller = new AbortController();
        abortControllers.current[uploadId] = controller;

        setUploads(prev => prev.map(u =>
            u.id === uploadId ? { ...u, status: 'uploading', error: undefined } : u
        ));

        const formData = new FormData();
        formData.append('files', file);

        try {
            await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                signal: controller.signal,
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || file.size || 1;
                    const loaded = progressEvent.loaded;
                    const percentCompleted = Math.round((loaded * 100) / total);

                    setUploads(prev => prev.map(u =>
                        u.id === uploadId ? {
                            ...u,
                            progress: percentCompleted,
                            uploadedBytes: loaded,
                            totalBytes: total
                        } : u
                    ));
                },
            });

            setUploads(prev => prev.map(u =>
                u.id === uploadId ? { ...u, status: 'completed', progress: 100, uploadedBytes: u.totalBytes } : u
            ));

            fetchRecentFiles();
            fetchStorageStats();

            setTimeout(() => {
                setUploads(prev => prev.filter(u => u.id !== uploadId));
            }, 3000);

        } catch (err) {
            if (isAxiosError(err) && err.code === 'ERR_CANCELED') {
                setUploads(prev => prev.map(u =>
                    u.id === uploadId ? { ...u, status: 'paused' } : u
                ));
            } else {
                console.error(err);
                const message = isAxiosError(err) ? (err.response?.data?.message || 'Upload failed') : 'Upload failed';
                setUploads(prev => prev.map(u =>
                    u.id === uploadId ? { ...u, status: 'error', error: message } : u
                ));
            }
        } finally {
            delete abortControllers.current[uploadId];
            isProcessingQueue.current = false;
        }
    };

    useEffect(() => {
        const processQueue = async () => {
            if (isProcessingQueue.current) return;

            const nextUpload = uploads.find(u =>
                u.status === 'queued' && !abortControllers.current[u.id]
            );

            if (!nextUpload) return;

            isProcessingQueue.current = true;
            await startUpload(nextUpload.id, nextUpload.file);
        };

        processQueue();
    }, [uploads]);

    const uploadFiles = async (files: File[]) => {
        const newUploads: UploadState[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            progress: 0,
            status: 'queued',
            uploadedBytes: 0,
            totalBytes: file.size
        }));

        setUploads(prev => [...prev, ...newUploads]);
    };

    const handlePause = (id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
        }
    };

    const handleResume = (id: string) => {
        setUploads(prev => prev.map(u =>
            u.id === id ? { ...u, status: 'queued' } : u
        ));
    };

    const handleRetry = (id: string) => {
        setUploads(prev => prev.map(u =>
            u.id === id ? { ...u, status: 'queued', progress: 0, uploadedBytes: 0, error: undefined } : u
        ));
    };

    const handleCancel = (id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
        }
        setUploads(prev => prev.filter(u => u.id !== id));
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFiles(Array.from(e.target.files));
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full text-white overflow-x-hidden">
            {/* Main Content */}
            <div className="max-w-[1500px] mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Upload Area & Queue */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Upload Header */}
                        <div className="bg-[#202327] p-8 border border-white/10">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="eyebrow-tag text-pill-lime">INGESTION ENGINE</span>
                                        <span className="text-[11px] font-mono text-[#B8FE00] uppercase font-bold tracking-wider">● ENCRYPTION READY</span>
                                    </div>
                                    <h1 className="font-['Anton'] text-4xl sm:text-5xl uppercase tracking-tight text-white mb-2">
                                        DISPATCH TO VAULT
                                    </h1>
                                    <p className="text-white/60 text-sm font-sans max-w-xl">
                                        End-to-end zero-knowledge client encryption. Assets are split into redundant shards across 14 sovereign clusters.
                                    </p>
                                </div>
                                <button
                                    onClick={handleBrowseClick}
                                    className="px-5 py-2.5 bg-[#B8FE00] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all shrink-0 flex items-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(184,254,0,0.3)]"
                                >
                                    <span>+ SELECT ASSETS</span>
                                </button>
                            </div>
                        </div>

                        {/* Drop Zone */}
                        <div
                            className={`relative bg-[#202327] p-12 sm:p-16 border-2 border-dashed transition-all cursor-pointer ${isDragging
                                ? 'border-[#B8FE00] bg-[#0720C6]/20 shadow-[0_0_40px_rgba(184,254,0,0.2)]'
                                : 'border-white/20 hover:border-[#B8FE00]/60'
                                }`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={handleBrowseClick}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileInputChange}
                                className="hidden"
                            />

                            <div className="flex flex-col items-center text-center">
                                <div className="mb-6 w-20 h-20 bg-[#16181B] border border-white/15 flex items-center justify-center text-[#B8FE00] shadow-inner">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>

                                <h3 className="font-['Anton'] text-2xl sm:text-3xl uppercase tracking-tight text-white mb-2">
                                    DRAG & DROP ASSETS HERE
                                </h3>
                                <p className="text-white/50 text-xs font-mono uppercase tracking-wider mb-6 max-w-md">
                                    HIGH-THROUGHPUT CONCURRENT PIPELINE • IMAGES, VIDEOS, DOCUMENTS & ENCRYPTED TARBALLS
                                </p>

                                <div className="flex items-center gap-4 mb-6 w-full max-w-xs justify-center">
                                    <div className="h-px flex-1 bg-white/15"></div>
                                    <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">OR</span>
                                    <div className="h-px flex-1 bg-white/15"></div>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleBrowseClick();
                                    }}
                                    className="px-8 py-3.5 bg-[#0720C6] text-white hover:bg-[#B8FE00] hover:text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl"
                                >
                                    BROWSE LOCAL STORAGE
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Storage & Recent Files */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Storage Panel */}
                        <div className="bg-[#202327] p-6 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-['Anton'] text-xl uppercase tracking-tight text-white">STORAGE TELEMETRY</h3>
                                <span className="text-[10px] font-extrabold uppercase font-mono text-black bg-[#B8FE00] px-2 py-0.5 tracking-wider">UNLIMITED</span>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-['Anton'] text-4xl text-white tracking-tight">
                                        {storageStats ? formatSize(storageStats.totalUsed).split(' ')[0] : '0'}
                                    </span>
                                    <span className="text-sm font-mono text-[#B8FE00] font-bold uppercase">
                                        {storageStats ? formatSize(storageStats.totalUsed).split(' ')[1] : 'B'} OCCUPIED
                                    </span>
                                </div>
                                <p className="text-[11px] font-mono text-white/40 uppercase">ZERO-KNOWLEDGE CIPHER ALLOCATION</p>
                            </div>

                            <div className="h-2 bg-[#16181B] overflow-hidden mb-6 flex border border-white/10">
                                {storageStats && storageStats.totalUsed > 0 && (
                                    <>
                                        <div
                                            className="h-full bg-[#B8FE00]"
                                            style={{ width: `${(storageStats.categoryStats.images / storageStats.totalUsed) * 100}%` }}
                                            title="Images"
                                        />
                                        <div
                                            className="h-full bg-[#0720C6]"
                                            style={{ width: `${(storageStats.categoryStats.documents / storageStats.totalUsed) * 100}%` }}
                                            title="Documents"
                                        />
                                        <div
                                            className="h-full bg-purple-500"
                                            style={{ width: `${(storageStats.categoryStats.videos / storageStats.totalUsed) * 100}%` }}
                                            title="Videos"
                                        />
                                        <div
                                            className="h-full bg-white/40"
                                            style={{ width: `${(storageStats.categoryStats.other / storageStats.totalUsed) * 100}%` }}
                                            title="Other"
                                        />
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                <div className="flex items-center gap-2 p-2 bg-[#16181B] border border-white/5">
                                    <div className="w-2.5 h-2.5 bg-[#B8FE00]"></div>
                                    <span className="text-white/70 uppercase">IMAGES</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-[#16181B] border border-white/5">
                                    <div className="w-2.5 h-2.5 bg-[#0720C6]"></div>
                                    <span className="text-white/70 uppercase">DOCS</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-[#16181B] border border-white/5">
                                    <div className="w-2.5 h-2.5 bg-purple-500"></div>
                                    <span className="text-white/70 uppercase">VIDEOS</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-[#16181B] border border-white/5">
                                    <div className="w-2.5 h-2.5 bg-white/40"></div>
                                    <span className="text-white/70 uppercase">ARCHIVES</span>
                                </div>
                            </div>
                        </div>

                        {/* Just Added */}
                        <div className="bg-[#202327] p-6 border border-white/10 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <h3 className="font-['Anton'] text-lg uppercase tracking-tight text-white">RECENT INGESTIONS</h3>
                                <button
                                    onClick={() => router.push(`/${user?.name || 'user'}/storage`)}
                                    className="text-xs font-mono font-bold uppercase text-[#B8FE00] hover:underline tracking-wider"
                                >
                                    OPEN VAULT →
                                </button>
                            </div>

                            {loadingFiles ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin text-[#B8FE00] text-2xl">⚡</div>
                                </div>
                            ) : recentFiles.length > 0 ? (
                                <div className="space-y-2">
                                    {recentFiles.map((file) => (
                                        <div
                                            key={file._id}
                                            className="flex items-center gap-3 p-2.5 bg-[#16181B] hover:border-[#B8FE00]/40 border border-white/10 transition-all group"
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 bg-[#202327] border border-white/10 text-xs font-mono text-[#B8FE00]">
                                                {file.mimeType.startsWith('image/') ? 'IMG' :
                                                 file.mimeType.startsWith('video/') ? 'VID' :
                                                 file.mimeType.includes('pdf') ? 'PDF' : 'DOC'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate font-sans">{file.originalName}</p>
                                                <p className="text-[10px] font-mono text-white/40 uppercase">
                                                    {getTimeAgo(file.createdAt)} • {formatSize(file.size)}
                                                </p>
                                            </div>
                                            <span className="text-[#B8FE00] text-xs font-bold font-mono">✓</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-[#16181B] border border-white/5">
                                    <div className="text-2xl mb-2 opacity-40">📁</div>
                                    <p className="text-xs font-mono text-white/40 uppercase">NO RECENT INGESTIONS</p>
                                </div>
                            )}
                        </div>
                    </div>

                        {/* Upload Queue - Full Width */}
                        <div className="lg:col-span-12">
                            <AnimatePresence>
                                {uploads.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-white/40">
                                                UPLOADING ({uploads.filter(u => u.status !== 'completed').length})
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            {uploads.map((upload, index) => (
                                                <UploadProgressItem
                                                    key={upload.id}
                                                    {...upload}
                                                    currentPosition={index + 1}
                                                    totalUploads={uploads.length}
                                                    onPause={() => handlePause(upload.id)}
                                                    onResume={() => handleResume(upload.id)}
                                                    onRetry={() => handleRetry(upload.id)}
                                                    onCancel={() => handleCancel(upload.id)}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
    );
}