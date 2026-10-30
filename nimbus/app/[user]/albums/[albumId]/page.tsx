"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../lib/api';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import { motion } from 'framer-motion';
import MediaPreviewModal from '../../../components/MediaPreviewModal';
import FileSelectionModal from '../../../components/FileSelectionModal';
import AddToAlbumModal from '../../../components/AddToAlbumModal';
import MobileContextMenu, { MobileAction } from '../../../components/MobileContextMenu';
import StorageFileCard from '../../../components/StorageFileCard';
import RenameModal from '../../../components/RenameModal';
import { LuDownload, LuTrash2, LuImagePlus, LuHeart, LuSmartphone, LuPencil } from "react-icons/lu";
import { AiFillHeart } from "react-icons/ai";

interface FileData {
    _id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    isFavorite?: boolean; // Optional in case we add it later or mock it
}

interface Album {
    _id: string;
    name: string;
    description?: string;
    createdAt: string;
}

export default function AlbumDetailsPage() {
    const { isLoggedIn, user, isLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [album, setAlbum] = useState<Album | null>(null);
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<FileData | null>(null);
    const [isFileSelectionOpen, setIsFileSelectionOpen] = useState(false);

    // Rename modal state
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [fileToRename, setFileToRename] = useState<FileData | null>(null);

    // Add to Album modal state
    const [addToAlbumModalOpen, setAddToAlbumModalOpen] = useState(false);
    const [fileToAddToAlbum, setFileToAddToAlbum] = useState<string[]>([]);

    // Mobile Context Menu State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileMenuFile, setMobileMenuFile] = useState<FileData | null>(null);

    const albumId = params.albumId as string;

    const handleAddFiles = async (fileIds: string[]) => {
        try {
            await api.post(`/albums/${albumId}/files`, { fileIds });
            fetchAlbumDetails(); // Refresh list
            setIsFileSelectionOpen(false);
        } catch (error) {
            console.error('Error adding files to album:', error);
            alert('Failed to add files');
        }
    };

    const fetchAlbumDetails = useCallback(async () => {
        try {
            const response = await api.get(`/albums/${albumId}`);
            setAlbum(response.data.album);
            setFiles(response.data.files);
        } catch (error) {
            console.error('Error fetching album details:', error);
            // Handle 404 or other errors
        } finally {
            setLoading(false);
        }
    }, [albumId]);

    useEffect(() => {
        if (isLoading) return;
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        if (albumId) {
            fetchAlbumDetails();
        }
    }, [isLoggedIn, isLoading, albumId, router, fetchAlbumDetails]);

    const handleRemoveFromAlbum = async (fileId: string) => {
        if (!confirm("Remove this photo from album?")) return;
        try {
            await api.delete(`/albums/${albumId}/files/${fileId}`);
            setFiles(files.filter(f => f._id !== fileId));
        } catch (error) {
            console.error('Error removing file:', error);
        }
    };

    const handleDeleteAlbum = async () => {
        if (!confirm("Are you sure you want to delete this album? The photos will remain in your storage.")) return;
        try {
            await api.delete(`/albums/${albumId}`);
            router.push(`/${user?.name}/albums`);
        } catch (error) {
            console.error('Error deleting album:', error);
        }
    };

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

    const handleRenameClick = (file: FileData) => {
        setFileToRename(file);
        setRenameModalOpen(true);
    };

    const handleRename = async (newName: string) => {
        if (!fileToRename) return;

        try {
            await api.put(`/files/${fileToRename._id}/rename`, { newName });

            // Update the file in the list
            setFiles(files.map(f =>
                f._id === fileToRename._id ? { ...f, originalName: newName } : f
            ));
        } catch (err) {
            console.error("Rename failed", err);
            alert("Failed to rename file");
        }
    };

    const handlePreview = (file: FileData) => {
        setPreviewFile(file);
    };

    const handleNext = () => {
        if (!previewFile) return;
        const currentIndex = files.findIndex(f => f._id === previewFile._id);
        if (currentIndex < files.length - 1) {
            setPreviewFile(files[currentIndex + 1]);
        }
    };

    const handlePrevious = () => {
        if (!previewFile) return;
        const currentIndex = files.findIndex(f => f._id === previewFile._id);
        if (currentIndex > 0) {
            setPreviewFile(files[currentIndex - 1]);
        }
    };

    // Toggle favorite state update (API called by StorageFileCard)
    const handleToggleFavorite = (fileId: string, status: boolean) => {
        setFiles(files.map(f => f._id === fileId ? { ...f, isFavorite: status } : f));
    };

    const handleAddToAlbumClick = (fileId: string) => {
        setFileToAddToAlbum([fileId]);
        setAddToAlbumModalOpen(true);
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
                label: "Remove from Album",
                icon: <LuTrash2 />,
                variant: 'danger',
                onClick: () => handleRemoveFromAlbum(mobileMenuFile._id)
            }
        ];

        return actions;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!album) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center">
                <h2 className="text-2xl mb-4">Album not found</h2>
                <Link href={`/${user?.name}/albums`} className="text-blue-400 hover:underline">
                    Back to Albums
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full text-white selection:bg-blue-500/30">

            <main className="px-4 md:px-8 max-w-[1500px] mx-auto">
                <div className="mb-8">
                    <Link href={`/${user?.name}/albums`} className="text-gray-400 hover:text-white mb-4 inline-block transition-colors">
                        ← Back to Albums
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{album.name}</h1>
                            {album.description && <p className="text-gray-400">{album.description}</p>}
                            <p className="text-sm text-gray-500 mt-2">{files.length} items</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsFileSelectionOpen(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <span>+ Add Files</span>
                            </button>
                            <button
                                onClick={handleDeleteAlbum}
                                className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors text-sm font-medium"
                            >
                                Delete Album
                            </button>
                        </div>
                    </div>
                </div>

                {files.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                        <p className="text-gray-500">This album is empty.</p>
                        <Link
                            href={`/${user?.name}/storage`}
                            className="inline-block mt-4 text-blue-400 hover:text-blue-300"
                        >
                            Add photos from Storage
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-6">
                        {files.map((file) => (
                            <motion.div
                                key={file._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <StorageFileCard
                                    file={{
                                        ...file,
                                        isFavorite: file.isFavorite || false
                                    }}
                                    isSelected={false}
                                    isSelectionMode={false}
                                    onSelect={() => { }}
                                    onToggleFavorite={handleToggleFavorite}
                                    onPreview={() => handlePreview(file)}
                                    onDownload={() => handleDownload(file._id, file.originalName)}
                                    onAddToAlbum={() => handleAddToAlbumClick(file._id)}
                                    onDelete={() => handleRemoveFromAlbum(file._id)}
                                    deleteLabel="Remove from Album"
                                    onRename={() => handleRenameClick(file)}
                                    onLongPress={() => handleLongPress(file)}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {previewFile && (
                <MediaPreviewModal
                    isOpen={!!previewFile}
                    fileId={previewFile._id}
                    fileName={previewFile.originalName}
                    fileType={previewFile.mimeType}
                    fileSize={(previewFile.size / 1024 / 1024).toFixed(2) + ' MB'}
                    onClose={() => setPreviewFile(null)}
                    onDownload={() => handleDownload(previewFile._id, previewFile.originalName)}
                    onDelete={() => {
                        handleRemoveFromAlbum(previewFile._id);
                        setPreviewFile(null);
                    }}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    hasNext={files.findIndex(f => f._id === previewFile._id) < files.length - 1}
                    hasPrevious={files.findIndex(f => f._id === previewFile._id) > 0}
                />
            )}

            <FileSelectionModal
                isOpen={isFileSelectionOpen}
                onClose={() => setIsFileSelectionOpen(false)}
                onConfirm={handleAddFiles}
                title="Add Photos to Album"
                confirmLabel="Add to Album"
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

            <AddToAlbumModal
                isOpen={addToAlbumModalOpen}
                onClose={() => {
                    setAddToAlbumModalOpen(false);
                    setFileToAddToAlbum([]);
                }}
                fileIds={fileToAddToAlbum}
                onSuccess={() => {
                    setAddToAlbumModalOpen(false);
                    setFileToAddToAlbum([]);
                    alert("Added to album successfully!");
                }}
            />

            {/* Mobile Context Menu */}
            <MobileContextMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                title={mobileMenuFile?.originalName || "Options"}
                actions={getMobileMenuActions()}
            />
        </div>
    );
}
