"use client";

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
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError('');
        try {
            const response = await api.post('/albums', {
                name: name.trim(),
                description: description.trim()
            });
            onSuccess(response.data);
            handleClose();
        } catch (err: any) {
            console.error('Error creating album:', err);
            setError(err.response?.data?.message || 'Failed to initialize album in storage ledger');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setError('');
        onClose();
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
                        onClick={handleClose}
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
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-[#B8FE00]/15 text-[#B8FE00] border border-[#B8FE00]/30">
                                COLLECTION PROVISIONING
                            </span>
                            <span className="text-[10px] font-mono text-white/40">VAULT_LEDGER</span>
                        </div>

                        <h2 className="text-3xl font-bold uppercase tracking-wider text-white font-display mb-2">
                            INITIALIZE CIPHER ALBUM
                        </h2>

                        <p className="text-sm text-neutral-400 mb-6 font-sans">
                            Group and tag encrypted assets within an isolated cryptographic namespace.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono font-bold text-white/70 uppercase tracking-wider mb-2">
                                    ALBUM TITLE *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#16181B] border border-white/20 px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#B8FE00] transition-colors"
                                    placeholder="e.g. MISSION_CRITICAL_ASSETS"
                                    autoFocus
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-white/70 uppercase tracking-wider mb-2">
                                    DESCRIPTION / TAGS (OPTIONAL)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-[#16181B] border border-white/20 px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#B8FE00] transition-colors min-h-[85px] resize-none"
                                    placeholder="Add ledger tags or audit notes..."
                                    disabled={loading}
                                />
                            </div>

                            {error && (
                                <p className="text-xs font-mono text-red-400 flex items-center gap-1">
                                    <span>✕</span> {error}
                                </p>
                            )}

                            <div className="pt-3 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="flex-1 py-2.5 px-4 bg-[#16181B] border border-white/20 text-white font-mono uppercase text-xs tracking-wider hover:border-white/50 transition-all disabled:opacity-50"
                                >
                                    ABORT
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="flex-1 py-2.5 px-4 bg-[#B8FE00] hover:bg-white text-black font-mono font-bold uppercase text-xs tracking-wider border border-[#B8FE00] shadow-[0_0_20px_rgba(184,254,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            <span>INITIALIZING...</span>
                                        </>
                                    ) : (
                                        'PROVISION ALBUM'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
