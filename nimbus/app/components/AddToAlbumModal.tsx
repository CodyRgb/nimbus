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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Add to Album</h2>

                            {!creatingNew ? (
                                <div className="space-y-4">
                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {albums.map((album) => (
                                            <button
                                                key={album._id}
                                                onClick={() => addToAlbum(album._id)}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                            >
                                                <span className="text-gray-200 group-hover:text-white">{album.name}</span>
                                                <span className="text-xs text-gray-500">{album.fileCount} items</span>
                                            </button>
                                        ))}
                                        {albums.length === 0 && (
                                            <p className="text-gray-500 text-center py-4">No albums found</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setCreatingNew(true)}
                                        className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-blue-400 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>+ Create New Album</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Album Name</label>
                                        <input
                                            type="text"
                                            value={newAlbumName}
                                            onChange={(e) => setNewAlbumName(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="My Awesome Album"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setCreatingNew(false)}
                                            className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateAlbum}
                                            disabled={!newAlbumName.trim() || loading}
                                            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Creating...' : 'Create & Add'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!creatingNew && (
                            <div className="p-4 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
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
