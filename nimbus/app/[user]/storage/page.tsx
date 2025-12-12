"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
    const ITEMS_PER_PAGE = 40;

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
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-7xl md:mx-0 mx-auto">
                {/* Header */}
                <motion.div
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-2 font-display">Storage</h1>
                        <p className="text-gray-400 font-body">Manage your files in the cloud</p>
                    </div>

                    {/* Bulk action buttons */}
                    <AnimatePresence>
                        {selectedFiles.size > 0 && (
                            <motion.div
                                className="flex gap-3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <motion.button
                                    onClick={handleBulkDownload}
                                    className="px-4 py-2 glass-card border border-white/20 text-white rounded-xl hover:bg-white/10 font-medium text-sm transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    ⬇ Download ({selectedFiles.size})
                                </motion.button>
                                <motion.button
                                    onClick={() => {
                                        setFilesToAdd(Array.from(selectedFiles));
                                        setAddToAlbumModalOpen(true);
                                    }}
                                    className="px-4 py-2 glass-card border border-white/20 text-white rounded-xl hover:bg-white/10 font-medium text-sm transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    🖼 Add to Album ({selectedFiles.size})
                                </motion.button>
                                <motion.button
                                    onClick={handleBulkDelete}
                                    className="px-4 py-2 glass-card border border-white/20 text-white rounded-xl hover:bg-white/10 font-medium text-sm transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    🗑 Delete ({selectedFiles.size})
                                </motion.button>
                                <motion.button
                                    onClick={() => setSelectedFiles(new Set())}
                                    className="px-4 py-2 glass-card border border-gray-500/30 text-gray-400 rounded-xl hover:bg-gray-500/10 font-medium text-sm transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    ✕ Cancel
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <GlassCard className="p-8 mb-8 border border-white/10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                            <div>
                                <p className="text-sm text-gray-400 mb-2 font-body">Total Storage Usage</p>
                                <div className="text-4xl font-bold text-gradient font-display">
                                    <AnimatedCounter value={stats.totalSize / (1024 * 1024)} duration={1.5} suffix=" MB" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-2 font-body">Total Files</p>
                                <div className="text-4xl font-bold text-white font-display">
                                    <AnimatedCounter value={totalFiles} duration={1} />
                                </div>
                            </div>
                        </div>

                        {/* Type breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(stats.typeStats).map(([type, size]) => {
                                const colors = getTypeColor(type);
                                return (
                                    <motion.div
                                        key={type}
                                        className={`glass-card p-4 bg-linear-to-br ${colors.bg} border ${colors.border}`}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className={`text-2xl font-bold ${colors.text} mb-1 font-display`}>
                                            {formatSize(size)}
                                        </div>
                                        <div className="text-sm text-gray-400 capitalize font-body">{type}</div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Controls */}
                <motion.div
                    className="flex flex-col md:flex-row gap-4 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="🔍 Search files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-6 py-3 glass-card border border-white/10 rounded-xl focus:ring-2 focus:ring-white outline-none text-white placeholder-gray-500 bg-white/5 font-body"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-6 py-3 glass-card border border-white/10 rounded-xl focus:ring-2 focus:ring-white outline-none text-white bg-white/5 font-body"
                    >
                        <option value="all">All Types</option>
                        <option value="image">Images</option>
                        <option value="video">Videos</option>
                        <option value="audio">Audio</option>
                        <option value="application">Documents</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="px-6 py-3 glass-card border border-white/10 rounded-xl focus:ring-2 focus:ring-white outline-none text-white bg-white/5 font-body"
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="size-desc">Size (Largest)</option>
                    </select>

                    {/* View Mode Toggle */}
                    <div className="flex gap-2 glass-card p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`px-4 py-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
                        >
                            ⊞ Grid
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-4 py-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
                        >
                            ☰ List
                        </button>
                    </div>
                </motion.div>

                {/* Content */}
                {loading ? (
                    <GlassCard className="p-12 text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block text-6xl mb-4"
                        >
                            ⚡
                        </motion.div>
                        <p className="text-gray-400 font-body">Loading your files...</p>
                    </GlassCard>
                ) : filteredFiles.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <div className="text-6xl mb-4">📁</div>
                        <p className="text-gray-400 text-lg font-body">No files found.</p>
                    </GlassCard>
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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {filesInGroup.map((file, index) => {
                                                const isSelected = selectedFiles.has(file._id);
                                                const globalIndex = paginatedFiles.findIndex(f => f._id === file._id);

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
                                                            onAddToAlbum={() => {
                                                                setFilesToAdd([file._id]);
                                                                setAddToAlbumModalOpen(true);
                                                            }}
                                                            onDelete={() => handleDeleteClick(file)}
                                                            onRename={() => handleRenameClick(file)}
                                                            onActivate={() => {
                                                                setActiveFileId(activeFileId === file._id ? null : file._id);
                                                            }}
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
                    <GlassCard className="overflow-hidden">
                        <div className="overflow-x-auto md:overflow-x-visible">
                            <table className="w-full text-left text-xs md:text-sm">
                                <thead className="glass-card border-b border-white/10">
                                    <tr>
                                        <th className={`px-2 md:px-6 py-3 md:py-4 ${selectedFiles.size > 0 ? '' : 'hidden md:table-cell'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                                                onChange={selectAll}
                                                className="w-4 h-4 md:w-5 md:h-5 cursor-pointer accent-aurora-blue"
                                            />
                                        </th>
                                        <th className="px-2 md:px-6 py-3 md:py-4 font-semibold text-white font-display">Name</th>
                                        <th className="hidden lg:table-cell px-6 py-4 font-semibold text-white font-display">Date Uploaded</th>
                                        <th className="hidden lg:table-cell px-6 py-4 font-semibold text-white font-display">Type</th>
                                        <th className="hidden md:table-cell px-6 py-4 font-semibold text-white font-display">Size</th>
                                        <th className="px-2 md:px-6 py-3 md:py-4 font-semibold text-white font-display text-right">Actions</th>
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
                                                className={`group transition-colors cursor-pointer relative ${isSelected ? 'bg-aurora-blue/10' : 'hover:bg-white/5'}`}
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
                                                            className="w-4 h-4 md:w-5 md:h-5 cursor-pointer accent-aurora-blue"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-2 md:px-6 py-3 md:py-4">
                                                    {/* Mobile card layout */}
                                                    <div className="md:hidden flex flex-col gap-2">
                                                        {/* Name and icon */}
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl">{getFileIcon(file.mimeType)}</span>
                                                            <span className="font-medium text-white font-body truncate flex-1">{file.originalName}</span>
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
                                                            <div className="flex items-center gap-1 ml-auto">
                                                                <motion.button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handlePreview(index);
                                                                    }}
                                                                    className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    title="Preview"
                                                                >
                                                                    👁️
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
                                                                    ⬇️
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
                                                                    🗑️
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Desktop layout */}
                                                    <div className="hidden md:flex items-center gap-3">
                                                        <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                                                        <span className="font-medium text-white font-body truncate">{file.originalName}</span>
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
                                                                    handlePreview(index);
                                                                }}
                                                                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                title="Preview"
                                                            >
                                                                👁️
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
                                                                ⬇️
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
                                                                🖼️
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
                                                                🗑️
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
                    </GlassCard>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="mt-8 pb-8">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPaginationPages}
                    onPageChange={setCurrentPage}
                />
            </div>


            {/* Preview Modal */}
            {selectedFile && (
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
                    onNext={handlePreviewNext}
                    onPrevious={handlePreviewPrevious}
                    hasNext={selectedFileIndex !== null && selectedFileIndex < filteredFiles.length - 1}
                    hasPrevious={selectedFileIndex !== null && selectedFileIndex > 0}
                />
            )}

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
            {fileToRename && (
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
            )}

            {/* Delete Confirmation Modal */}
            {fileToDelete && (
                <DeleteConfirmModal
                    isOpen={deleteModalOpen}
                    fileName={fileToDelete.originalName}
                    fileSize={formatSize(fileToDelete.size)}
                    fileType={fileToDelete.mimeType.split('/')[1]?.toUpperCase() || 'Unknown'}
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
}