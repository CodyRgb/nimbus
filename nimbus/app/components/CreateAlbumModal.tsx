
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

interface CreateAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newAlbum: any) => void;
}

export default function CreateAlbumModal({ isOpen, onClose, onSuccess }: CreateAlbumModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const response = await api.post('/albums', {
                name,
                description
            });
            onSuccess(response.data);
            handleClose();
        } catch (error) {
            console.error('Error creating album:', error);
            // Could add error state here
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        onClose();
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
                            <h2 className="text-xl font-semibold text-white mb-6">Create New Album</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Album Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Summer Vacation 2024"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Description (Optional)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[80px] resize-none"
                                        placeholder="Add a description..."
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !name.trim()}
                                        className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Creating...' : 'Create Album'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
