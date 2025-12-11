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
import CreateAlbumModal from '../../components/CreateAlbumModal';

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
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-blue-500/30">
            <Navbar isLoggedIn={isLoggedIn} user={user} isOnAuthPage={false} />

            <main className="pt-32 px-4 md:px-8 max-w-7xl mx-auto">
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                {albumsInGroup.map((album) => {
                                                    const isSelected = selectedAlbums.has(album._id);

                                                    const CardContent = (
                                                        <>
                                                            {/* Selection Checkbox Overlay */}
                                                            <AnimatePresence>
                                                                {(isSelectionMode || isSelected) && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                        className="absolute top-3 left-3 z-20"
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

                                                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                                                                <h3 className="text-lg font-semibold text-white truncate">{album.name}</h3>
                                                                <p className="text-sm text-gray-400">{album.fileCount} items</p>
                                                            </div>
                                                        </>
                                                    );

                                                    if (isSelectionMode) {
                                                        return (
                                                            <div
                                                                key={album._id}
                                                                onClick={() => toggleAlbumSelection(album._id)}
                                                                className={`group relative block aspect-square bg-gray-900 rounded-2xl overflow-hidden border transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-white/20'
                                                                    }`}
                                                            >
                                                                {CardContent}
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <Link
                                                            key={album._id}
                                                            href={`/${user?.name}/albums/${album._id}`}
                                                            className="group relative block aspect-square bg-gray-900 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-blue-500/10"
                                                        >
                                                            {CardContent}
                                                        </Link>
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
            </main>
        </div>
    );
}
