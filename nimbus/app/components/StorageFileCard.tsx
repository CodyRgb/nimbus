import { motion, AnimatePresence } from "framer-motion";
import { BsThreeDotsVertical } from "react-icons/bs";
import { LuHeart, LuDownload, LuPencil, LuTrash2, LuSmartphone, LuImagePlus, LuShare2 } from "react-icons/lu";
import { AiFillHeart } from "react-icons/ai";
import FileThumbnail from "./FileThumbnail";
import FavoriteButton from "./FavoriteButton"; // Keeping if needed elsewhere, though unused in render
import React, { useRef, useState } from "react";
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
    onShare?: () => void;
    onAddToAlbum?: () => void;
    onDelete?: () => void;
    onRename?: () => void;
    onLongPress?: () => void; // New prop for long press
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
    onShare,
    onAddToAlbum,
    onDelete,
    onRename,
    onLongPress,
    showActions = true,
    onActivate,
    deleteLabel = "Delete"
}: StorageFileCardProps) {

    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Touch handling refs
    const touchTimeout = useRef<NodeJS.Timeout | null>(null);
    const lastTapTime = useRef<number>(0);
    const touchstartPos = useRef<{ x: number, y: number } | null>(null);
    const isLongPressTriggered = useRef(false);

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

    // --- Touch Event Handlers ---

    const handleTouchStart = (e: React.TouchEvent) => {
        // Ignore multi-touch
        if (e.touches.length > 1) return;

        const touch = e.touches[0];
        touchstartPos.current = { x: touch.clientX, y: touch.clientY };
        isLongPressTriggered.current = false;

        // Start long press timer
        touchTimeout.current = setTimeout(() => {
            if (onLongPress) {
                isLongPressTriggered.current = true;
                if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
                onLongPress();
            }
        }, 500); // 500ms for long press
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchstartPos.current) return;

        const touch = e.touches[0];
        const moveX = Math.abs(touch.clientX - touchstartPos.current.x);
        const moveY = Math.abs(touch.clientY - touchstartPos.current.y);

        // If moved significantly, cancel gestures (it's a scroll)
        if (moveX > 10 || moveY > 10) {
            if (touchTimeout.current) {
                clearTimeout(touchTimeout.current);
                touchTimeout.current = null;
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchTimeout.current) {
            clearTimeout(touchTimeout.current);
            touchTimeout.current = null;
        }

        // If long press happened, ignore this end event
        if (isLongPressTriggered.current) {
            e.preventDefault(); // Prevent click after long press
            return;
        }

        // Determine Double Tap
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime.current;

        if (tapLength < 300 && tapLength > 0) {
            // Double Tap detected
            e.preventDefault(); // Prevent zoom or other defaults
            onPreview();
        } else {
            // Single Tap logic handled by onClick usually, but we can augment here if needed
            // For now, let onClick fire naturally for single taps
        }

        lastTapTime.current = currentTime;
    };

    // --- Mouse Event Handlers ---

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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`group relative bg-[#202327] border transition-all duration-200 cursor-pointer overflow-visible ${isSelected ? 'border-[#B8FE00] ring-1 ring-[#B8FE00] shadow-[0_0_20px_rgba(184,254,0,0.25)]' :
                isActive ? 'border-white/40' :
                    'border-white/10 hover:border-[#B8FE00]/60 hover:-translate-y-1'
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
                    className="w-5 h-5 cursor-pointer accent-[#B8FE00] bg-black/60 backdrop-blur-sm rounded-none border border-white/30 checked:bg-[#B8FE00] checked:border-[#B8FE00]"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* 3-Dots Menu Button */}
            <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20">
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                        className="p-1.5 sm:p-1.5 bg-[#16181B]/90 hover:bg-[#B8FE00] hover:text-black text-white border border-white/20 transition-all shadow-md rounded-sm"
                        title="File actions"
                        aria-label="File options"
                    >
                        <BsThreeDotsVertical size={15} />
                    </button>

                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                onMouseLeave={() => setMenuOpen(false)}
                                className="absolute right-0 top-full mt-1.5 w-56 bg-[#202327] border border-white/20 shadow-2xl z-30 flex flex-col py-1 text-xs uppercase tracking-wider font-semibold"
                            >
                                <button
                                    onClick={(e) => handleAction(e, handleToggleFavoriteInternal)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                >
                                    {file.isFavorite ? <AiFillHeart className="text-red-500" size={18} /> : <LuHeart size={18} />}
                                    <span>{file.isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
                                </button>

                                {onAddToAlbum && (
                                    <button
                                        onClick={(e) => handleAction(e, onAddToAlbum)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                    >
                                        <LuImagePlus size={18} />
                                        <span>Add to album</span>
                                    </button>
                                )}

                                <button
                                    onClick={(e) => {
                                        handleAction(e, () => alert("Open with feature coming soon!"));
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                >
                                    <LuSmartphone size={18} />
                                    <span>Open with devices</span>
                                </button>

                                {onShare && (
                                    <button
                                        onClick={(e) => handleAction(e, onShare)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-[#B8FE00] hover:bg-[#B8FE00]/10 flex items-center gap-3 transition-colors font-semibold"
                                    >
                                        <LuShare2 size={18} />
                                        <span>Share & Permissions</span>
                                    </button>
                                )}

                                <div className="h-px bg-white/10 my-1 mx-2"></div>

                                <button
                                    onClick={(e) => handleAction(e, onDownload)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                >
                                    <LuDownload size={18} />
                                    <span>Download</span>
                                </button>

                                {onRename && (
                                    <button
                                        onClick={(e) => handleAction(e, onRename)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                    >
                                        <LuPencil size={18} />
                                        <span>Rename</span>
                                    </button>
                                )}

                                <div className="h-px bg-white/10 my-1 mx-2"></div>

                                {onDelete && (
                                    <button
                                        onClick={(e) => handleAction(e, onDelete)}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                    >
                                        <LuTrash2 size={18} />
                                        <span>{deleteLabel}</span>
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Thumbnail Area */}
            <div className="aspect-square bg-[#16181B] flex items-center justify-center relative overflow-hidden border-b border-white/5">
                <FileThumbnail
                    fileId={file._id}
                    fileName={file.originalName}
                    mimeType={file.mimeType}
                    className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300"
                />
                {/* Favorite Indicator */}
                {file.isFavorite && (
                    <div className="absolute top-2.5 left-9 z-10 bg-[#B8FE00] text-black text-[9px] font-black uppercase px-1.5 py-0.5 tracking-wider shadow-md">
                        STARRED
                    </div>
                )}
            </div>

            {/* Info Area */}
            <div className="p-3 bg-[#1e2125]">
                <p className="text-xs font-bold text-white truncate tracking-tight font-sans" title={file.originalName}>
                    {file.originalName}
                </p>
                <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono text-white/50">
                    <span className="text-[#B8FE00] font-bold">{formatSize(file.size)}</span>
                    <span className="uppercase text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/60">
                        {file.mimeType.split('/')[1]?.slice(0, 5) || 'FILE'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
