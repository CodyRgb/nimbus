"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useUpload } from "../../context/UploadContext";
import UploadProgressItem from "../../components/UploadProgressItem";
import {
    LuCloudUpload,
    LuFileText,
    LuImage,
    LuVideo,
    LuFileArchive,
    LuHardDrive,
    LuCheck,
    LuArrowUpRight,
    LuClock,
    LuFolder
} from "react-icons/lu";

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
    const params = useParams();
    const { user } = useAuth();
    const username = (params.user as string) || user?.name || "user";

    const {
        uploads,
        queueUploads,
        pauseUpload,
        resumeUpload,
        retryUpload,
        cancelUpload,
        pauseAll,
        resumeAll,
        cancelAll,
        retryFailed,
        clearCompleted,
        setIsDrawerOpen,
        activeUploadsCount,
        queuedCount,
        pausedCount,
        failedCount,
        completedCount,
        overallProgress,
        overallSpeed,
        recentFiles,
        loadingRecent,
        refreshRecentFiles
    } = useUpload();

    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchStorageStats = useCallback(async () => {
        try {
            const res = await api.get("/files/storage");
            setStorageStats(res.data);
        } catch (error) {
            console.error("Failed to fetch storage stats", error);
        }
    }, []);

    useEffect(() => {
        fetchStorageStats();
        refreshRecentFiles();
    }, [fetchStorageStats, refreshRecentFiles]);

    const formatSize = (bytes: number) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes("pdf")) return <LuFileText className="text-red-400" size={18} />;
        if (mimeType.startsWith("image/")) return <LuImage className="text-blue-400" size={18} />;
        if (mimeType.startsWith("video/")) return <LuVideo className="text-purple-400" size={18} />;
        if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("compressed"))
            return <LuFileArchive className="text-yellow-400" size={18} />;
        return <LuFileText className="text-gray-400" size={18} />;
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            queueUploads(Array.from(e.dataTransfer.files));
        }
    }, [queueUploads]);

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
            queueUploads(Array.from(e.target.files));
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="w-full text-white overflow-x-hidden font-body max-w-7xl mx-auto pb-12">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10"
            >
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="eyebrow-tag text-pill-lime">INGESTION ENGINE</span>
                        <span className="text-[11px] font-mono text-[#B8FE00] uppercase font-bold tracking-wider">
                            ● ENCRYPTION ACTIVE
                        </span>
                    </div>
                    <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight text-white mb-2">
                        DISPATCH TO VAULT
                    </h1>
                    <p className="text-white/60 text-xs sm:text-sm font-sans max-w-xl">
                        End-to-end zero-knowledge client encryption. Assets are partitioned into cryptographic shards and synced directly across sovereign nodes.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleBrowseClick}
                        className="px-5 py-2.5 bg-[#B8FE00] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all shrink-0 flex items-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(184,254,0,0.3)] cursor-pointer rounded-lg"
                    >
                        <span>+ SELECT ASSETS</span>
                    </button>
                    <button
                        onClick={() => router.push(`/${username}/storage`)}
                        className="px-4 py-2.5 bg-[#202327] border border-white/15 text-white/80 hover:text-white font-mono text-xs uppercase tracking-wider transition-all rounded-lg"
                    >
                        BROWSE STORAGE
                    </button>
                </div>
            </motion.div>

            {/* Main Upload Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column (8 cols): Dropzone & Active Ingestion Queue */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Responsive Drop Zone */}
                    <div
                        className={`relative bg-[#202327] p-8 sm:p-14 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                            isDragging
                                ? "border-[#B8FE00] bg-[#0720C6]/20 shadow-[0_0_40px_rgba(184,254,0,0.25)]"
                                : "border-white/20 hover:border-[#B8FE00]/60"
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
                            <div className="mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 bg-[#16181B] border border-white/15 rounded-2xl flex items-center justify-center text-[#B8FE00] shadow-inner">
                                <LuCloudUpload size={34} className={isDragging ? "animate-bounce" : ""} />
                            </div>

                            <h3 className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl uppercase tracking-tight text-white mb-2">
                                DRAG & DROP ASSETS HERE
                            </h3>
                            <p className="text-white/50 text-[11px] sm:text-xs font-mono uppercase tracking-wider mb-6 max-w-md">
                                HIGH-THROUGHPUT CONCURRENT PIPELINE • 2GB PER ASSET • IMAGES, VIDEOS, ARCHIVES & DOCUMENTS
                            </p>

                            <div className="flex items-center gap-4 mb-6 w-full max-w-xs justify-center">
                                <div className="h-px flex-1 bg-white/15"></div>
                                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">OR</span>
                                <div className="h-px flex-1 bg-white/15"></div>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleBrowseClick();
                                }}
                                className="px-7 py-3 bg-[#0720C6] text-white hover:bg-[#B8FE00] hover:text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl rounded-xl cursor-pointer"
                            >
                                BROWSE LOCAL FILES
                            </button>
                        </div>
                    </div>

                    {/* Active Uploads Queue (survives page refresh & route change) */}
                    {uploads.length > 0 && (
                        <div className="bg-[#202327] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/10 gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-white">
                                            ACTIVE DISPATCH QUEUE ({uploads.length})
                                        </h3>
                                        {activeUploadsCount > 0 && (
                                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#B8FE00] text-[#16181B] rounded animate-pulse">
                                                {overallProgress}% • {(overallSpeed / (1024 * 1024)).toFixed(1)} MB/s
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-mono text-white/50">
                                        {activeUploadsCount} active • {queuedCount} queued • {pausedCount} paused • {completedCount} secured
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    {(activeUploadsCount > 0 || queuedCount > 0) && (
                                        <button
                                            onClick={pauseAll}
                                            className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#16181B] border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                                        >
                                            PAUSE ALL
                                        </button>
                                    )}
                                    {pausedCount > 0 && (
                                        <button
                                            onClick={resumeAll}
                                            className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#16181B] border border-[#B8FE00]/40 text-[#B8FE00] hover:bg-[#B8FE00]/10 rounded-lg transition-all"
                                        >
                                            RESUME ALL
                                        </button>
                                    )}
                                    {failedCount > 0 && (
                                        <button
                                            onClick={retryFailed}
                                            className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#16181B] border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all"
                                        >
                                            RETRY FAILED
                                        </button>
                                    )}
                                    {completedCount > 0 && (
                                        <button
                                            onClick={clearCompleted}
                                            className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#16181B] border border-white/20 text-white/70 hover:text-white rounded-lg transition-all"
                                        >
                                            CLEAR DONE
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsDrawerOpen(true)}
                                        className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#0720C6] text-white hover:bg-[#B8FE00] hover:text-[#16181B] rounded-lg transition-all flex items-center gap-1 shadow-sm"
                                        title="Open slide-over upload manager"
                                    >
                                        <span>DASHBOARD</span>
                                        <span>↗</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {uploads.map((upload, idx) => (
                                    <UploadProgressItem
                                        key={upload.id}
                                        file={upload.file as File}
                                        progress={upload.progress}
                                        status={upload.status}
                                        uploadedBytes={upload.uploadedBytes}
                                        totalBytes={upload.totalBytes}
                                        error={upload.error}
                                        currentPosition={idx + 1}
                                        totalUploads={uploads.length}
                                        onPause={() => pauseUpload(upload.id)}
                                        onResume={() => resumeUpload(upload.id)}
                                        onRetry={() => retryUpload(upload.id)}
                                        onCancel={() => cancelUpload(upload.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column (4 cols): Telemetry & Synchronized Recent Ingestions */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Storage Telemetry Panel */}
                    <div className="bg-[#202327] p-5 sm:p-6 border border-white/10 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-white">
                                STORAGE TELEMETRY
                            </h3>
                            <span className="text-[10px] font-extrabold uppercase font-mono text-black bg-[#B8FE00] px-2 py-0.5 rounded tracking-wider">
                                UNLIMITED
                            </span>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                                    {storageStats ? formatSize(storageStats.totalUsed).split(" ")[0] : "0"}
                                </span>
                                <span className="text-xs font-mono text-[#B8FE00] font-bold uppercase">
                                    {storageStats ? formatSize(storageStats.totalUsed).split(" ")[1] : "B"} OCCUPIED
                                </span>
                            </div>
                            <p className="text-[10px] font-mono text-white/40 uppercase">ZERO-KNOWLEDGE CIPHER ALLOCATION</p>
                        </div>

                        {/* Category Progress Badges */}
                        {storageStats?.categoryStats && (
                            <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs font-mono">
                                <div className="flex items-center justify-between text-white/70">
                                    <span className="flex items-center gap-1.5">
                                        <LuImage className="text-blue-400" /> Images
                                    </span>
                                    <span>{storageStats.categoryStats.images} assets</span>
                                </div>
                                <div className="flex items-center justify-between text-white/70">
                                    <span className="flex items-center gap-1.5">
                                        <LuVideo className="text-purple-400" /> Videos
                                    </span>
                                    <span>{storageStats.categoryStats.videos} assets</span>
                                </div>
                                <div className="flex items-center justify-between text-white/70">
                                    <span className="flex items-center gap-1.5">
                                        <LuFileText className="text-red-400" /> Documents
                                    </span>
                                    <span>{storageStats.categoryStats.documents} assets</span>
                                </div>
                                <div className="flex items-center justify-between text-white/70">
                                    <span className="flex items-center gap-1.5">
                                        <LuFolder className="text-yellow-400" /> Other
                                    </span>
                                    <span>{storageStats.categoryStats.other} assets</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Synchronized Recent Ingestions (Verified Complete Only) */}
                    <div className="bg-[#202327] p-5 sm:p-6 border border-white/10 rounded-2xl shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div>
                                <h3 className="font-display font-extrabold text-base uppercase tracking-tight text-white">
                                    RECENT INGESTIONS
                                </h3>
                                <p className="text-[10px] font-mono text-white/50">Verified completed uploads only</p>
                            </div>
                            <button
                                onClick={() => router.push(`/${username}/storage`)}
                                className="text-xs font-mono font-bold uppercase text-[#B8FE00] hover:underline tracking-wider flex items-center gap-1"
                            >
                                <span>VIEW ALL</span>
                                <LuArrowUpRight size={14} />
                            </button>
                        </div>

                        {loadingRecent ? (
                            <div className="py-6 text-center text-white/40 text-xs font-mono">
                                <span className="animate-pulse">SYNCHRONIZING WITH VAULT...</span>
                            </div>
                        ) : recentFiles.length === 0 ? (
                            <div className="py-8 text-center text-white/40 text-xs font-mono space-y-2">
                                <p>No completed uploads yet.</p>
                                <p className="text-[10px] text-white/30">Select assets above to begin storing.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 divide-y divide-white/5">
                                {recentFiles.slice(0, 6).map((file) => (
                                    <div
                                        key={file._id}
                                        onClick={() => router.push(`/${username}/storage`)}
                                        className="pt-2 first:pt-0 flex items-center justify-between gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-[#16181B] border border-white/10 flex items-center justify-center shrink-0">
                                                {getFileIcon(file.mimeType)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white truncate group-hover:text-[#B8FE00] transition-colors" title={file.originalName}>
                                                    {file.originalName}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] font-mono text-white/50">
                                                    <span>{formatSize(file.size)}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <LuClock size={10} /> {getTimeAgo(file.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-1 text-[#B8FE00] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <LuArrowUpRight size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}