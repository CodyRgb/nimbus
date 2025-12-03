"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../lib/api';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import FileCard from '../../../components/FileCard'; // Assuming FileCard is reusable or I'll use a similar card
import { motion } from 'framer-motion';
import FileThumbnail from '../../../components/FileThumbnail';

interface FileData {
    _id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
}

interface Album {
    _id: string;
    name: string;
    description?: string;
    createdAt: string;
}

export default function AlbumDetailsPage() {
    const { isLoggedIn, user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [album, setAlbum] = useState<Album | null>(null);
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);

    const albumId = params.albumId as string;

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
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        if (albumId) {
            fetchAlbumDetails();
        }
    }, [isLoggedIn, albumId, router, fetchAlbumDetails]);

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
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-blue-500/30">
            <Navbar isLoggedIn={isLoggedIn} user={user} isOnAuthPage={false} />

            <main className="pt-32 px-4 md:px-8 max-w-7xl mx-auto">
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
                        <button
                            onClick={handleDeleteAlbum}
                            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors text-sm font-medium"
                        >
                            Delete Album
                        </button>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {files.map((file) => (
                            <motion.div
                                key={file._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative bg-gray-900 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all"
                            >
                                <div className="aspect-square bg-gray-800 flex items-center justify-center relative">
                                    <FileThumbnail
                                        fileId={file._id}
                                        fileName={file.originalName}
                                        mimeType={file.mimeType}
                                        className="w-full h-full"
                                    />
                                </div>

                                <div className="p-3">
                                    <p className="text-sm font-medium text-white truncate">{file.originalName}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <button
                                        onClick={() => handleDownload(file._id, file.originalName)}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                        title="Download"
                                    >
                                        ⬇️
                                    </button>
                                    <button
                                        onClick={() => handleRemoveFromAlbum(file._id)}
                                        className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 transition-colors"
                                        title="Remove from Album"
                                    >
                                        ❌
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
