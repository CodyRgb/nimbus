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
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                onClick={onCancel}
            />
            
            {/* Modal */}
            <div className="relative glass-card max-w-md w-full p-8 border border-red-500/30 glow-pink">
                {/* Warning Icon */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-2xl border border-red-500/30">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white text-center mb-3 font-display">
                    Delete File?
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-center mb-8 font-body">
                    Are you sure you want to delete this file? This action cannot be undone.
                </p>

                {/* File Details */}
                <div className="glass-card p-5 mb-8 border border-white/10 bg-white/5">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl flex items-center justify-center border border-red-500/30">
                            <span className="text-xl">📄</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate font-display" title={fileName}>
                                {fileName}
                            </p>
                            <p className="text-sm text-gray-400 font-body">
                                {fileSize} • {fileType}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-3 glass-card border border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg font-body"
                    >
                        {isDeleting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>

                {/* Keyboard Hints */}
                <p className="text-xs text-gray-500 text-center mt-6 font-body">
                    Press <kbd className="px-2 py-1 glass-card border border-white/20 rounded">ESC</kbd> to cancel or <kbd className="px-2 py-1 glass-card border border-white/20 rounded">Enter</kbd> to confirm
                </p>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
