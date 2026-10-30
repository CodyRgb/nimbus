"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../../lib/api";
import MediaPreviewModal from "../../components/MediaPreviewModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import { motion } from "framer-motion";
import FavoriteButton from "../../components/FavoriteButton";
import Pagination from "../../components/ui/Pagination";
import StorageFileCard from "../../components/StorageFileCard";
import GlassCard from "../../components/ui/GlassCard";
import RenameModal from "../../components/RenameModal";
import { LuEye, LuDownload, LuTrash2 } from "react-icons/lu";

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

    // Client-side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 40;

    // Active file state for mobile touch interactions
    const [activeFileId, setActiveFileId] = useState<string | null>(null);

    // Rename modal state
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [fileToRename, setFileToRename] = useState<FileData | null>(null);

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
                return matchesSearch;
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
    }, [files, searchTerm, sortOrder]);

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
    }, [searchTerm, sortOrder]);

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

    const selectedFile = selectedFileIndex !== null ? filteredFiles[selectedFileIndex] : null;

    return (
        <div className="w-full text-white">
            <div className="max-w-[1500px] mx-auto w-full">
                {/* Header */}
                <motion.div
                    className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-6 border-b border-white/10 gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="eyebrow-tag text-pill-lime">PINNED ASSETS</span>
                            <span className="text-[11px] font-mono text-[#B8FE00] uppercase font-bold tracking-wider">● REAL-TIME SYNC</span>
                        </div>
                        <h1 className="font-display font-extrabold text-4xl sm:text-5xl uppercase tracking-tight text-white mb-2">
                            STARRED VAULT ASSETS
                        </h1>
                        <p className="text-white/60 text-sm font-sans max-w-xl">
                            Fast access to your frequently referenced cryptographic files and high-priority assets.
                        </p>
                    </div>
                </motion.div>

                {/* Controls */}
                <motion.div
                    className="flex flex-col md:flex-row gap-3 mb-6 items-stretch"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="SEARCH STARRED ASSETS BY NAME OR EXTENSION..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 bg-[#16181B] border border-white/15 focus:border-[#B8FE00] focus:ring-1 focus:ring-[#B8FE00] outline-none text-white placeholder-white/40 font-mono text-xs uppercase tracking-wider transition-all"
                        />
                    </div>
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
                </motion.div>

                {/* Content */}
                {loading ? (
                    <div className="bg-[#202327] border border-white/10 p-16 text-center shadow-xl">
                        <div className="inline-block animate-spin text-[#B8FE00] text-4xl mb-4">⚡</div>
                        <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight text-white mb-2">SYNCING STARRED ASSETS...</h3>
                        <p className="text-white/40 font-mono text-xs uppercase">QUERYING DECENTRALIZED REPOSITORY</p>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="bg-[#202327] border border-white/10 p-16 text-center shadow-xl max-w-2xl mx-auto">
                        <div className="text-5xl mb-4 opacity-50">⭐</div>
                        <h3 className="font-display font-extrabold text-3xl uppercase tracking-tight text-white mb-2">ZERO STARRED ASSETS</h3>
                        <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
                            You haven't pinned any files yet. Open your storage vault and click the Star or Heart icon on any file to bookmark it here.
                        </p>
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
                                            className="mb-4 flex items-center gap-3"
                                        >
                                            <span className="w-2 h-2 bg-[#B8FE00]"></span>
                                            <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight text-white">
                                                {formatDateHeader(firstFile.dateTaken || firstFile.uploadedAt)}
                                            </h2>
                                            <div className="h-px bg-white/10 flex-1 ml-2"></div>
                                        </motion.div>

                                        {/* Files Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {filesInGroup.map((file, index) => {
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
                                                            isSelected={false}
                                                            isSelectionMode={false}
                                                            isActive={activeFileId === file._id}
                                                            onSelect={() => { }}
                                                            onToggleFavorite={handleToggleFavorite}
                                                            onPreview={() => handlePreview(globalIndex)}
                                                            onDownload={() => handleDownload(file._id, file.originalName)}
                                                            onAddToAlbum={undefined}
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
                    <div className="bg-[#202327] border border-white/10 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs md:text-sm">
                                <thead className="bg-[#16181B] border-b border-white/10 text-white/50 font-mono uppercase text-[11px] tracking-wider">
                                    <tr>
                                        <th className="px-2 md:px-6 py-3 md:py-4">
                                            {/* Favorite button column */}
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
                                        return (
                                            <motion.tr
                                                key={file._id}
                                                className="group transition-colors cursor-pointer hover:bg-white/5 relative"
                                                onClick={() => handlePreview((currentPage - 1) * ITEMS_PER_PAGE + index)}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.02 }}
                                            >
                                                <td className="px-2 md:px-6 py-3 md:py-4" colSpan={5}>
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
                                                                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    title="Remove from Favorites"
                                                                >
                                                                    <LuTrash2 size={18} />
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Desktop layout */}
                                                    <div className="hidden md:flex items-center gap-3 min-w-0">
                                                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                                            <FavoriteButton
                                                                fileId={file._id}
                                                                isFavorite={file.isFavorite}
                                                                onToggle={handleToggleFavorite}
                                                                inline={true}
                                                            />
                                                        </div>
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
                                                    <div className="flex items-center justify-end gap-2">
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
                                                                handleDeleteClick(file);
                                                            }}
                                                            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            title="Remove from Favorites"
                                                        >
                                                            <LuTrash2 size={18} />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table >
                        </div >
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
                        onNext={handlePreviewNext}
                        onPrevious={handlePreviewPrevious}
                        hasNext={selectedFileIndex !== null && selectedFileIndex < filteredFiles.length - 1}
                        hasPrevious={selectedFileIndex !== null && selectedFileIndex > 0}
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
        </div >
    );
}
