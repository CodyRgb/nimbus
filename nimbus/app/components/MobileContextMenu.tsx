"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface MobileAction {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
    divider?: boolean;
}

interface MobileContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    actions: MobileAction[];
    title?: string;
}

export default function MobileContextMenu({ isOpen, onClose, actions, title }: MobileContextMenuProps) {
    // Only render on client side
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
                    />

                    {/* Menu Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-[#1e1e1e] rounded-t-2xl z-[10000] overflow-hidden border-t border-white/10"
                        style={{ maxHeight: '80vh', overflowY: 'auto' }}
                    >
                        {/* Handle bar for visual affordance */}
                        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
                        </div>

                        {title && (
                            <div className="px-6 py-3 border-b border-white/5">
                                <h3 className="text-sm font-medium text-gray-400 text-center truncate">{title}</h3>
                            </div>
                        )}

                        <div className="py-2 pb-8">
                            {actions.map((action, index) => (
                                <div key={index}>
                                    {/* Divider if requested */}
                                    {action.divider && (
                                        <div className="h-px bg-white/10 my-1 mx-4" />
                                    )}

                                    <button
                                        onClick={() => {
                                            action.onClick();
                                            onClose();
                                        }}
                                        className={`w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 active:bg-white/10 transition-colors ${action.variant === 'danger' ? 'text-red-400' : 'text-gray-200'
                                            }`}
                                    >
                                        <div className="text-xl">
                                            {action.icon}
                                        </div>
                                        <span className="text-base font-medium">{action.label}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
