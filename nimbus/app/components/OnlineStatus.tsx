"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuWifiOff, LuCircleCheck } from "react-icons/lu";

export default function OnlineStatus() {
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [showReconnected, setShowReconnected] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            const timer = setTimeout(() => setShowReconnected(false), 4000);
            return () => clearTimeout(timer);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-600/90 text-white backdrop-blur-md rounded-full shadow-2xl border border-red-400/40 flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase pointer-events-none"
                >
                    <LuWifiOff size={15} className="animate-pulse text-yellow-300" />
                    <span>OFFLINE MODE • CACHED ASSETS ACTIVE • UPLOADS PAUSED</span>
                </motion.div>
            )}

            {showReconnected && isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#B8FE00] text-[#16181B] rounded-full shadow-2xl border border-white/20 flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase pointer-events-none"
                >
                    <LuCircleCheck size={15} />
                    <span>BACK ONLINE • QUEUE RESUMING SECURE DISPATCH</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
