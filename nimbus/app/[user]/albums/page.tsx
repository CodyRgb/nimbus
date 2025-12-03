"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';

interface Album {
    _id: string;
    name: string;
    description?: string;
    coverImage?: string;
    fileCount: number;
    createdAt: string;
}

export default function AlbumsPage() {
    const { isLoggedIn, user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-blue-500/30">
            <Navbar isLoggedIn={isLoggedIn} user={user} isOnAuthPage={false} />

            <main className="pt-32 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Albums
                    </h1>
                    {/* Create Album button could go here, but we have it in the modal for now */}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {albums.map((album) => (
                            <Link
                                key={album._id}
                                href={`/${user?.name}/albums/${album._id}`}
                                className="group relative block aspect-square bg-gray-900 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-blue-500/10"
                            >
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
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
