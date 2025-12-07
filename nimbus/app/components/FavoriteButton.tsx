"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import api from "../../lib/api";

interface FavoriteButtonProps {
    fileId: string;
    isFavorite: boolean;
    onToggle: (fileId: string, newFavoriteStatus: boolean) => void;
    inline?: boolean; // For list view (inline) vs grid view (absolute positioned)
}

export default function FavoriteButton({ fileId, isFavorite, onToggle, inline = false }: FavoriteButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [localFavorite, setLocalFavorite] = useState(isFavorite);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isLoading) return;

        setIsLoading(true);
        const previousState = localFavorite;

        // Optimistic update
        setLocalFavorite(!localFavorite);

        try {
            const response = await api.patch(`/files/${fileId}/favorite`);
            const newFavoriteStatus = response.data.isFavorite;

            // Update parent component
            onToggle(fileId, newFavoriteStatus);
            setLocalFavorite(newFavoriteStatus);
        } catch (error) {
            console.error("Failed to toggle favorite", error);
            // Revert on error
            setLocalFavorite(previousState);
            alert("Failed to update favorite status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.button
            onClick={handleToggleFavorite}
            className={`${inline ? 'p-2' : 'absolute top-4 right-4 z-10 p-2'} rounded-full transition-all ${localFavorite
                    ? "bg-red-500/20 hover:bg-red-500/30"
                    : "bg-white/10 hover:bg-white/20"
                }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isLoading}
        >
            <motion.span
                className={`text-2xl ${localFavorite ? "text-red-500" : "text-gray-400"}`}
                animate={{
                    scale: localFavorite ? [1, 1.3, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
            >
                {localFavorite ? "♥" : "♡"}
            </motion.span>
        </motion.button>
    );
}
