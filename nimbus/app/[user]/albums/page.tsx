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
        <div className="w-full text-white">

            <main className="max-w-[1500px] mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-6 border-b border-white/10 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="eyebrow-tag text-pill-lime">VAULT GALLERIES</span>
                            <span className="text-[11px] font-mono text-[#B8FE00] uppercase font-bold tracking-wider">● ENCRYPTED COLLECTIONS</span>
                        </div>
                        <h1 className="font-display font-extrabold text-4xl sm:text-5xl uppercase tracking-tight text-white mb-2">
                            CIPHER ALBUMS
                        </h1>
                        <p className="text-white/60 text-sm font-sans max-w-xl">
                            Curated photographic and media collections with cryptographic shard isolation and selective sharing links.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {isSelectionMode ? (
                            <>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedAlbums.size === 0}
                                    className="px-4 py-2.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    DELETE ({selectedAlbums.size})
                                </button>
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(false);
                                        setSelectedAlbums(new Set());
                                    }}
                                    className="px-4 py-2.5 bg-[#202327] text-white/70 hover:text-white border border-white/15 font-mono text-xs uppercase tracking-wider transition-all"
                                >
                                    CANCEL
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsSelectionMode(true)}
                                    className="px-4 py-2.5 bg-[#202327] text-white/80 hover:text-white border border-white/15 font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    SELECT
                                </button>
                                <button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="px-5 py-2.5 bg-[#B8FE00] hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(184,254,0,0.3)]"
                                >
                                    <span>+ CREATE ALBUM</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="bg-[#202327] border border-white/10 p-16 text-center shadow-xl">
                        <div className="inline-block animate-spin text-[#B8FE00] text-4xl mb-4">⚡</div>
                        <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight text-white mb-2">INDEXING ALBUMS...</h3>
                        <p className="text-white/40 font-mono text-xs uppercase">SYNCING WITH TELEMETRY NODE</p>
                    </div>
                ) : albums.length === 0 ? (
                    <div className="bg-[#202327] border border-white/10 p-16 text-center shadow-xl max-w-2xl mx-auto">
                        <div className="text-5xl mb-4 opacity-50">🖼️</div>
                        <h3 className="font-display font-extrabold text-3xl uppercase tracking-tight text-white mb-3">ZERO ALBUMS CREATED</h3>
                        <p className="text-white/60 text-sm max-w-md mx-auto mb-6 font-sans">
                            Organize your media into encrypted collections. Select photos and videos from your vault storage to bind them to an album.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="px-6 py-3 bg-[#B8FE00] hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg"
                            >
                                + CREATE FIRST ALBUM
                            </button>
                            <Link
                                href={`/${user?.name || 'user'}/storage`}
                                className="px-6 py-3 bg-[#0720C6] hover:bg-white hover:text-black text-white font-extrabold text-xs uppercase tracking-wider transition-all"
                            >
                                OPEN STORAGE VAULT
                            </Link>
                        </div>
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
                                                className="mb-4 flex items-center gap-3"
                                            >
                                                <span className="w-2 h-2 bg-[#B8FE00]"></span>
                                                <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight text-white">
                                                    {formatDateHeader(firstAlbum.createdAt)}
                                                </h2>
                                                <div className="h-px bg-white/10 flex-1 ml-2"></div>
                                            </motion.div>

                                            {/* Albums Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                                {albumsInGroup.map((album) => {
                                                    const isSelected = selectedAlbums.has(album._id);

                                                    // Visual Content (Image, Gradient, Text)
                                                    const VisualContent = (
                                                        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#16181B]">
                                                            {album.coverImage ? (
                                                                <img
                                                                    src={album.coverImage}
                                                                    alt={album.name}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center bg-[#16181B] border border-white/5">
                                                                    <span className="text-4xl mb-2 opacity-50">📁</span>
                                                                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">ENCRYPTED CONTAINER</span>
                                                                </div>
                                                            )}

                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                                            <div className="absolute bottom-0 left-0 right-0 p-4 z-10 border-t border-white/10 bg-[#202327]/80 backdrop-blur-sm">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <h3 className="font-display font-extrabold text-lg text-white uppercase tracking-tight truncate">{album.name}</h3>
                                                                    <span className="bg-[#B8FE00] text-black text-[9px] font-extrabold uppercase px-1.5 py-0.5 tracking-wider shrink-0">
                                                                        {album.fileCount} ITEMS
                                                                    </span>
                                                                </div>
                                                                {album.description && (
                                                                    <p className="text-xs text-white/60 truncate font-sans">{album.description}</p>
                                                                )}
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
                                                                        className="w-5 h-5 cursor-pointer accent-[#B8FE00] bg-black/60 backdrop-blur-sm rounded-none border border-white/30"
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
                                                                    className={`p-1.5 transition-all ${activeMenuId === album._id
                                                                        ? 'bg-[#B8FE00] text-black opacity-100'
                                                                        : 'bg-[#16181B]/90 hover:bg-[#B8FE00] hover:text-black text-white border border-white/15 opacity-0 group-hover:opacity-100'
                                                                        }`}
                                                                >
                                                                    <BsThreeDotsVertical size={15} />
                                                                </button>

                                                                <AnimatePresence>
                                                                    {activeMenuId === album._id && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                            exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="absolute right-0 top-full mt-1.5 w-48 bg-[#202327] border border-white/20 shadow-2xl z-50 py-1 text-xs uppercase tracking-wider font-semibold"
                                                                        >
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    setAlbumToUpdateThumbnail(album);
                                                                                    setThumbnailModalOpen(true);
                                                                                    setActiveMenuId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2.5 text-white/90 hover:bg-white/10 hover:text-[#B8FE00] flex items-center gap-3 transition-colors"
                                                                            >
                                                                                <LuImage size={15} />
                                                                                <span>Change Cover</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    handleRenameClick(album);
                                                                                    setActiveMenuId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2.5 text-white/90 hover:bg-white/10 hover:text-[#B8FE00] flex items-center gap-3 transition-colors"
                                                                            >
                                                                                <LuPencil size={15} />
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
                                                                                className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/20 flex items-center gap-3 transition-colors"
                                                                            >
                                                                                <LuTrash2 size={15} />
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
                                                                className={`group relative block aspect-square bg-[#202327] border transition-all cursor-pointer ${isSelected ? 'border-[#B8FE00] ring-1 ring-[#B8FE00] shadow-[0_0_20px_rgba(184,254,0,0.25)]' : 'border-white/10 hover:border-white/30'
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
                                                            className="group relative block aspect-square bg-[#202327] border border-white/10 hover:border-[#B8FE00]/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)] cursor-pointer"
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
