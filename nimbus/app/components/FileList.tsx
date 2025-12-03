"use client";

import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import AddToAlbumModal from './AddToAlbumModal';

interface FileData {
    _id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
}

const FileList = ({ refreshTrigger }: { refreshTrigger: number }) => {
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
    const [addToAlbumModalOpen, setAddToAlbumModalOpen] = useState(false);
    const [filesToAdd, setFilesToAdd] = useState<string[]>([]);

    const fetchFiles = async () => {
        try {
            const res = await api.get('/files');
            setFiles(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [refreshTrigger]);

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
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm("Are you sure you want to delete this file?")) return;

        try {
            await api.delete(`/files/${fileId}`);
            fetchFiles();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const toggleFileSelection = (fileId: string) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId);
        } else {
            newSelected.add(fileId);
        }
        setSelectedFiles(newSelected);
        setSelectionMode(newSelected.size > 0);
    };

    const selectAll = () => {
        if (selectedFiles.size === files.length) {
            setSelectedFiles(new Set());
            setSelectionMode(false);
        } else {
            setSelectedFiles(new Set(files.map(f => f._id)));
            setSelectionMode(true);
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
            setSelectionMode(false);
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
            setSelectionMode(false);
            fetchFiles();
        } catch (err) {
            console.error("Bulk delete failed", err);
            alert("Failed to delete files. Please try again.");
        }
    };

    // Touch handlers for mobile
    const handleTouchStart = (fileId: string) => {
        const timer = setTimeout(() => {
            // Long press detected
            toggleFileSelection(fileId);
            setSelectionMode(true);
        }, 500); // 500ms for long press
        setTouchTimer(timer);
    };

    const handleTouchEnd = () => {
        if (touchTimer) {
            clearTimeout(touchTimer);
            setTouchTimer(null);
        }
    };

    const handleFileClick = (fileId: string) => {
        if (selectionMode) {
            // In selection mode, clicking toggles selection
            toggleFileSelection(fileId);
        }
        // Otherwise, do nothing (could open preview in future)
    };

    if (loading) return <div>Loading files...</div>;

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Files</h2>
                {files.length > 0 && (
                    <div className="flex gap-2">
                        {selectionMode && (
                            <>
                                <button
                                    onClick={handleBulkDownload}
                                    disabled={selectedFiles.size === 0}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Download ({selectedFiles.size})
                                </button>
                                <button
                                    onClick={() => {
                                        setFilesToAdd(Array.from(selectedFiles));
                                        setAddToAlbumModalOpen(true);
                                    }}
                                    disabled={selectedFiles.size === 0}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Add to Album ({selectedFiles.size})
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedFiles.size === 0}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Delete ({selectedFiles.size})
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedFiles(new Set());
                                        setSelectionMode(false);
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                        <button
                            onClick={selectAll}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                )}
            </div>

            {files.length === 0 ? (
                <p className="text-gray-500">No files uploaded yet.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file) => {
                        const isSelected = selectedFiles.has(file._id);
                        return (
                            <div
                                key={file._id}
                                className={`border rounded-lg p-4 flex flex-col justify-between bg-white dark:bg-gray-800 shadow-sm cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' : ''
                                    }`}
                                onClick={() => handleFileClick(file._id)}
                                onTouchStart={() => handleTouchStart(file._id)}
                                onTouchEnd={handleTouchEnd}
                            >
                                {/* Checkbox for desktop */}
                                <div className="hidden md:flex items-center justify-between mb-2">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleFileSelection(file._id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-5 h-5 cursor-pointer"
                                    />
                                    {isSelected && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                            Selected
                                        </span>
                                    )}
                                </div>

                                {/* Mobile selection indicator */}
                                {isSelected && (
                                    <div className="md:hidden flex justify-end mb-2">
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                            ✓ Selected
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-center h-24 bg-gray-100 dark:bg-gray-700 rounded mb-2">
                                        <span className="text-gray-500 text-xs">{file.mimeType}</span>
                                    </div>
                                    <p className="font-medium truncate" title={file.originalName}>
                                        {file.originalName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>

                                {!selectionMode && (
                                    <div className="flex justify-between mt-4 gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(file._id, file.originalName);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            Download
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFilesToAdd([file._id]);
                                                setAddToAlbumModalOpen(true);
                                            }}
                                            className="text-purple-600 hover:text-purple-800 text-sm"
                                        >
                                            Album
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file._id);
                                            }}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <AddToAlbumModal
                isOpen={addToAlbumModalOpen}
                onClose={() => setAddToAlbumModalOpen(false)}
                fileIds={filesToAdd}
                onSuccess={() => {
                    // Optional: show success toast
                    setAddToAlbumModalOpen(false);
                }}
            />
        </div>
    );
};

export default FileList;
