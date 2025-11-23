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
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                {/* Warning Icon */}
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                    Delete File?
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                    Are you sure you want to delete this file? This action cannot be undone.
                </p>

                {/* File Details */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-xl">📄</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate" title={fileName}>
                                {fileName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {fileSize} • {fileType}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">ESC</kbd> to cancel or <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to confirm
                </p>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
