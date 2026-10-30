"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "../../../lib/api";
import MediaPreviewModal from "../../components/MediaPreviewModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../../components/ui/GlassCard";
import ProgressRing from "../../components/ui/ProgressRing";
import AnimatedCounter from "../../components/ui/AnimatedCounter";
import AddToAlbumModal from "../../components/AddToAlbumModal";
import FileThumbnail from "../../components/FileThumbnail";
import FavoriteButton from "../../components/FavoriteButton";
import Pagination from "../../components/ui/Pagination";
import StorageFileCard from "../../components/StorageFileCard";
import RenameModal from "../../components/RenameModal";
import ShareModal from "../../components/ShareModal";
import MobileContextMenu, { MobileAction } from "../../components/MobileContextMenu";
import { LuEye, LuDownload, LuTrash2, LuImagePlus, LuX, LuHeart, LuSmartphone, LuPencil, LuShare2 } from "react-icons/lu";
import { AiFillHeart } from "react-icons/ai";

interface FileData {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    dateTaken?: string;
    folder: string | null;
    isFavorite: boolean;
}

export default function StoragePage() {
    const params = useParams();
    const username = (params?.user as string) || "user";
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortOrder, setSortOrder] = useState("date-desc");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // File stats
    const [totalFiles, setTotalFiles] = useState(0);

    // Client-side Pagination State (for display)
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 100;

    // Selection state
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);

    // Active file state for mobile touch interactions
    const [activeFileId, setActiveFileId] = useState<string | null>(null);

    // Preview modal state
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Album modal state
    const [addToAlbumModalOpen, setAddToAlbumModalOpen] = useState(false);
    const [filesToAdd, setFilesToAdd] = useState<string[]>([]);

    // Rename modal state
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [fileToRename, setFileToRename] = useState<FileData | null>(null);

    // Share modal state
    const [fileToShare, setFileToShare] = useState<FileData | null>(null);

    // Mobile Context Menu State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileMenuFile, setMobileMenuFile] = useState<FileData | null>(null);

    const fetchContent = useCallback(async () => {
        setLoading(true);

        try {
            // Fetch all files from server with a large limit
            const res = await api.get(`/files?page=1&limit=10000`);
            const allFiles = res.data.files || [];

            setFiles(allFiles);
            setTotalFiles(res.data.pagination?.total || 0);
        } catch (error) {
            console.error("Failed to fetch content", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleDownload = async (fileId: string, fileName: string) => {
        try {
            const response = await api.get(`/files/${fileId}/download`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download file");
        }
    };

    const handlePreview = (index: number) => {
        setSelectedFileIndex(index);
        setPreviewModalOpen(true);
    };

    const handleDeleteClick = (file: FileData) => {
        setFileToDelete(file);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!fileToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/files/${fileToDelete._id}`);
            setFiles(files.filter(f => f._id !== fileToDelete._id));
            setTotalFiles(prev => Math.max(0, prev - 1)); // Decrement total count
            setDeleteModalOpen(false);
            setFileToDelete(null);

            if (previewModalOpen && selectedFileIndex !== null) {
                const currentFile = filteredFiles[selectedFileIndex];
                if (currentFile._id === fileToDelete._id) {
                    setPreviewModalOpen(false);
                    setSelectedFileIndex(null);
                }
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete file");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
        setFileToDelete(null);
    };

    const handleToggleFavorite = (fileId: string, newFavoriteStatus: boolean) => {
        setFiles(files.map(f => f._id === fileId ? { ...f, isFavorite: newFavoriteStatus } : f));
    };

    const handleRenameClick = (file: FileData) => {
        setFileToRename(file);
        setRenameModalOpen(true);
    };

    const handleRename = async (newName: string) => {
        if (!fileToRename) return;

        await api.put(`/files/${fileToRename._id}/rename`, { newName });

        // Update the file in the list
        setFiles(files.map(f =>
            f._id === fileToRename._id ? { ...f, originalName: newName } : f
        ));
    };

    // Selection handlers
    const toggleFileSelection = (fileId: string) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId);
        } else {
            newSelected.add(fileId);
        }
        setSelectedFiles(newSelected);
    };

    const selectAll = () => {
        if (selectedFiles.size === filteredFiles.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(filteredFiles.map(f => f._id)));
        }
    };

    const handleBulkDownload = async () => {
        if (selectedFiles.size === 0) return;

        try {
            const response = await api.post('/files/bulk-download', {
                fileIds: Array.from(selectedFiles)
            }, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `files-${Date.now()}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setSelectedFiles(new Set());
        } catch (err) {
            console.error("Bulk download failed", err);
            alert("Failed to download files. Please try again.");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`)) return;

        try {
            await api.post('/files/bulk-delete', {
                fileIds: Array.from(selectedFiles)
            });

            setSelectedFiles(new Set());
            fetchContent(); // Reload all files to ensure sync
        } catch (err) {
            console.error("Bulk delete failed", err);
            alert("Failed to delete files. Please try again.");
        }
    };

    const handleTouchStart = (fileId: string) => {
        const timer = setTimeout(() => {
            toggleFileSelection(fileId);
        }, 500);
        setTouchTimer(timer);
    };

    const handleTouchEnd = () => {
        if (touchTimer) {
            clearTimeout(touchTimer);
            setTouchTimer(null);
        }
    };

    const handleRowClick = (fileId: string, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }
        if (selectedFiles.size > 0) {
            toggleFileSelection(fileId);
        }
    };

    const handlePreviewNext = () => {
        if (selectedFileIndex !== null && selectedFileIndex < filteredFiles.length - 1) {
            setSelectedFileIndex(selectedFileIndex + 1);
        }
    };


    const handlePreviewPrevious = () => {
        if (selectedFileIndex !== null && selectedFileIndex > 0) {
            setSelectedFileIndex(selectedFileIndex - 1);
        }
    };

    // Mobile Context Menu Handlers
    const handleLongPress = (file: FileData) => {
        if (window.innerWidth < 768) { // Only on mobile
            setMobileMenuFile(file);
            setMobileMenuOpen(true);
        }
    };

    const getMobileMenuActions = (): MobileAction[] => {
        if (!mobileMenuFile) return [];

        const actions: MobileAction[] = [
            {
                label: mobileMenuFile.isFavorite ? "Remove from favorites" : "Add to favorites",
                icon: mobileMenuFile.isFavorite ? <AiFillHeart className="text-red-500" /> : <LuHeart />,
                onClick: async () => {
                    try {
                        const response = await api.patch(`/files/${mobileMenuFile._id}/favorite`);
                        handleToggleFavorite(mobileMenuFile._id, response.data.isFavorite);
                    } catch (e) {
                        console.error("Favorite toggle failed", e);
                    }
                }
            },
            {
                label: "Add to album",
                icon: <LuImagePlus />,
                onClick: () => {
                    setFilesToAdd([mobileMenuFile._id]);
                    setAddToAlbumModalOpen(true);
                }
            },
            {
                label: "Open with devices",
                icon: <LuSmartphone />,
                onClick: () => {
                    alert("Open with devices feature coming soon!");
                },
                divider: true
            },
            {
                label: "Download",
                icon: <LuDownload />,
                onClick: () => handleDownload(mobileMenuFile._id, mobileMenuFile.originalName)
            },
            {
                label: "Rename",
                icon: <LuPencil />,
                onClick: () => handleRenameClick(mobileMenuFile),
                divider: true
            },
            {
                label: "Delete",
                icon: <LuTrash2 />,
                variant: 'danger',
                onClick: () => handleDeleteClick(mobileMenuFile)
            }
        ];

        return actions;
    };

    // Stats Calculation
    const stats = useMemo(() => {
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        const typeStats = files.reduce((acc, file) => {
            const type = file.mimeType.split('/')[0];
            acc[type] = (acc[type] || 0) + file.size;
            return acc;
        }, {} as Record<string, number>);

        return { totalSize, typeStats };
    }, [files]);

    // Date formatting helper
    const formatDateHeader = (dateString: string) => {
        if (!dateString) {
            return "Unknown Date";
        }

        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return "Unknown Date";
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time to compare only dates
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (dateOnly.getTime() === todayOnly.getTime()) {
            return "Today";
        } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    // Group files by date
    const groupFilesByDate = (files: FileData[]) => {
        const groups: { [key: string]: FileData[] } = {};

        files.forEach(file => {
            // Use dateTaken if available, otherwise fall back to uploadedAt
            const dateToUse = file.dateTaken || file.uploadedAt;
            const dateKey = new Date(dateToUse).toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(file);
        });

        return groups;
    };

    // Filter and Sort
    const filteredFiles = useMemo(() => {
        return files
            .filter((file) => {
                const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = filterType === "all" || file.mimeType.startsWith(filterType);
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                // Use dateTaken if available, otherwise fall back to uploadedAt
                const dateA = a.dateTaken || a.uploadedAt;
                const dateB = b.dateTaken || b.uploadedAt;

                if (sortOrder === "date-desc") return new Date(dateB).getTime() - new Date(dateA).getTime();
                if (sortOrder === "date-asc") return new Date(dateA).getTime() - new Date(dateB).getTime();
                if (sortOrder === "name-asc") return a.originalName.localeCompare(b.originalName);
                if (sortOrder === "size-desc") return b.size - a.size;
                return 0;
            });
    }, [files, searchTerm, filterType, sortOrder]);

    // Calculate paginated files for display
    const paginatedFiles = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredFiles.slice(startIndex, endIndex);
    }, [filteredFiles, currentPage]);

    // Calculate total pages for client-side pagination
    const totalPaginationPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, sortOrder]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎬';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📕';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
        return '📄';
    };

    const getTypeColor = (type: string) => {
        return { bg: '', border: 'border-white/10', text: 'text-white' };
    };

    const selectedFile = selectedFileIndex !== null ? filteredFiles[selectedFileIndex] : null;

    return (
        <div className="w-full">
            <div className="max-w-[1500px] mx-auto w-full">
                {/* Header */}
                <motion.div
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 border-b border-white/10 pb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="eyebrow-tag text-pill-lime">VAULT STORAGE REPOSITORY</span>
                            <span className="text-[11px] font-mono text-[#B8FE00] uppercase font-bold tracking-wider">● TELEMETRY ONLINE</span>
                        </div>
                        <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl uppercase tracking-tight text-white mb-2">
                            ZERO-KNOWLEDGE VAULT
                        </h1>
                        <p className="text-white/60 text-sm max-w-xl font-sans">
                            Hardware-isolated storage shards protected by military AES-256 GCM encryption with multi-regional redundancy.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Bulk action buttons */}
                        <AnimatePresence>
                            {selectedFiles.size > 0 && (
                                <motion.div
                                    className="flex flex-wrap items-center gap-2 bg-[#202327] p-1.5 border border-[#B8FE00]/40 shadow-xl"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <button
                                        onClick={handleBulkDownload}
                                        className="px-3.5 py-1.5 bg-[#B8FE00] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center gap-1.5"
                                    >
                                        <LuDownload size={14} /> Download ({selectedFiles.size})
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFilesToAdd(Array.from(selectedFiles));
                                            setAddToAlbumModalOpen(true);
                                        }}
                                        className="px-3.5 py-1.5 bg-[#0720C6] text-white font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-all flex items-center gap-1.5"
                                    >
                                        <LuImagePlus size={14} /> Album ({selectedFiles.size})
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                                    >
                                        <LuTrash2 size={14} /> Delete
                                    </button>
                                    <button
                                        onClick={() => setSelectedFiles(new Set())}
                                        className="px-2.5 py-1.5 text-white/50 hover:text-white font-mono text-xs uppercase transition-all"
                                        title="Clear selection"
                                    >
                                        <LuX size={14} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Link
                            href={`/${username}/upload`}
                            className="px-5 py-2.5 bg-[#B8FE00] text-black font-bold uppercase tracking-wider text-xs hover:bg-white transition-all flex items-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(184,254,0,0.3)]"
                        >
                            <span>+ UPLOAD ASSET</span>
                        </Link>
                    </div>
                </motion.div>

                {/* Neo-Brutalist Stats Telemetry */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <div className="bg-[#202327] p-5 border border-white/10 hover:border-[#B8FE00]/40 transition-colors">
                        <div className="flex items-center justify-between text-xs text-white/50 uppercase font-mono tracking-wider mb-2">
                            <span>TOTAL STORAGE</span>
                            <span className="text-[#B8FE00] font-bold">UNLIMITED</span>
                        </div>
                        <div className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                            <AnimatedCounter value={stats.totalSize / (1024 * 1024)} duration={1.2} suffix=" MB" />
                        </div>
                        <div className="w-full bg-[#16181B] h-1.5 mt-3 overflow-hidden">
                            <div
                                className="bg-[#B8FE00] h-full"
                                style={{ width: `${Math.min(100, Math.max(5, (stats.totalSize / (1024 * 1024 * 500)) * 100))}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-[#202327] p-5 border border-white/10 hover:border-[#B8FE00]/40 transition-colors">
                        <div className="flex items-center justify-between text-xs text-white/50 uppercase font-mono tracking-wider mb-2">
                            <span>INDEXED ASSETS</span>
                            <span className="flex h-2 w-2 rounded-full bg-[#B8FE00] animate-pulse"></span>
                        </div>
                        <div className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                            <AnimatedCounter value={totalFiles} duration={1} />
                        </div>
                        <p className="text-[11px] font-mono text-white/40 mt-3 uppercase">SYNCHRONIZED IN REAL TIME</p>
                    </div>

                    <div className="bg-[#202327] p-5 border border-white/10 hover:border-[#B8FE00]/40 transition-colors">
                        <div className="text-xs text-white/50 uppercase font-mono tracking-wider mb-2">
                            <span>ENCRYPTION ALGORITHM</span>
                        </div>
                        <div className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight uppercase">
                            AES-256 GCM
                        </div>
                        <div className="inline-block mt-2.5 px-2 py-0.5 bg-[#0720C6] text-white text-[10px] font-bold uppercase tracking-wider">
                            HARDWARE SECURED
                        </div>
                    </div>

                    <div className="bg-[#202327] p-5 border border-white/10 hover:border-[#B8FE00]/40 transition-colors">
                        <div className="text-xs text-white/50 uppercase font-mono tracking-wider mb-2">
                            <span>NODE REDUNDANCY</span>
                        </div>
                        <div className="font-display font-extrabold text-3xl sm:text-4xl text-[#B8FE00] tracking-tight">
                            100.0%
                        </div>
                        <p className="text-[11px] font-mono text-white/40 mt-3 uppercase">14 REGIONAL REPLICAS</p>
                    </div>
                </motion.div>

                {/* Filter and Control Bar */}
                <motion.div
                    className="flex flex-col md:flex-row gap-3 mb-6 items-stretch"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="SEARCH BY FILE NAME, MIME TYPE OR HASH..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 bg-[#16181B] border border-white/15 focus:border-[#B8FE00] focus:ring-1 focus:ring-[#B8FE00] outline-none text-white placeholder-white/40 font-mono text-xs uppercase tracking-wider transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                            >
                                <LuX size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-3 bg-[#202327] border border-white/15 text-white font-mono text-xs uppercase tracking-wider focus:border-[#B8FE00] outline-none cursor-pointer"
                        >
                            <option value="all">ALL FORMATS</option>
                            <option value="image">IMAGES (PNG/JPG)</option>
                            <option value="video">VIDEOS (MP4/MKV)</option>
                            <option value="audio">AUDIO (WAV/MP3)</option>
                            <option value="application">DOCUMENTS & ARCHIVES</option>
                        </select>

                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="px-4 py-3 bg-[#202327] border border-white/15 text-white font-mono text-xs uppercase tracking-wider focus:border-[#B8FE00] outline-none cursor-pointer"
                        >
                            <option value="date-desc">NEWEST FIRST</option>
                            <option value="date-asc">OLDEST FIRST</option>
                            <option value="name-asc">NAME (A - Z)</option>
                            <option value="size-desc">SIZE (LARGEST)</option>
                        </select>

                        {/* View Mode Toggle */}
                        <div className="flex bg-[#202327] border border-white/15 p-1 shrink-0">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`px-3 py-1.5 font-bold text-xs uppercase tracking-wider transition-all ${viewMode === "grid" ? "bg-[#B8FE00] text-black" : "text-white/60 hover:text-white"}`}
                            >
                                ⊞ GRID
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-3 py-1.5 font-bold text-xs uppercase tracking-wider transition-all ${viewMode === "list" ? "bg-[#B8FE00] text-black" : "text-white/60 hover:text-white"}`}
                            >
                                ☰ LIST
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                {loading ? (
                    <div className="bg-[#202327] border border-white/10 p-16 text-center shadow-xl">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block text-5xl mb-4 text-[#B8FE00]"
                        >
                            ⚡
                        </motion.div>
                        <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight text-white mb-2">ACCESSING VAULT REGISTRY...</h3>
                        <p className="text-white/40 font-mono text-xs uppercase tracking-wider">RETRIEVING ZERO-KNOWLEDGE CIPHER RECORDS</p>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="bg-[#202327] border border-white/10 p-16 text-center shadow-xl">
                        <div className="text-5xl mb-4 opacity-50">📁</div>
                        <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight text-white mb-2">ZERO ASSETS RECORDED</h3>
                        <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
                            No files match your query in the current shard. Drag & drop assets to initialize encrypted storage.
                        </p>
                        <Link
                            href={`/${username}/upload`}
                            className="inline-block px-6 py-3 bg-[#B8FE00] text-black font-extrabold uppercase tracking-wider text-xs hover:bg-white transition-all shadow-lg"
                        >
                            + UPLOAD FIRST ASSET
                        </Link>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Grid View with Date Grouping */
                    <div className="space-y-8">
                        {(() => {
                            const groupedFiles = groupFilesByDate(paginatedFiles);
                            const sortedDateKeys = Object.keys(groupedFiles).sort((a, b) => {
                                return new Date(b).getTime() - new Date(a).getTime();
                            });

                            return sortedDateKeys.map((dateKey) => {
                                const filesInGroup = groupedFiles[dateKey];
                                const firstFile = filesInGroup[0];

                                return (
                                    <div key={dateKey}>
                                        {/* Date Header */}
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="mb-4"
                                        >
                                            <h2 className="text-2xl font-bold text-white font-display">
                                                {formatDateHeader(firstFile.dateTaken || firstFile.uploadedAt)}
                                            </h2>
                                            <div className="h-px bg-gradient-to-r from-white/50 to-transparent mt-2"></div>
                                        </motion.div>

                                        {/* Files Grid */}
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-6">
                                            {filesInGroup.map((file, index) => {
                                                const isSelected = selectedFiles.has(file._id);
                                                const globalIndex = filteredFiles.indexOf(file);

                                                return (
                                                    <motion.div
                                                        key={file._id}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                                        layout
                                                    >
                                                        <StorageFileCard
                                                            file={file}
                                                            isSelected={isSelected}
                                                            isSelectionMode={selectedFiles.size > 0}
                                                            isActive={activeFileId === file._id}
                                                            onSelect={() => toggleFileSelection(file._id)}
                                                            onToggleFavorite={handleToggleFavorite}
                                                            onPreview={() => handlePreview(globalIndex)}
                                                            onDownload={() => handleDownload(file._id, file.originalName)}
                                                            onShare={() => setFileToShare(file)}
                                                            onAddToAlbum={() => {
                                                                setFilesToAdd([file._id]);
                                                                setAddToAlbumModalOpen(true);
                                                            }}
                                                            onDelete={() => handleDeleteClick(file)}
                                                            onRename={() => handleRenameClick(file)}
                                                            onActivate={() => {
                                                                setActiveFileId(activeFileId === file._id ? null : file._id);
                                                            }}
                                                            onLongPress={() => handleLongPress(file)}
                                                        />
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                ) : (
                    /* List View */
                    <div className="bg-[#202327] border border-white/10 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs md:text-sm">
                                <thead className="bg-[#16181B] border-b border-white/10 text-white/50 font-mono uppercase text-[11px] tracking-wider">
                                    <tr>
                                        <th className={`px-2 md:px-6 py-3 md:py-4 ${selectedFiles.size > 0 ? '' : 'hidden md:table-cell'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                                                onChange={selectAll}
                                                className="w-4 h-4 md:w-5 md:h-5 cursor-pointer accent-[#B8FE00]"
                                            />
                                        </th>
                                        <th className="px-2 md:px-6 py-3 md:py-4 font-bold text-white">Asset Name</th>
                                        <th className="hidden lg:table-cell px-6 py-4">Ingestion Date</th>
                                        <th className="hidden lg:table-cell px-6 py-4">Mime Shard</th>
                                        <th className="hidden md:table-cell px-6 py-4">Volume</th>
                                        <th className="px-2 md:px-6 py-3 md:py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {paginatedFiles.map((file, index) => {
                                        const isSelected = selectedFiles.has(file._id);

                                        const handleTouchStart = () => {
                                            const timer = setTimeout(() => {
                                                // Enter selection mode and select this file
                                                toggleFileSelection(file._id);
                                            }, 500); // 500ms long press
                                            setTouchTimer(timer);
                                        };

                                        const handleTouchEnd = () => {
                                            if (touchTimer) {
                                                clearTimeout(touchTimer);
                                                setTouchTimer(null);
                                            }
                                        };

                                        return (
                                            <motion.tr
                                                key={file._id}
                                                className={`group transition-colors cursor-pointer relative ${isSelected ? 'bg-[#B8FE00]/10 border-l-2 border-[#B8FE00]' : 'hover:bg-white/5'}`}
                                                onClick={(e) => handleRowClick(file._id, e)}
                                                onTouchStart={handleTouchStart}
                                                onTouchEnd={handleTouchEnd}
                                                onTouchMove={handleTouchEnd}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.02 }}
                                            >
                                                <td className={`px-2 md:px-6 py-3 md:py-4 ${selectedFiles.size > 0 ? '' : 'hidden md:table-cell'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleFileSelection(file._id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-4 h-4 md:w-5 md:h-5 cursor-pointer accent-[#B8FE00]"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-2 md:px-6 py-3 md:py-4">
                                                    {/* Mobile card layout */}
                                                    <div className="md:hidden flex flex-col gap-2 w-full overflow-hidden">
                                                        {/* Name and icon */}
                                                        <div className="flex items-center gap-2 min-w-0 w-full">
                                                            <span className="text-xl shrink-0">{getFileIcon(file.mimeType)}</span>
                                                            <span className="font-medium text-white font-body truncate flex-1 min-w-0 max-w-[calc(100vw-200px)]" title={file.originalName}>{file.originalName}</span>
                                                        </div>
                                                        {/* Actions and favorite */}
                                                        <div className="flex items-center gap-2">
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <FavoriteButton
                                                                    fileId={file._id}
                                                                    isFavorite={file.isFavorite}
                                                                    onToggle={handleToggleFavorite}
                                                                    inline={true}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1 ml-auto shrink-0">
                                                                <motion.button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handlePreview((currentPage - 1) * ITEMS_PER_PAGE + index);
                                                                    }}
                                                                    className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    title="Preview"
                                                                >
                                                                    <LuEye size={18} />
                                                                </motion.button>
                                                                <motion.button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDownload(file._id, file.originalName);
                                                                    }}
                                                                    className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    title="Download"
                                                                >
                                                                    <LuDownload size={18} />
                                                                </motion.button>
                                                                <motion.button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteClick(file);
                                                                    }}
                                                                    className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    title="Delete"
                                                                >
                                                                    <LuTrash2 size={18} />
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Desktop layout */}
                                                    <div className="hidden md:flex items-center gap-3 min-w-0">
                                                        <span className="text-2xl shrink-0">{getFileIcon(file.mimeType)}</span>
                                                        <span className="font-medium text-white font-body truncate min-w-0 flex-1" title={file.originalName}>{file.originalName}</span>
                                                    </div>
                                                </td>
                                                <td className="hidden lg:table-cell px-6 py-4 text-gray-400 font-body">
                                                    {new Date(file.uploadedAt).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="hidden lg:table-cell px-6 py-4 text-gray-400 capitalize font-body">{file.mimeType.split('/')[1]}</td>
                                                <td className="hidden lg:table-cell px-6 py-4 text-gray-400 font-body">{formatSize(file.size)}</td>
                                                <td className="hidden md:table-cell px-6 py-4 text-right">
                                                    {!isSelected && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <FavoriteButton
                                                                    fileId={file._id}
                                                                    isFavorite={file.isFavorite}
                                                                    onToggle={handleToggleFavorite}
                                                                    inline={true}
                                                                />
                                                            </div>
                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePreview((currentPage - 1) * ITEMS_PER_PAGE + index);
                                                                }}
                                                                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Preview"
                                                            >
                                                                <LuEye size={18} />
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownload(file._id, file.originalName);
                                                                }}
                                                                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Download"
                                                            >
                                                                <LuDownload size={18} />
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFileToShare(file);
                                                                }}
                                                                className="p-2 text-[#B8FE00] hover:bg-[#B8FE00]/10 rounded-lg transition-colors"
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Share Link & Access"
                                                            >
                                                                <LuShare2 size={18} />
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFilesToAdd([file._id]);
                                                                    setAddToAlbumModalOpen(true);
                                                                }}
                                                                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Add to Album"
                                                            >
                                                                <LuImagePlus size={18} />
                                                            </motion.button>
                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(file);
                                                                }}
                                                                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Delete"
                                                            >
                                                                <LuTrash2 size={18} />
                                                            </motion.button>
                                                        </div>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
                }
            </div >

            {/* Pagination Controls */}
            < div className="mt-8 pb-8" >
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPaginationPages}
                    onPageChange={setCurrentPage}
                />
            </div >


            {/* Preview Modal */}
            {
                selectedFile && (
                    <MediaPreviewModal
                        isOpen={previewModalOpen}
                        fileId={selectedFile._id}
                        fileName={selectedFile.originalName}
                        fileType={selectedFile.mimeType}
                        fileSize={formatSize(selectedFile.size)}
                        onClose={() => {
                            setPreviewModalOpen(false);
                            setSelectedFileIndex(null);
                        }}
                        onDelete={() => {
                            setPreviewModalOpen(false);
                            handleDeleteClick(selectedFile);
                        }}
                        onDownload={() => handleDownload(selectedFile._id, selectedFile.originalName)}
                        onShare={() => setFileToShare(selectedFile)}
                        onNext={handlePreviewNext}
                        onPrevious={handlePreviewPrevious}
                        hasNext={selectedFileIndex !== null && selectedFileIndex < filteredFiles.length - 1}
                        hasPrevious={selectedFileIndex !== null && selectedFileIndex > 0}
                    />
                )
            }

            {/* Add to Album Modal */}
            <AddToAlbumModal
                isOpen={addToAlbumModalOpen}
                onClose={() => setAddToAlbumModalOpen(false)}
                fileIds={filesToAdd}
                onSuccess={() => {
                    setAddToAlbumModalOpen(false);
                    setFilesToAdd([]);
                    setSelectedFiles(new Set());
                }}
            />

            {/* Rename Modal */}
            {
                fileToRename && (
                    <RenameModal
                        isOpen={renameModalOpen}
                        onClose={() => {
                            setRenameModalOpen(false);
                            setFileToRename(null);
                        }}
                        currentName={fileToRename.originalName}
                        onRename={handleRename}
                        itemType="file"
                    />
                )
            }

            {/* Delete Confirmation Modal */}
            {
                fileToDelete && (
                    <DeleteConfirmModal
                        isOpen={deleteModalOpen}
                        fileName={fileToDelete.originalName}
                        fileSize={formatSize(fileToDelete.size)}
                        fileType={fileToDelete.mimeType.split('/')[1]?.toUpperCase() || 'Unknown'}
                        onConfirm={handleDeleteConfirm}
                        onCancel={handleDeleteCancel}
                        isDeleting={isDeleting}
                    />
                )
            }

            {/* Share & Permissions Modal */}
            <ShareModal
                isOpen={!!fileToShare}
                onClose={() => setFileToShare(null)}
                file={fileToShare}
            />

            {/* Mobile Context Menu via Portal */}
            <MobileContextMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                actions={getMobileMenuActions()}
                title={mobileMenuFile?.originalName}
            />
        </div>
    );
}