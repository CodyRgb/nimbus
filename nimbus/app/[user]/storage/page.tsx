"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../../lib/api";
import MediaPreviewModal from "../../components/MediaPreviewModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";

interface FileData {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
    folder: string | null;
}

export default function StoragePage() {
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortOrder, setSortOrder] = useState("date-desc");

    // Selection state
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);

    // Preview modal state
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchContent = useCallback(async () => {
        setLoading(true);
        try {
            // Just fetch all files (or root files if backend still filters, but we want all files now)
            // If backend filters by folderId=root by default, we might need to adjust backend or pass nothing.
            // Let's assume we want to see all files flat for now since folders are removed from UI.
            // Or maybe just root files? User said "remove option for uploading folders", implies flat structure.
            // I will fetch all files.
            const res = await api.get("/files");
            setFiles(res.data);
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

            // Remove from local state
            setFiles(files.filter(f => f._id !== fileToDelete._id));

            // Close modals
            setDeleteModalOpen(false);
            setFileToDelete(null);

            // If preview was open for this file, close it
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
            fetchContent();
        } catch (err) {
            console.error("Bulk delete failed", err);
            alert("Failed to delete files. Please try again.");
        }
    };

    // Touch handlers for mobile
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

    // Filter and Sort
    const filteredFiles = useMemo(() => {
        return files
            .filter((file) => {
                const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = filterType === "all" || file.mimeType.startsWith(filterType);
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                if (sortOrder === "date-desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                if (sortOrder === "date-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                if (sortOrder === "name-asc") return a.originalName.localeCompare(b.originalName);
                if (sortOrder === "size-desc") return b.size - a.size;
                return 0;
            });
    }, [files, searchTerm, filterType, sortOrder]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getBarColor = (type: string) => {
        switch (type) {
            case 'image': return 'bg-blue-500';
            case 'video': return 'bg-purple-500';
            case 'application': return 'bg-orange-500';
            default: return 'bg-gray-500';
        }
    };

    const selectedFile = selectedFileIndex !== null ? filteredFiles[selectedFileIndex] : null;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Storage</h1>

                {/* Bulk action buttons */}
                {selectedFiles.size > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleBulkDownload}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                        >
                            Download ({selectedFiles.size})
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                        >
                            Delete ({selectedFiles.size})
                        </button>
                        <button
                            onClick={() => setSelectedFiles(new Set())}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Storage Usage</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatSize(stats.totalSize)}</p>
                    </div>
                </div>
                <div className="w-full h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                    {Object.entries(stats.typeStats).map(([type, size]) => (
                        <div
                            key={type}
                            style={{ width: `${(size / stats.totalSize) * 100}%` }}
                            className={`h-full ${getBarColor(type)}`}
                            title={`${type}: ${formatSize(size)}`}
                        />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                >
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="application">Documents</option>
                </select>
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="size-desc">Size (Largest)</option>
                </select>
            </div>

            {/* Content List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : filteredFiles.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No files found.
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white font-semibold border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                                                onChange={selectAll}
                                                className="w-5 h-5 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Size</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredFiles.map((file, index) => {
                                        const isSelected = selectedFiles.has(file._id);
                                        return (
                                            <tr
                                                key={file._id}
                                                className={`transition-colors cursor-pointer ${isSelected
                                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }`}
                                                onClick={(e) => handleRowClick(file._id, e)}
                                            >
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleFileSelection(file._id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-5 h-5 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    <div className="flex items-center">
                                                        <span className="mr-3 text-xl">📄</span>
                                                        {file.originalName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{formatSize(file.size)}</td>
                                                <td className="px-6 py-4 capitalize">{file.mimeType.split('/')[1]}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {!isSelected ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePreview(index);
                                                                }}
                                                                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                                title="Preview"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownload(file._id, file.originalName);
                                                                }}
                                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                                title="Download"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(file);
                                                                }}
                                                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 dark:text-gray-500">Selected</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredFiles.map((file, index) => {
                                const isSelected = selectedFiles.has(file._id);
                                return (
                                    <div
                                        key={file._id}
                                        className={`p-4 transition-colors ${isSelected
                                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                                : 'active:bg-gray-50 dark:active:bg-gray-700/50'
                                            }`}
                                        onTouchStart={() => handleTouchStart(file._id)}
                                        onTouchEnd={handleTouchEnd}
                                        onClick={(e) => {
                                            if (selectedFiles.size > 0 && !(e.target as HTMLElement).closest('button')) {
                                                toggleFileSelection(file._id);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {selectedFiles.size > 0 && (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleFileSelection(file._id)}
                                                    className="w-5 h-5 mt-1 cursor-pointer flex-shrink-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}

                                            <span className="text-2xl flex-shrink-0">📄</span>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                    {file.originalName}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <span>{formatSize(file.size)}</span>
                                                    <span>•</span>
                                                    <span className="capitalize">{file.mimeType.split('/')[1]}</span>
                                                </div>

                                                {!isSelected && (
                                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePreview(index);
                                                            }}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Preview
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownload(file._id, file.originalName);
                                                            }}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            Download
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteClick(file);
                                                            }}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}

                                                {isSelected && (
                                                    <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                        ✓ Selected
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
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
