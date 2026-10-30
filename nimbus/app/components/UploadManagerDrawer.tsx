"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LuX, 
    LuPlay, 
    LuPause, 
    LuRotateCw, 
    LuTrash2, 
    LuCheck, 
    LuCircleAlert, 
    LuGauge, 
    LuClock, 
    LuFile, 
    LuFileText, 
    LuImage, 
    LuVideo, 
    LuMusic,
    LuArchive,
    LuSlidersHorizontal,
    LuBan
} from "react-icons/lu";
import { useUpload } from "../context/UploadContext";
import { PersistentUpload } from "../../lib/uploadDb";

export default function UploadManagerDrawer() {
    const {
        uploads,
        stats,
        isOnline,
        concurrency,
        setConcurrency,
        isDrawerOpen,
        setIsDrawerOpen,
        pauseUpload,
        resumeUpload,
        retryUpload,
        cancelUpload,
        removeUpload,
        pauseAll,
        resumeAll,
        cancelAll,
        retryFailed,
        clearCompleted
    } = useUpload();

    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'paused' | 'completed' | 'failed'>('all');
    const [showCancelAllModal, setShowCancelAllModal] = useState<boolean>(false);

    if (!isDrawerOpen) return null;

    const formatBytes = (bytes: number): string => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const formatSpeed = (bytesPerSec: number): string => {
        if (!bytesPerSec || bytesPerSec === 0) return "0 KB/s";
        return formatBytes(bytesPerSec) + "/s";
    };

    const formatSeconds = (sec: number): string => {
        if (!sec || sec <= 0 || !isFinite(sec)) return "Calculating...";
        if (sec < 60) return `${sec}s`;
        const mins = Math.floor(sec / 60);
        const remainingSec = sec % 60;
        return `${mins}m ${remainingSec}s`;
    };

    const getFileIcon = (mime: string) => {
        if (mime.startsWith('image/')) return <LuImage className="text-emerald-400" size={18} />;
        if (mime.startsWith('video/')) return <LuVideo className="text-purple-400" size={18} />;
        if (mime.startsWith('audio/')) return <LuMusic className="text-pink-400" size={18} />;
        if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar')) return <LuArchive className="text-amber-400" size={18} />;
        if (mime.includes('pdf') || mime.includes('text')) return <LuFileText className="text-blue-400" size={18} />;
        return <LuFile className="text-neutral-400" size={18} />;
    };

    const filteredUploads = uploads.filter(u => {
        if (activeTab === 'active') return u.status === 'uploading' || u.status === 'queued';
        if (activeTab === 'paused') return u.status === 'paused';
        if (activeTab === 'completed') return u.status === 'completed';
        if (activeTab === 'failed') return u.status === 'error';
        return true;
    });

    const hasActiveUploads = uploads.some(u => u.status === 'uploading' || u.status === 'queued');
    const hasPausedUploads = uploads.some(u => u.status === 'paused');
    const hasFailedUploads = uploads.some(u => u.status === 'error');
    const hasCompletedUploads = uploads.some(u => u.status === 'completed' || u.status === 'cancelled');

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsDrawerOpen(false)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Drawer Content */}
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 280 }}
                    className="relative w-full max-w-2xl bg-[#16181B] border-l border-white/15 h-full flex flex-col shadow-2xl z-10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-white/10 bg-[#202327] flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#0720C6] border border-[#B8FE00]/30 flex items-center justify-center text-[#B8FE00]">
                                <LuGauge size={19} />
                            </div>
                            <div>
                                <h3 className="font-display font-black text-lg tracking-wider uppercase text-white leading-none">
                                    UPLOAD DISPATCH MANAGER
                                </h3>
                                <p className="text-[11px] font-mono text-[#A0A6B2] mt-1 flex items-center gap-2">
                                    <span>CONCURRENCY: <strong className="text-[#B8FE00]">{concurrency} STREAMS</strong></span>
                                    <span>•</span>
                                    <span className={isOnline ? "text-[#B8FE00]" : "text-amber-400"}>
                                        {isOnline ? "ONLINE" : "OFFLINE (QUEUED)"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            aria-label="Close upload manager"
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <LuX size={20} />
                        </button>
                    </div>

                    {/* Overall Progress & Velocity Telemetry Card */}
                    <div className="p-5 bg-[#1a1d21] border-b border-white/10 shrink-0 space-y-4">
                        <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-white/70 uppercase">OVERALL PIPELINE PROGRESS</span>
                            <span className="text-[#B8FE00] font-bold text-sm">{stats.overallProgress}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-[#16181B] rounded-full overflow-hidden border border-white/10">
                            <div
                                className="h-full bg-gradient-to-r from-[#0720C6] to-[#B8FE00] transition-all duration-300"
                                style={{ width: `${stats.overallProgress}%` }}
                            />
                        </div>

                        {/* 4 Stat Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-2.5 bg-[#202327] border border-white/10 rounded-lg">
                                <span className="text-[10px] font-mono text-white/40 uppercase block">SPEED</span>
                                <span className="text-xs font-mono font-bold text-[#B8FE00] truncate block">
                                    {formatSpeed(stats.uploadSpeed)}
                                </span>
                            </div>
                            <div className="p-2.5 bg-[#202327] border border-white/10 rounded-lg">
                                <span className="text-[10px] font-mono text-white/40 uppercase block">VOLUME</span>
                                <span className="text-xs font-mono font-bold text-white truncate block">
                                    {formatBytes(stats.totalUploadedBytes)} / {formatBytes(stats.totalQueueBytes)}
                                </span>
                            </div>
                            <div className="p-2.5 bg-[#202327] border border-white/10 rounded-lg">
                                <span className="text-[10px] font-mono text-white/40 uppercase block">ESTIMATED</span>
                                <span className="text-xs font-mono font-bold text-blue-400 truncate block flex items-center gap-1">
                                    <LuClock size={11} />
                                    {formatSeconds(stats.estimatedSecondsRemaining)}
                                </span>
                            </div>
                            <div className="p-2.5 bg-[#202327] border border-white/10 rounded-lg">
                                <span className="text-[10px] font-mono text-white/40 uppercase block">IN QUEUE</span>
                                <span className="text-xs font-mono font-bold text-white truncate block">
                                    {stats.activeUploadsCount + stats.queuedCount} PENDING
                                </span>
                            </div>
                        </div>

                        {/* Concurrency Selector */}
                        <div className="flex items-center justify-between pt-1 text-xs font-mono">
                            <span className="text-white/60 flex items-center gap-1.5">
                                <LuSlidersHorizontal size={13} /> Parallel Concurrency:
                            </span>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 5].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setConcurrency(level)}
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                            concurrency === level
                                                ? "bg-[#B8FE00] text-[#16181B]"
                                                : "bg-[#202327] text-white/60 hover:text-white border border-white/10"
                                        }`}
                                    >
                                        {level}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bulk Action Controls Bar */}
                    <div className="p-3 bg-[#202327] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {hasActiveUploads && (
                                <button
                                    onClick={pauseAll}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                                >
                                    <LuPause size={13} /> Pause All
                                </button>
                            )}

                            {hasPausedUploads && (
                                <button
                                    onClick={resumeAll}
                                    className="px-3 py-1.5 rounded-lg bg-[#B8FE00]/15 border border-[#B8FE00]/40 text-[#B8FE00] hover:bg-[#B8FE00]/25 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                                >
                                    <LuPlay size={13} /> Resume All
                                </button>
                            )}

                            {hasFailedUploads && (
                                <button
                                    onClick={retryFailed}
                                    className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                                >
                                    <LuRotateCw size={13} /> Retry Failed ({stats.failedCount})
                                </button>
                            )}

                            {hasCompletedUploads && (
                                <button
                                    onClick={clearCompleted}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white/70 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1 transition-all"
                                >
                                    <LuTrash2 size={13} /> Clear Done
                                </button>
                            )}
                        </div>

                        {uploads.length > 0 && (
                            <button
                                onClick={() => setShowCancelAllModal(true)}
                                className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all ml-auto"
                            >
                                <LuBan size={13} /> Cancel All
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-4 border-b border-white/10 flex items-center gap-2 overflow-x-auto bg-[#16181B] shrink-0">
                        {[
                            { id: 'all', label: `ALL (${uploads.length})` },
                            { id: 'active', label: `ACTIVE (${stats.activeUploadsCount + stats.queuedCount})` },
                            { id: 'paused', label: `PAUSED (${stats.pausedCount})` },
                            { id: 'completed', label: `COMPLETED (${stats.completedCount})` },
                            { id: 'failed', label: `FAILED (${stats.failedCount})` },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-3 px-2 border-b-2 font-mono text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "border-[#B8FE00] text-[#B8FE00] font-bold"
                                        : "border-transparent text-white/50 hover:text-white"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* File List Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredUploads.length === 0 ? (
                            <div className="py-20 text-center text-white/40 font-mono text-xs uppercase space-y-2">
                                <div className="text-4xl opacity-40">📦</div>
                                <p>NO UPLOADS IN CURRENT FILTER</p>
                                <p className="text-[11px] text-white/30">Drag files to the upload page or choose assets to start</p>
                            </div>
                        ) : (
                            filteredUploads.map(item => {
                                const isUploading = item.status === 'uploading';
                                const isPaused = item.status === 'paused';
                                const isQueued = item.status === 'queued';
                                const isCompleted = item.status === 'completed';
                                const isError = item.status === 'error';
                                const isCancelled = item.status === 'cancelled';

                                return (
                                    <div
                                        key={item.id}
                                        className="p-3.5 bg-[#202327] border border-white/10 hover:border-white/20 rounded-xl space-y-3 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-lg bg-[#16181B] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                                    {getFileIcon(item.mimeType)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-white truncate" title={item.name}>
                                                        {item.name}
                                                    </p>
                                                    <div className="text-[11px] font-mono text-white/50 flex items-center gap-2 mt-0.5">
                                                        <span>{formatBytes(item.size)}</span>
                                                        {item.speed ? (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-[#B8FE00]">{formatSpeed(item.speed)}</span>
                                                            </>
                                                        ) : null}
                                                        {item.retryCount && item.retryCount > 0 ? (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-amber-400">Retry #{item.retryCount}</span>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="shrink-0">
                                                {isUploading && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#B8FE00]/15 text-[#B8FE00] border border-[#B8FE00]/30 animate-pulse">
                                                        UPLOADING ({item.progress}%)
                                                    </span>
                                                )}
                                                {isQueued && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-900/40 text-blue-300 border border-blue-500/30">
                                                        QUEUED
                                                    </span>
                                                )}
                                                {isPaused && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                        PAUSED
                                                    </span>
                                                )}
                                                {isCompleted && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                        <LuCheck size={11} /> DONE
                                                    </span>
                                                )}
                                                {isError && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                                                        <LuCircleAlert size={11} /> FAILED
                                                    </span>
                                                )}
                                                {isCancelled && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/5 text-white/50 border border-white/10">
                                                        CANCELLED
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar (when active, paused or queued) */}
                                        {!isCompleted && !isCancelled && (
                                            <div className="space-y-1">
                                                <div className="h-1.5 w-full bg-[#16181B] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-200 ${
                                                            isError
                                                                ? "bg-red-500"
                                                                : isPaused
                                                                ? "bg-amber-400"
                                                                : "bg-[#B8FE00]"
                                                        }`}
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                                {item.error && (
                                                    <p className="text-[11px] font-mono text-red-400 leading-tight">
                                                        {item.error}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                                            {isUploading && (
                                                <button
                                                    onClick={() => pauseUpload(item.id)}
                                                    className="p-1.5 text-xs text-amber-400 hover:bg-amber-500/10 rounded flex items-center gap-1 font-mono uppercase"
                                                    title="Pause"
                                                >
                                                    <LuPause size={13} /> Pause
                                                </button>
                                            )}

                                            {isPaused && (
                                                <button
                                                    onClick={() => resumeUpload(item.id)}
                                                    className="p-1.5 text-xs text-[#B8FE00] hover:bg-[#B8FE00]/10 rounded flex items-center gap-1 font-mono uppercase"
                                                    title="Resume"
                                                >
                                                    <LuPlay size={13} /> Resume
                                                </button>
                                            )}

                                            {isError && (
                                                <button
                                                    onClick={() => retryUpload(item.id)}
                                                    className="p-1.5 text-xs text-[#B8FE00] hover:bg-[#B8FE00]/10 rounded flex items-center gap-1 font-mono uppercase"
                                                    title="Retry"
                                                >
                                                    <LuRotateCw size={13} /> Retry
                                                </button>
                                            )}

                                            {!isCompleted && !isCancelled && (
                                                <button
                                                    onClick={() => cancelUpload(item.id)}
                                                    className="p-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded flex items-center gap-1 font-mono uppercase"
                                                    title="Cancel"
                                                >
                                                    <LuX size={13} /> Cancel
                                                </button>
                                            )}

                                            {(isCompleted || isCancelled) && (
                                                <button
                                                    onClick={() => removeUpload(item.id)}
                                                    className="p-1.5 text-xs text-white/50 hover:text-white hover:bg-white/10 rounded flex items-center gap-1 font-mono uppercase"
                                                    title="Remove from list"
                                                >
                                                    <LuTrash2 size={13} /> Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Cancel All Confirmation Modal */}
            {showCancelAllModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#202327] border border-white/20 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-white"
                    >
                        <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center text-xl">
                            <LuCircleAlert />
                        </div>
                        <div>
                            <h4 className="font-display font-extrabold text-lg uppercase text-white">
                                CANCEL ALL UPLOADS?
                            </h4>
                            <p className="text-xs text-white/60 font-sans mt-1">
                                This will immediately abort all active and queued uploads. Interrupted files will need to be re-added.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => {
                                    cancelAll();
                                    setShowCancelAllModal(false);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                YES, CANCEL ALL
                            </button>
                            <button
                                onClick={() => setShowCancelAllModal(false)}
                                className="flex-1 py-2.5 rounded-xl bg-[#16181B] hover:bg-white/10 border border-white/20 text-white font-mono text-xs uppercase tracking-wider transition-all"
                            >
                                GO BACK
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
