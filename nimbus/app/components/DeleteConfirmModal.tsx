"use client";

import React, { useEffect } from 'react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    fileName: string;
    fileSize: string;
    fileType: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    fileName,
    fileSize,
    fileType,
    onConfirm,
    onCancel,
    isDeleting = false
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };

        const handleEnter = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && isOpen && !isDeleting) {
                onConfirm();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('keydown', handleEnter);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('keydown', handleEnter);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onCancel, onConfirm, isDeleting]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/85 backdrop-blur-md"
                onClick={onCancel}
            />
            
            {/* Modal */}
            <div className="relative bg-[#202327] border-2 border-red-500/40 max-w-md w-full p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-10">
                {/* Warning Icon & Tag */}
                <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-red-500/15 text-red-400 border border-red-500/30">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                        CRITICAL PURGE DIRECTIVE
                    </span>
                    <span className="text-[10px] font-mono text-white/40">ACTION_IRREVERSIBLE</span>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold text-white uppercase tracking-wider font-display mb-2">
                    PURGE VAULT ASSET?
                </h3>

                {/* Description */}
                <p className="text-sm text-neutral-400 mb-6 font-sans leading-relaxed">
                    This file will be permanently expunged across all decentralized storage clusters. Sharded chunks and decryption keys cannot be restored.
                </p>

                {/* File Details */}
                <div className="bg-[#16181B] p-4 mb-6 border border-white/10">
                    <div className="flex items-start gap-3.5">
                        <div className="shrink-0 w-11 h-11 bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold font-mono text-sm">
                            DEL
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate text-sm tracking-tight" title={fileName}>
                                {fileName}
                            </p>
                            <p className="text-xs font-mono text-white/50 mt-1">
                                {fileSize} • <span className="uppercase text-red-400/80">{fileType || 'BINARY'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="p-3 bg-red-950/30 border-l-2 border-red-500 mb-6 text-xs text-red-300 font-mono">
                    WARNING: Encrypted parity shards will be immediately deallocated.
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 px-5 py-2.5 bg-[#16181B] border border-white/20 text-white font-mono uppercase text-xs tracking-wider hover:border-white/50 hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold uppercase text-xs tracking-wider border border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>PURGING...</span>
                            </>
                        ) : (
                            'PURGE ASSET'
                        )}
                    </button>
                </div>

                {/* Keyboard Hints */}
                <p className="text-[11px] font-mono text-white/40 text-center mt-5">
                    Press <kbd className="px-1.5 py-0.5 bg-[#16181B] border border-white/20 text-white/70">ESC</kbd> to abort or <kbd className="px-1.5 py-0.5 bg-[#16181B] border border-white/20 text-white/70">ENTER</kbd> to confirm
                </p>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
