"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { useAuth } from '../context/AuthContext';

interface Album {
    _id: string;
    name: string;
    fileCount: number;
}

interface AddToAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileIds: string[];
    onSuccess: () => void;
}

const AddToAlbumModal: React.FC<AddToAlbumModalProps> = ({ isOpen, onClose, fileIds, onSuccess }) => {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [newAlbumName, setNewAlbumName] = useState('');
    const [loading, setLoading] = useState(false);
    const [creatingNew, setCreatingNew] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            fetchAlbums();
            setCreatingNew(false);
            setNewAlbumName('');
        }
    }, [isOpen]);

    const fetchAlbums = async () => {
        try {
            const response = await api.get('/albums');
            setAlbums(response.data);
        } catch (error) {
            console.error('Error fetching albums:', error);
        }
    };

    const handleCreateAlbum = async () => {
        if (!newAlbumName.trim()) return;
        setLoading(true);
        try {
            const response = await api.post('/albums', { name: newAlbumName });
            const newAlbum = response.data;
            await addToAlbum(newAlbum._id);
        } catch (error) {
            console.error('Error creating album:', error);
            setLoading(false);
        }
    };

    const addToAlbum = async (albumId: string) => {
        setLoading(true);
        try {
            await api.post(`/albums/${albumId}/files`, { fileIds });
            setLoading(false);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding to album:', error);
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/85 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="relative w-full max-w-md bg-[#202327] border-2 border-white/10 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-10"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-[#0720C6] text-white">
                                COLLECTION ROUTING
                            </span>
                            <span className="text-[10px] font-mono text-[#B8FE00] font-bold">
                                {fileIds.length} {fileIds.length === 1 ? 'ASSET' : 'ASSETS'} SELECTED
                            </span>
                        </div>

                        <h2 className="text-3xl font-bold uppercase tracking-wider text-white font-display mb-2">
                            ADD TO CIPHER ALBUM
                        </h2>
                        
                        <p className="text-sm text-neutral-400 mb-6 font-sans">
                            Attach vault assets to a cryptographic group collection.
                        </p>

                        {!creatingNew ? (
                            <div className="space-y-4">
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {albums.map((album) => (
                                        <button
                                            key={album._id}
                                            onClick={() => addToAlbum(album._id)}
                                            disabled={loading}
                                            className="w-full flex items-center justify-between p-3.5 bg-[#16181B] border border-white/10 hover:border-[#B8FE00] hover:bg-[#1a1d22] transition-all group text-left cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-white group-hover:text-[#B8FE00] transition-colors">
                                                    {album.name}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono px-2 py-0.5 bg-black/40 border border-white/10 text-[#B8FE00] font-bold">
                                                {album.fileCount || 0} ITEMS
                                            </span>
                                        </button>
                                    ))}
                                    {albums.length === 0 && (
                                        <div className="text-neutral-500 font-mono text-xs text-center py-6 border border-dashed border-white/10">
                                            NO ALBUMS INITIALIZED YET
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setCreatingNew(true)}
                                    className="w-full py-3 px-4 bg-[#B8FE00]/5 hover:bg-[#B8FE00]/10 border-2 border-dashed border-[#B8FE00]/40 hover:border-[#B8FE00] text-[#B8FE00] transition-all flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
                                >
                                    <span>+ INITIALIZE NEW ALBUM</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-mono font-bold text-white/70 uppercase tracking-wider mb-2">
                                        ALBUM TITLE
                                    </label>
                                    <input
                                        type="text"
                                        value={newAlbumName}
                                        onChange={(e) => setNewAlbumName(e.target.value)}
                                        className="w-full bg-[#16181B] border border-white/20 px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#B8FE00] transition-colors"
                                        placeholder="e.g. Q4_AUDIT_LOGS"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setCreatingNew(false)}
                                        className="flex-1 py-2.5 px-4 bg-[#16181B] border border-white/20 text-white font-mono uppercase text-xs tracking-wider hover:border-white/50 transition-all"
                                    >
                                        BACK
                                    </button>
                                    <button
                                        onClick={handleCreateAlbum}
                                        disabled={!newAlbumName.trim() || loading}
                                        className="flex-1 py-2.5 px-4 bg-[#B8FE00] hover:bg-white text-black font-mono font-bold uppercase text-xs tracking-wider border border-[#B8FE00] shadow-[0_0_20px_rgba(184,254,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'INITIALIZING...' : 'CREATE & ADD'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!creatingNew && (
                            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                                >
                                    DISMISS
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddToAlbumModal;
