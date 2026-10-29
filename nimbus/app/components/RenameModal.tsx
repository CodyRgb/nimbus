"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onRename: (newName: string) => Promise<void>;
    itemType: "file" | "album";
}

export default function RenameModal({
    isOpen,
    onClose,
    currentName,
    onRename,
    itemType
}: RenameModalProps) {
    const [newName, setNewName] = useState(currentName);
    const [isRenaming, setIsRenaming] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setNewName(currentName);
            setError("");
        }
    }, [isOpen, currentName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const trimmedName = newName.trim();

        if (!trimmedName) {
            setError("Identifier cannot be empty");
            return;
        }

        if (trimmedName.length > 255) {
            setError("Identifier length exceeds quota (max 255 chars)");
            return;
        }

        if (trimmedName === currentName) {
            onClose();
            return;
        }

        setIsRenaming(true);
        try {
            await onRename(trimmedName);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to mutate metadata identifier");
        } finally {
            setIsRenaming(false);
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
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-[#B8FE00]/15 text-[#B8FE00] border border-[#B8FE00]/30">
                                METADATA MUTATION
                            </span>
                            <span className="text-[10px] font-mono text-white/40 uppercase">{itemType}</span>
                        </div>

                        <h2 className="text-3xl font-bold uppercase tracking-wider text-white font-display mb-2">
                            RENAME {itemType === "file" ? "VAULT ASSET" : "CIPHER ALBUM"}
                        </h2>

                        <p className="text-sm text-neutral-400 mb-6 font-sans">
                            Update the canonical resource identifier in the indexed metadata ledger.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-mono font-bold text-white/70 uppercase tracking-wider mb-2">
                                    NEW IDENTIFIER
                                </label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#16181B] border border-white/20 text-white font-mono text-sm focus:border-[#B8FE00] focus:outline-none transition-colors"
                                    placeholder={`Enter new ${itemType} name`}
                                    autoFocus
                                    disabled={isRenaming}
                                />
                                {error && (
                                    <p className="mt-2 text-xs font-mono text-red-400 flex items-center gap-1">
                                        <span>✕</span> {error}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isRenaming}
                                    className="flex-1 px-4 py-2.5 bg-[#16181B] border border-white/20 text-white font-mono uppercase text-xs tracking-wider hover:border-white/50 hover:bg-white/5 transition-all disabled:opacity-50"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRenaming}
                                    className="flex-1 px-4 py-2.5 bg-[#B8FE00] hover:bg-white text-black font-mono font-bold uppercase text-xs tracking-wider border border-[#B8FE00] shadow-[0_0_20px_rgba(184,254,0,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isRenaming ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            <span>MUTATING...</span>
                                        </>
                                    ) : (
                                        "MUTATE NAME"
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
