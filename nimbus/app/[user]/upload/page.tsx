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

export default function UploadPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [recentFiles, setRecentFiles] = useState<FileData[]>([]);
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

    useEffect(() => {
        fetchRecentFiles();
    }, [fetchRecentFiles]);

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
        <div className="w-full text-white selection:bg-primary selection:text-white overflow-x-hidden">
            {/* Main Content */}
            <div className="px-1 md:px-2 lg:px-10 py-2 md:py-4 lg:py-10">
                <div className="max-w-[1500px] mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column - Upload Area & Queue */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Upload Header */}
                            <div className="bg-[#1a2332] rounded-2xl p-8 border border-white/5">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <h2 className="text-4xl font-bold mb-2">Upload Files</h2>
                                        <p className="text-white/60">Securely store and share your data in the cloud.</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all ">
                                        <span className="material-symbols-outlined text-lg">folder_open</span>
                                        <span className="text-sm font-medium ">New Folder</span>
                                    </button>
                                </div>
                            </div>

                            {/* Drop Zone */}
                            <div
                                className={`relative bg-[#1a2332] rounded-2xl p-16 border-2 border-dashed transition-all ${isDragging
                                    ? 'border-primary bg-primary/5'
                                    : 'border-white/10 hover:border-primary/50'
                                    }`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />

                                <div className="flex flex-col items-center">
                                    <div className="mb-8 size-32 rounded-full bg-gradient-to-b from-primary/20 to-transparent flex items-center justify-center">
                                        <span className="material-symbols-outlined text-6xl text-primary">cloud_upload</span>
                                    </div>

                                    <h3 className="text-2xl font-bold mb-2">Drag & drop files here</h3>
                                    <p className="text-white/50 mb-8">Support for PDF, DOCX, JPG, PNG, and MP4</p>

                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-px w-12 bg-white/20"></div>
                                        <span className="text-xs text-white/40 uppercase tracking-wider">or</span>
                                        <div className="h-px w-12 bg-white/20"></div>
                                    </div>

                                    <button
                                        onClick={handleBrowseClick}
                                        className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 rounded-full font-medium transition-all shadow-lg shadow-primary/20"
                                    >
                                        <span className="material-symbols-outlined">add_circle</span>
                                        Browse Files
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Storage & Recent Files */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Storage Panel */}
                            <div className="bg-[#1a2332] rounded-2xl p-6 border border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Storage</h3>
                                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">Pro Plan</span>
                                </div>

                                <div className="mb-3">
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-3xl font-bold">45.5</span>
                                        <span className="text-sm text-white/60 mb-1">GB used of 100 GB</span>
                                    </div>
                                </div>

                                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                                    <div className="h-full w-[45%] bg-primary rounded-full"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-blue-400"></div>
                                        <span className="text-xs text-white/60">Images</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-yellow-400"></div>
                                        <span className="text-xs text-white/60">Documents</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-purple-400"></div>
                                        <span className="text-xs text-white/60">Videos</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-white/20"></div>
                                        <span className="text-xs text-white/60">Other</span>
                                    </div>
                                </div>
                            </div>

                            {/* Just Added */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">JUST ADDED</h3>
                                    <button
                                        onClick={() => router.push(`/${user?.name}/storage`)}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        View All
                                    </button>
                                </div>

                                {loadingFiles ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin text-primary text-2xl">⚡</div>
                                    </div>
                                ) : recentFiles.length > 0 ? (
                                    <div className="space-y-2">
                                        {recentFiles.map((file) => (
                                            <div
                                                key={file._id}
                                                className="flex items-center gap-3 p-3 bg-[#1a2332] hover:bg-[#1f2937] rounded-xl border border-white/5 transition-all group"
                                            >
                                                <div className={`flex items-center justify-center size-10 rounded-lg ${getFileIconColor(file.mimeType)}`}>
                                                    <span className="material-symbols-outlined text-lg">{getFileIcon(file.mimeType)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{file.originalName}</p>
                                                    <p className="text-xs text-white/40">
                                                        {getTimeAgo(file.createdAt)} • {formatSize(file.size)}
                                                    </p>
                                                </div>
                                                <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-[#1a2332] rounded-xl border border-white/5">
                                        <div className="text-3xl mb-2">📁</div>
                                        <p className="text-sm text-white/40">No files yet</p>
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
        </div>
    );
}