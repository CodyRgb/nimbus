
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import StorageFileCard from './StorageFileCard';
import Pagination from './ui/Pagination';

interface FileData {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
    folder: string | null;
    isFavorite: boolean;
    thumbnailUrl?: string; // Optional if available directly
}

interface FileSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (fileIds: string[], selectedFilesData?: FileData[]) => void;
    title?: string;
    confirmLabel?: string;
    selectionMode?: 'single' | 'multiple';
}

export default function FileSelectionModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Select Files",
    confirmLabel = "Add Selected",
    selectionMode = 'multiple'
}: FileSelectionModalProps) {
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

    // Search and Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        if (isOpen) {
            fetchFiles();
            setSelectedFiles(new Set()); // Reset selection on open
        }
    }, [isOpen]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            // Fetch all files for client-side filtering/sorting for now
            const res = await api.get(`/files?page=1&limit=10000`);
            setFiles(res.data.files || []);
        } catch (error) {
            console.error("Failed to fetch files", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFileSelection = (fileId: string) => {
        if (selectionMode === 'single') {
            const newSelected = new Set([fileId]);
            setSelectedFiles(newSelected);
        } else {
            const newSelected = new Set(selectedFiles);
            if (newSelected.has(fileId)) {
                newSelected.delete(fileId);
            } else {
                newSelected.add(fileId);
            }
            setSelectedFiles(newSelected);
        }
    };

    // Filter Logic
    const filteredFiles = useMemo(() => {
        return files.filter((file) => {
            const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === "all" || file.mimeType.startsWith(filterType);
            return matchesSearch && matchesType;
        });
    }, [files, searchTerm, filterType]);

    // Pagination Logic
    const paginatedFiles = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredFiles.slice(startIndex, endIndex);
    }, [filteredFiles, currentPage]);

    const totalPaginationPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);

    const handleConfirm = () => {
        const selectedIds = Array.from(selectedFiles);
        // Find the full file objects for selected Ids
        const selectedFilesData = files.filter(f => selectedIds.includes(f._id));
        onConfirm(selectedIds, selectedFilesData);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1A1A1A]">
                            <h2 className="text-xl font-semibold text-white">{title}</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
                        </div>

                        {/* Controls */}
                        <div className="p-4 border-b border-white/10 bg-white/5 flex gap-4 flex-wrap">
                            <input
                                type="text"
                                placeholder="🔍 Search files..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 min-w-[200px] px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500"
                            />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="image">Images</option>
                                <option value="video">Videos</option>
                                <option value="audio">Audio</option>
                                <option value="application">Documents</option>
                            </select>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-[#0A0A0A]">
                            {loading ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : filteredFiles.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">No files found</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {paginatedFiles.map((file) => (
                                        <div key={file._id} onClick={() => toggleFileSelection(file._id)} className="cursor-pointer">
                                            <StorageFileCard
                                                file={file}
                                                isSelected={selectedFiles.has(file._id)}
                                                isSelectionMode={true}
                                                onSelect={() => toggleFileSelection(file._id)}
                                                onToggleFavorite={() => { }}
                                                onPreview={() => { }}
                                                onDownload={() => { }}
                                                showActions={false}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {!loading && filteredFiles.length > 0 && (
                                <div className="mt-8 flex justify-center">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPaginationPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 bg-[#1A1A1A] flex justify-between items-center">
                            <div className="text-gray-400">
                                {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={selectedFiles.size === 0}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
                                >
                                    {confirmLabel} ({selectedFiles.size})
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
