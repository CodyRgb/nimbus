"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpload } from "../context/UploadContext";
import {
    LuCloudUpload,
    LuChevronUp,
    LuChevronDown,
    LuCheck,
    LuCircleAlert,
    LuPause,
    LuPlay,
    LuRotateCcw,
    LuX,
    LuTrash2
} from "react-icons/lu";

export default function FloatingUploadWidget() {
    const {
        uploads,
        activeUploadsCount,
        queuedCount,
        completedCount,
        failedCount,
        overallProgress,
        pauseUpload,
        resumeUpload,
        retryUpload,
        cancelUpload,
        clearCompleted
    } = useUpload();

    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    // If there are no uploads at all, hide widget
    if (uploads.length === 0) return null;

    const formatSize = (bytes: number) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const hasActive = activeUploadsCount > 0 || queuedCount > 0;

    return (
        <aside
            aria-label="Upload Progress Tracker"
            className="fixed z-40 bottom-20 md:bottom-6 right-4 md:right-6 max-w-[calc(100vw-2rem)] md:max-w-md w-full pointer-events-none"
        >
            <div className="pointer-events-auto">
                <AnimatePresence>
                    {isExpanded ? (
                        /* Expanded Ingestion Panel */
                        <motion.div
                            key="expanded-widget"
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-[#1A1D21]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[70vh] sm:max-h-[500px]"
                        >
                            {/* Panel Header */}
                            <div className="p-4 bg-[#202327] border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasActive ? 'bg-[#0720C6] text-[#B8FE00]' : 'bg-[#B8FE00] text-black font-bold'}`}>
                                        <LuCloudUpload className={hasActive ? "animate-pulse" : ""} size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">
                                            INGESTION QUEUE
                                        </h4>
                                        <p className="text-[11px] font-mono text-[#A0A6B2]">
                                            {activeUploadsCount > 0
                                                ? `Encrypting & uploading (${activeUploadsCount} active, ${overallProgress}%)`
                                                : `${completedCount} completed${failedCount > 0 ? `, ${failedCount} failed` : ''}`
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {completedCount > 0 && (
                                        <button
                                            onClick={clearCompleted}
                                            title="Clear finished items"
                                            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs font-mono"
                                        >
                                            <LuTrash2 size={15} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsExpanded(false)}
                                        title="Minimize"
                                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <LuChevronDown size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Overall Progress Bar */}
                            {hasActive && (
                                <div className="w-full bg-[#16181B] h-1.5 overflow-hidden">
                                    <motion.div
                                        className="bg-[#B8FE00] h-full shadow-[0_0_10px_#B8FE00]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${overallProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            )}

                            {/* Uploads List */}
                            <div className="p-3 overflow-y-auto space-y-2.5 divide-y divide-white/5">
                                {uploads.map((item) => (
                                    <div key={item.id} className="pt-2.5 first:pt-0">
                                        <div className="flex items-start justify-between gap-3 mb-1.5">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-white truncate" title={item.name}>
                                                    {item.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono">
                                                    {item.status === 'completed' ? (
                                                        <span className="text-[#B8FE00] font-bold flex items-center gap-1">
                                                            <LuCheck size={12} /> SECURED IN VAULT
                                                        </span>
                                                    ) : item.status === 'error' ? (
                                                        <span className="text-red-400 font-bold flex items-center gap-1">
                                                            <LuCircleAlert size={12} /> {item.error || 'FAILED'}
                                                        </span>
                                                    ) : item.status === 'paused' ? (
                                                        <span className="text-yellow-400 font-bold">PAUSED</span>
                                                    ) : item.status === 'uploading' ? (
                                                        <span className="text-white/60">
                                                            <span className="text-[#B8FE00] font-bold">{formatSize(item.uploadedBytes)}</span> / {formatSize(item.totalBytes)} ({item.progress}%)
                                                        </span>
                                                    ) : (
                                                        <span className="text-white/40">IN QUEUE</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                                {item.status === 'uploading' && (
                                                    <button
                                                        onClick={() => pauseUpload(item.id)}
                                                        title="Pause upload"
                                                        className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                    >
                                                        <LuPause size={13} />
                                                    </button>
                                                )}
                                                {item.status === 'paused' && (
                                                    <button
                                                        onClick={() => resumeUpload(item.id)}
                                                        title="Resume upload"
                                                        className="p-1.5 text-[#B8FE00] hover:bg-[#B8FE00]/10 rounded transition-colors"
                                                    >
                                                        <LuPlay size={13} />
                                                    </button>
                                                )}
                                                {item.status === 'error' && (
                                                    <button
                                                        onClick={() => retryUpload(item.id)}
                                                        title="Retry upload"
                                                        className="p-1.5 text-[#B8FE00] hover:bg-[#B8FE00]/10 rounded transition-colors"
                                                    >
                                                        <LuRotateCcw size={13} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => cancelUpload(item.id)}
                                                    title="Cancel upload"
                                                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                >
                                                    <LuX size={13} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Item Mini Progress Bar */}
                                        {item.status === 'uploading' && (
                                            <div className="w-full bg-[#16181B] h-1 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-[#B8FE00] h-full transition-all duration-200"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        /* Minimized Floating Pill Button */
                        <motion.button
                            key="collapsed-widget"
                            onClick={() => setIsExpanded(true)}
                            initial={{ opacity: 0, scale: 0.9, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 15 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`ml-auto flex items-center gap-3 px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-md transition-all cursor-pointer ${
                                hasActive
                                    ? "bg-[#202327]/95 border-[#B8FE00]/50 text-white shadow-[0_0_25px_rgba(184,254,0,0.25)]"
                                    : "bg-[#202327]/90 border-white/20 text-white"
                            }`}
                        >
                            <div className="relative flex items-center justify-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${hasActive ? 'bg-[#0720C6] text-[#B8FE00]' : 'bg-[#B8FE00] text-black font-bold'}`}>
                                    {hasActive ? (
                                        <LuCloudUpload size={14} className="animate-bounce" />
                                    ) : (
                                        <LuCheck size={14} />
                                    )}
                                </div>
                                {hasActive && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#B8FE00] animate-ping" />
                                )}
                            </div>

                            <div className="text-left font-mono">
                                <div className="text-xs font-bold text-white flex items-center gap-1.5 leading-tight">
                                    <span>
                                        {hasActive
                                            ? `UPLOADING (${overallProgress}%)`
                                            : `ALL VAULT UPLOADS COMPLETE`}
                                    </span>
                                </div>
                                <div className="text-[10px] text-white/50 leading-tight">
                                    {hasActive
                                        ? `${activeUploadsCount} active • ${queuedCount} queued`
                                        : `${completedCount} items secured in cloud`}
                                </div>
                            </div>

                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/70 ml-1">
                                <LuChevronUp size={14} />
                            </div>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </aside>
    );
}
