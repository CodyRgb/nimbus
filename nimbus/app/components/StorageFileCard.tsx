"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FiHeart, FiDownload, FiEdit2, FiTrash2, FiSmartphone } from "react-icons/fi";
import { MdPhotoAlbum } from "react-icons/md";
import { AiFillHeart } from "react-icons/ai";
import FileThumbnail from "./FileThumbnail";
import FavoriteButton from "./FavoriteButton"; // Keeping if needed elsewhere, though unused in render
import React from "react";
import api from "../../lib/api";

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
    isActive?: boolean; // For mobile touch interactions
    onSelect: () => void;
    onToggleFavorite: (fileId: string, status: boolean) => void;
    onPreview: () => void;
    onDownload: () => void;
    onAddToAlbum?: () => void;
    onDelete?: () => void;
    onRename?: () => void;
    showActions?: boolean;
    onActivate?: () => void; // Called when card is clicked/tapped
    deleteLabel?: string;
}

export default function StorageFileCard({
    file,
    isSelected,
    isSelectionMode,
    isActive = false,
    onSelect,
    onToggleFavorite,
    onPreview,
    onDownload,
    onAddToAlbum,
    onDelete,
    onRename,
    showActions = true,
    onActivate,
    deleteLabel = "Delete"
}: StorageFileCardProps) {

    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuOpen]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // If clicking on action buttons, don't activate the card
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input[type="checkbox"]') || target.closest('.menu-trigger')) {
            return;
        }

        if (onActivate) {
            onActivate();
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPreview();
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(!menuOpen);
    };

    const handleAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
        setMenuOpen(false);
    };

    const handleToggleFavoriteInternal = async () => {
        try {
            // Call API
            const response = await api.patch(`/files/${file._id}/favorite`);
            const newStatus = response.data.isFavorite;
            // Notify parent to update state
            onToggleFavorite(file._id, newStatus);
        } catch (error) {
            console.error("Failed to toggle favorite", error);
            alert("Failed to update favorite status");
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleCardClick}
            onDoubleClick={handleDoubleClick}
            className={`group relative bg-gray-900 rounded-xl overflow-visible border transition-all cursor-pointer ${isSelected ? 'border-aurora-blue ring-2 ring-aurora-blue/20' :
                isActive ? 'border-white/30' :
                    'border-white/10 hover:border-white/20'
                }`}
        >
            {/* Selection Checkbox */}
            <div
                className={`absolute top-2 left-2 z-20 transition-opacity duration-200 ${isSelected || isSelectionMode || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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

            {/* 3-Dots Menu Button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                        className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
                    >
                        <BsThreeDotsVertical size={18} />
                    </button>

                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                onMouseLeave={() => setMenuOpen(false)}
                                className="absolute right-0 top-full mt-1 w-56 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-xl overflow-hidden z-30 flex flex-col py-1"
                            >
                                <button
                                    onClick={(e) => handleAction(e, handleToggleFavoriteInternal)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                >
                                    {file.isFavorite ? <AiFillHeart className="text-red-500" size={18} /> : <FiHeart size={18} />}
                                    <span>{file.isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
                                </button>

                                {onAddToAlbum && (
                                    <button
                                        onClick={(e) => handleAction(e, onAddToAlbum)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                    >
                                        <MdPhotoAlbum size={18} />
                                        <span>Add to album</span>
                                    </button>
                                )}

                                <button
                                    onClick={(e) => {
                                        handleAction(e, () => alert("Open with feature coming soon!"));
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                >
                                    <FiSmartphone size={18} />
                                    <span>Open with devices</span>
                                </button>

                                <div className="h-px bg-white/10 my-1 mx-2"></div>

                                <button
                                    onClick={(e) => handleAction(e, onDownload)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                >
                                    <FiDownload size={18} />
                                    <span>Download</span>
                                </button>

                                {onRename && (
                                    <button
                                        onClick={(e) => handleAction(e, onRename)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                    >
                                        <FiEdit2 size={18} />
                                        <span>Rename</span>
                                    </button>
                                )}

                                <div className="h-px bg-white/10 my-1 mx-2"></div>

                                {onDelete && (
                                    <button
                                        onClick={(e) => handleAction(e, onDelete)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                    >
                                        <FiTrash2 size={18} />
                                        <span>{deleteLabel}</span>
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                {/* Favorite Indicator (Visual only, since button is in menu now) */}
                {file.isFavorite && (
                    <div className="absolute top-2 left-8 z-10 text-xl">
                        ❤️
                    </div>
                )}
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
        </motion.div>
    );
}
