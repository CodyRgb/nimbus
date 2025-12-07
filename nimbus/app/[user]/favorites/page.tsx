"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../../lib/api";
import MediaPreviewModal from "../../components/MediaPreviewModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import { motion } from "framer-motion";
import GlassCard from "../../components/ui/GlassCard";
import FavoriteButton from "../../components/FavoriteButton";
import FileThumbnail from "../../components/FileThumbnail";

interface FileData {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
    folder: string | null;
    isFavorite: boolean;
}

export default function FavoritesPage() {
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("date-desc");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Preview modal state
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/files/favorites");
            setFiles(res.data);
        } catch (error) {
            console.error("Failed to fetch favorites", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

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
        if (!newFavoriteStatus) {
            // If unfavorited, remove from the list
            setFiles(files.filter(f => f._id !== fileId));
        } else {
            // Update the file in the list
            setFiles(files.map(f => f._id === fileId ? { ...f, isFavorite: newFavoriteStatus } : f));
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

    // Filter and Sort
    const filteredFiles = useMemo(() => {
        return files
            .filter((file) => {
                const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesSearch;
            })
            .sort((a, b) => {
                if (sortOrder === "date-desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                if (sortOrder === "date-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                if (sortOrder === "name-asc") return a.originalName.localeCompare(b.originalName);
                if (sortOrder === "size-desc") return b.size - a.size;
                return 0;
            });
    }, [files, searchTerm, sortOrder]);

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
        switch (type) {
            case 'image': return { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30', text: 'text-blue-400' };
            case 'video': return { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30', text: 'text-purple-400' };
            case 'audio': return { bg: 'from-pink-500/20 to-pink-600/20', border: 'border-pink-500/30', text: 'text-pink-400' };
            case 'application': return { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-500/30', text: 'text-orange-400' };
            default: return { bg: 'from-gray-500/20 to-gray-600/20', border: 'border-gray-500/30', text: 'text-gray-400' };
        }
    };

    const selectedFile = selectedFileIndex !== null ? filteredFiles[selectedFileIndex] : null;

    return (
        <div className="min-h-screen bg-linear-to-br from-deep-space-start via-deep-space-end to-deep-space-start text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-2 font-display">❤️ Favorites</h1>
                        <p className="text-gray-400 font-body">Your favorite files in one place</p>
                    </div>
                </motion.div>

                {/* Controls */}
                <motion.div
                    className="flex flex-col md:flex-row gap-4 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="🔍 Search favorites..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-6 py-3 glass-card border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-blue outline-none text-white placeholder-gray-500 bg-white/5 font-body"
                        />
                    </div>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="px-6 py-3 glass-card border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-blue outline-none text-white bg-white/5 font-body"
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
                            className={`px-4 py-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-aurora-blue text-white" : "text-gray-400 hover:text-white"}`}
                        >
                            ⊞ Grid
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-4 py-2 rounded-lg transition-all ${viewMode === "list" ? "bg-aurora-blue text-white" : "text-gray-400 hover:text-white"}`}
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
                        <p className="text-gray-400 font-body">Loading your favorites...</p>
                    </GlassCard>
                ) : filteredFiles.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                        <div className="text-6xl mb-4">💔</div>
                        <p className="text-gray-400 text-lg font-body mb-2">No favorites yet.</p>
                        <p className="text-gray-500 text-sm font-body">Click the heart icon on any file to add it to your favorites!</p>
                    </GlassCard>
                ) : viewMode === "grid" ? (
                    /* Grid View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredFiles.map((file, index) => {
                            const fileType = file.mimeType.split('/')[0];
                            const colors = getTypeColor(fileType);

                            return (
                                <motion.div
                                    key={file._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    layout
                                >
                                    <GlassCard
                                        className={`p-6 cursor-pointer bg-linear-to-br ${colors.bg} border ${colors.border} relative`}
                                        onClick={() => handlePreview(index)}
                                    >
                                        {/* Favorite Button */}
                                        <FavoriteButton
                                            fileId={file._id}
                                            isFavorite={file.isFavorite}
                                            onToggle={handleToggleFavorite}
                                        />

                                        {/* File Preview/Icon */}
                                        <div className="h-40 mb-4 flex items-center justify-center relative rounded-lg overflow-hidden bg-black/20">
                                            {(file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/')) ? (
                                                <FileThumbnail
                                                    fileId={file._id}
                                                    fileName={file.originalName}
                                                    mimeType={file.mimeType}
                                                    className="w-full h-full"
                                                />
                                            ) : (
                                                <motion.div
                                                    className="text-6xl"
                                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                                    transition={{ type: "spring" }}
                                                >
                                                    {getFileIcon(file.mimeType)}
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* File info */}
                                        <h3 className="font-semibold truncate mb-2 text-white font-display" title={file.originalName}>
                                            {file.originalName}
                                        </h3>
                                        <div className="flex justify-between items-center text-sm text-gray-400 mb-4 font-body">
                                            <span>{formatSize(file.size)}</span>
                                            <span className="capitalize">{fileType}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <motion.button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePreview(index);
                                                }}
                                                className="flex-1 px-3 py-2 glass-card border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/10 text-xs transition-all"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                👁
                                            </motion.button>
                                            <motion.button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(file._id, file.originalName);
                                                }}
                                                className="flex-1 px-3 py-2 glass-card border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/10 text-xs transition-all"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                ⬇
                                            </motion.button>
                                            <motion.button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(file);
                                                }}
                                                className="px-3 py-2 glass-card border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 text-xs transition-all"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                🗑
                                            </motion.button>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    /* List View */
                    <GlassCard className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="glass-card border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-white font-display">Name</th>
                                        <th className="px-6 py-4 font-semibold text-white font-display">Size</th>
                                        <th className="px-6 py-4 font-semibold text-white font-display">Type</th>
                                        <th className="px-6 py-4 text-right font-semibold text-white font-display">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredFiles.map((file, index) => {
                                        return (
                                            <motion.tr
                                                key={file._id}
                                                className="transition-colors cursor-pointer hover:bg-white/5"
                                                onClick={() => handlePreview(index)}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.02 }}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                                                        <span className="font-medium text-white font-body">{file.originalName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 font-body">{formatSize(file.size)}</td>
                                                <td className="px-6 py-4 text-gray-400 capitalize font-body">{file.mimeType.split('/')[1]}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePreview(index);
                                                            }}
                                                            className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            👁
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownload(file._id, file.originalName);
                                                            }}
                                                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            ⬇
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteClick(file);
                                                            }}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            🗑
                                                        </motion.button>
                                                        <div onClick={(e) => e.stopPropagation()} className="relative">
                                                            <FavoriteButton
                                                                fileId={file._id}
                                                                isFavorite={file.isFavorite}
                                                                onToggle={handleToggleFavorite}
                                                            />
                                                        </div>
                                                    </div>
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
