"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/ui/Pagination';

interface Album {
    _id: string;
    name: string;
    description?: string;
    coverImage?: string;
    fileCount: number;
    createdAt: string;
}
import { AnimatePresence, motion } from 'framer-motion';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { LuPencil, LuTrash2, LuImage } from 'react-icons/lu';
import CreateAlbumModal from '../../components/CreateAlbumModal';
import RenameModal from '../../components/RenameModal';
import FileSelectionModal from '../../components/FileSelectionModal';

export default function AlbumsPage() {
    const { isLoggedIn, user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection & Modal State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedAlbums, setSelectedAlbums] = useState<Set<string>>(new Set());
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Client-side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 40;

    // Rename modal state
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [albumToRename, setAlbumToRename] = useState<Album | null>(null);

    // Thumbnail selection state
    const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
    const [albumToUpdateThumbnail, setAlbumToUpdateThumbnail] = useState<Album | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        fetchAlbums();
    }, [isLoggedIn, router]);

    const fetchAlbums = async () => {
        try {
            const response = await api.get('/albums');
            setAlbums(response.data);
        } catch (error) {
            console.error('Error fetching albums:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAlbumSelection = (albumId: string) => {
        const newSelected = new Set(selectedAlbums);
        if (newSelected.has(albumId)) {
            newSelected.delete(albumId);
        } else {
            newSelected.add(albumId);
        }
        setSelectedAlbums(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedAlbums.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedAlbums.size} albums? This action cannot be undone.`)) return;

        try {
            await api.post('/albums/bulk-delete', {
                albumIds: Array.from(selectedAlbums)
            });

            // Refresh albums
            fetchAlbums();
            setSelectedAlbums(new Set());
            setIsSelectionMode(false);
        } catch (error) {
            console.error('Error deleting albums:', error);
            alert('Failed to delete albums');
        }
    };

    const handleRenameClick = (album: Album) => {
        setAlbumToRename(album);
        setRenameModalOpen(true);
    };

    const handleRename = async (newName: string) => {
        if (!albumToRename) return;

        await api.put(`/albums/${albumToRename._id}`, {
            name: newName,
            description: albumToRename.description
        });

        // Update the album in the list
        setAlbums(albums.map(a =>
            a._id === albumToRename._id ? { ...a, name: newName } : a
        ));
    };

    const handleChangeThumbnail = async (fileIds: string[], selectedFilesData?: any[]) => {
        if (!albumToUpdateThumbnail || !selectedFilesData || selectedFilesData.length === 0) return;

        const selectedFile = selectedFilesData[0];
        // Construct the thumbnail URL. Assuming we can use the file serve URL or similar.
        // Based on other parts of the app, images are served via /api/files/:id/view or similar, 
        // but here the backend likely expects a URL or we need to know how images are served.
        // Checking StoragePage, FileThumbnail uses `/api/files/${fileId}/view`.
        // Let's assume the Album model stores a fully qualified URL or a relative path.
        // If the existing coverImage is a URL, we should match that format.
        // Let's construct a standard API URL for the image.
        const thumbnailUrl = `${process.env.NEXT_PUBLIC_API_URL}/files/${selectedFile._id}/view`;

        try {
            await api.put(`/albums/${albumToUpdateThumbnail._id}`, {
                coverImage: thumbnailUrl
            });

            setAlbums(albums.map(a =>
                a._id === albumToUpdateThumbnail._id ? { ...a, coverImage: thumbnailUrl } : a
            ));

            setThumbnailModalOpen(false);
            setAlbumToUpdateThumbnail(null);
        } catch (error) {
            console.error("Failed to update thumbnail", error);
            alert("Failed to update album thumbnail");
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

    // Group albums by date
    const groupAlbumsByDate = (albums: Album[]) => {
        const groups: { [key: string]: Album[] } = {};

        albums.forEach(album => {
            const dateKey = new Date(album.createdAt).toDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(album);
        });

        return groups;
    };

    // Calculate paginated albums for display (sorted by date, newest first)
    const paginatedAlbums = useMemo(() => {
        const sortedAlbums = [...albums].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return sortedAlbums.slice(startIndex, endIndex);
    }, [albums, currentPage]);

    // Calculate total pages for client-side pagination
    const totalPaginationPages = Math.ceil(albums.length / ITEMS_PER_PAGE);

    // Reset to page 1 when albums change
    useEffect(() => {
        setCurrentPage(1);
    }, [albums.length]);

    return (
        <div className="w-full text-white selection:bg-blue-500/30">

            <main className="px-4 md:px-8 max-w-[1500px] mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Albums
                        </h1>
                    </div>

                    <div className="flex gap-3">
                        {isSelectionMode ? (
                            <>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedAlbums.size === 0}
                                    className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Delete ({selectedAlbums.size})
                                </button>
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(false);
                                        setSelectedAlbums(new Set());
                                    }}
                                    className="px-4 py-2 bg-white/5 text-gray-400 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsSelectionMode(true)}
                                    className="px-4 py-2 bg-white/5 text-gray-300 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    Select
                                </button>
                                <button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <span>+ Create Album</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : albums.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🖼️</div>
                        <h3 className="text-xl font-medium text-gray-300 mb-2">No albums yet</h3>
                        <p className="text-gray-500">Create an album by selecting photos from your storage.</p>
                        <Link
                            href={`/${user?.name}/storage`}
                            className="inline-block mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
                        >
                            Go to Storage
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-8">
                            {(() => {
                                const groupedAlbums = groupAlbumsByDate(paginatedAlbums);
                                const sortedDateKeys = Object.keys(groupedAlbums).sort((a, b) => {
                                    return new Date(b).getTime() - new Date(a).getTime();
                                });

                                return sortedDateKeys.map((dateKey) => {
                                    const albumsInGroup = groupedAlbums[dateKey];
                                    const firstAlbum = albumsInGroup[0];

                                    return (
                                        <div key={dateKey}>
                                            {/* Date Header */}
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="mb-4"
                                            >
                                                <h2 className="text-2xl font-bold text-white">
                                                    {formatDateHeader(firstAlbum.createdAt)}
                                                </h2>
                                                <div className="h-px bg-gradient-to-r from-blue-500/50 to-transparent mt-2"></div>
                                            </motion.div>

                                            {/* Albums Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                                                {albumsInGroup.map((album) => {
                                                    const isSelected = selectedAlbums.has(album._id);

                                                    // Visual Content (Image, Gradient, Text) - wrapped in overflow-hidden
                                                    const VisualContent = (
                                                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                                                            {album.coverImage ? (
                                                                <img
                                                                    src={album.coverImage}
                                                                    alt={album.name}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                                    <span className="text-4xl">📁</span>
                                                                </div>
                                                            )}

                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                                                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform z-10">
                                                                <h3 className="text-lg font-semibold text-white truncate">{album.name}</h3>
                                                                <p className="text-sm text-gray-400">{album.fileCount} items</p>
                                                            </div>
                                                        </div>
                                                    );

                                                    const SelectionOverlay = (
                                                        <AnimatePresence>
                                                            {(isSelectionMode || isSelected) && (
                                                                <motion.div
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    exit={{ opacity: 0 }}
                                                                    className="absolute top-3 left-3 z-30"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleAlbumSelection(album._id)}
                                                                        className="w-5 h-5 cursor-pointer accent-blue-500 bg-black/40 backdrop-blur-sm rounded border-white/30"
                                                                    />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    );

                                                    const MenuOverlay = (
                                                        !isSelectionMode && (
                                                            <div className="absolute top-3 right-3 z-40">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setActiveMenuId(activeMenuId === album._id ? null : album._id);
                                                                    }}
                                                                    className={`p-2 rounded-full backdrop-blur-sm transition-all ${activeMenuId === album._id
                                                                        ? 'bg-black/80 text-white opacity-100'
                                                                        : 'bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100'
                                                                        }`}
                                                                >
                                                                    <BsThreeDotsVertical size={16} />
                                                                </button>

                                                                <AnimatePresence>
                                                                    {activeMenuId === album._id && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-white/10 shadow-xl overflow-hidden py-1"
                                                                        >
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    setAlbumToUpdateThumbnail(album);
                                                                                    setThumbnailModalOpen(true);
                                                                                    setActiveMenuId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                                                            >
                                                                                <LuImage size={16} />
                                                                                <span>Change Thumbnail</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    handleRenameClick(album);
                                                                                    setActiveMenuId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                                                                            >
                                                                                <LuPencil size={16} />
                                                                                <span>Rename</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    if (confirm("Are you sure you want to delete this album?")) {
                                                                                        setSelectedAlbums(new Set([album._id]));
                                                                                        api.delete(`/albums/${album._id}`).then(() => {
                                                                                            fetchAlbums();
                                                                                        });
                                                                                    }
                                                                                    setActiveMenuId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                                                            >
                                                                                <LuTrash2 size={16} />
                                                                                <span>Delete</span>
                                                                            </button>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        )
                                                    );

                                                    if (isSelectionMode) {
                                                        return (
                                                            <div
                                                                key={album._id}
                                                                onClick={() => toggleAlbumSelection(album._id)}
                                                                className={`group relative block aspect-square bg-gray-900 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/20'
                                                                    }`}
                                                            >
                                                                {VisualContent}
                                                                {SelectionOverlay}
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={album._id}
                                                            className="group relative block aspect-square glass-panel rounded-2xl border border-white/10 hover:border-primary/50 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                                                        >
                                                            {/* Visually clipped content */}
                                                            {VisualContent}

                                                            {/* Navigation Link Overlay - z-10 */}
                                                            <Link
                                                                href={`/${user?.name}/albums/${album._id}`}
                                                                className="absolute inset-0 z-10 rounded-2xl"
                                                                aria-label={`View ${album.name}`}
                                                            />

                                                            {/* Interactive Overlays - z-30/40 */}
                                                            {SelectionOverlay}
                                                            {MenuOverlay}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {/* Pagination Controls */}
                        <div className="mt-8 pb-8">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPaginationPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}

                {/* Create Album Modal */}
                <CreateAlbumModal
                    isOpen={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onSuccess={() => {
                        fetchAlbums();
                    }}
                />

                {/* Rename Modal */}
                {albumToRename && (
                    <RenameModal
                        isOpen={renameModalOpen}
                        onClose={() => {
                            setRenameModalOpen(false);
                            setAlbumToRename(null);
                        }}
                        currentName={albumToRename.name}
                        onRename={handleRename}
                        itemType="album"
                    />
                )}

                <FileSelectionModal
                    isOpen={thumbnailModalOpen}
                    onClose={() => {
                        setThumbnailModalOpen(false);
                        setAlbumToUpdateThumbnail(null);
                    }}
                    onConfirm={handleChangeThumbnail}
                    title="Select Album Cover"
                    confirmLabel="Set Cover"
                    selectionMode="single"
                />
            </main>
        </div>
    );
}
