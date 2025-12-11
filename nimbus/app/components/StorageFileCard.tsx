"use client";

import { motion } from "framer-motion";
import FileThumbnail from "./FileThumbnail";
import FavoriteButton from "./FavoriteButton";
import React from "react";

interface StorageFileCardProps {
    file: {
        _id: string;
        originalName: string;
        mimeType: string;
        size: number;
        isFavorite: boolean;
    };
    isSelected: boolean;
    isSelectionMode: boolean;
    onSelect: () => void;
    onToggleFavorite: (fileId: string, status: boolean) => void;
    onPreview: () => void;
    onDownload: () => void;
    onAddToAlbum?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
}

export default function StorageFileCard({
    file,
    isSelected,
    isSelectionMode,
    onSelect,
    onToggleFavorite,
    onPreview,
    onDownload,
    onAddToAlbum,
    onDelete,
    showActions = true
}: StorageFileCardProps) {

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group relative bg-gray-900 rounded-xl overflow-hidden border transition-all ${isSelected ? 'border-aurora-blue ring-2 ring-aurora-blue/20' : 'border-white/10 hover:border-white/20'
                }`}
        >
            {/* Selection Checkbox */}
            <div
                className={`absolute top-2 left-2 z-20 transition-opacity duration-200 ${isSelected || isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
            >
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="w-5 h-5 cursor-pointer accent-aurora-blue bg-black/40 backdrop-blur-sm rounded border-white/30 checked:bg-aurora-blue checked:border-aurora-blue"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Favorite Button */}
            <div
                className={`absolute top-2 right-2 z-20 transition-opacity duration-200 ${file.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
            >
                <div className="bg-black/40 backdrop-blur-sm rounded-full p-1">
                    <FavoriteButton
                        fileId={file._id}
                        isFavorite={file.isFavorite}
                        onToggle={onToggleFavorite}
                    />
                </div>
            </div>

            {/* Thumbnail Area */}
            <div className="aspect-square bg-gray-800 flex items-center justify-center relative">
                <FileThumbnail
                    fileId={file._id}
                    fileName={file.originalName}
                    mimeType={file.mimeType}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Info Area */}
            <div className="p-3 bg-gray-900 border-t border-white/5">
                <p className="text-sm font-medium text-white truncate font-body" title={file.originalName}>
                    {file.originalName}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-1">
                    {formatSize(file.size)}
                </p>
            </div>

            {/* Hover Actions Overlay */}
            {showActions && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 backdrop-blur-[2px] z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPreview(); }}
                        className="p-2.5 bg-white/10 hover:bg-white/20 hover:scale-110 rounded-full text-white transition-all duration-200"
                        title="Preview"
                    >
                        👁️
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDownload(); }}
                        className="p-2.5 bg-white/10 hover:bg-white/20 hover:scale-110 rounded-full text-white transition-all duration-200"
                        title="Download"
                    >
                        ⬇️
                    </button>
                    {onAddToAlbum && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddToAlbum(); }}
                            className="p-2.5 bg-white/10 hover:bg-white/20 hover:scale-110 rounded-full text-white transition-all duration-200"
                            title="Add to Album"
                        >
                            🖼️
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-2.5 bg-red-500/20 hover:bg-red-500/40 hover:scale-110 rounded-full text-red-400 transition-all duration-200"
                            title="Delete"
                        >
                            ❌
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
