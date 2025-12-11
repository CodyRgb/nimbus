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
            setError("Name cannot be empty");
            return;
        }

        if (trimmedName.length > 255) {
            setError("Name is too long (max 255 characters)");
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
            setError(err.response?.data?.message || "Failed to rename");
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
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md glass-card border border-white/10 rounded-2xl p-6 shadow-2xl"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4 font-display">
                            Rename {itemType === "file" ? "File" : "Album"}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2 font-body">
                                    New Name
                                </label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-3 glass-card border border-white/10 rounded-xl focus:ring-2 focus:ring-aurora-blue outline-none text-white placeholder-gray-500 bg-white/5 font-body"
                                    placeholder={`Enter ${itemType} name`}
                                    autoFocus
                                    disabled={isRenaming}
                                />
                                {error && (
                                    <p className="mt-2 text-sm text-red-400 font-body">{error}</p>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end">
                                <motion.button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isRenaming}
                                    className="px-4 py-2 glass-card border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 font-body"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    disabled={isRenaming}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 font-body"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isRenaming ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Renaming...
                                        </>
                                    ) : (
                                        "Rename"
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
