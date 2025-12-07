"use client";

import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import Image from 'next/image';

interface MediaPreviewModalProps {
    isOpen: boolean;
    fileId: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    onClose: () => void;
    onDelete?: () => void;
    onDownload?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNext?: boolean;
    hasPrevious?: boolean;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
    isOpen,
    fileId,
    fileName,
    fileType,
    fileSize,
    onClose,
    onDelete,
    onDownload,
    onNext,
    onPrevious,
    hasNext = false,
    hasPrevious = false
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    if (hasPrevious && onPrevious) {
                        onPrevious();
                    }
                    break;
                case 'ArrowRight':
                    if (hasNext && onNext) {
                        onNext();
                    }
                    break;
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, onNext, onPrevious, hasNext, hasPrevious]);

    useEffect(() => {
        if (isOpen && fileId) {
            loadPreview();
        }

        // Cleanup function to revoke the blob URL when component unmounts or fileId changes
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
        };
    }, [isOpen, fileId]); // Re-run when fileId changes

    const loadPreview = async () => {
        // Clean up previous preview URL before loading new one
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/files/${fileId}/preview`, {
                responseType: 'blob',
            });

            const url = URL.createObjectURL(response.data);
            setPreviewUrl(url);
        } catch (err) {
            console.error('Preview failed:', err);
            setError('Failed to load preview');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isImage = fileType.startsWith('image/');
    const isVideo = fileType.startsWith('video/');
    const isAudio = fileType.startsWith('audio/');
    const isPDF = fileType === 'application/pdf';
    const canPreview = isImage || isVideo || isAudio || isPDF;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full h-full flex flex-col">
                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-6 py-4 glass-card border-b border-white/10">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate" title={fileName}>
                            {fileName}
                        </h3>
                        <p className="text-sm text-gray-300">
                            {fileSize} • {fileType.split('/')[1]?.toUpperCase()}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        {/* Download Button */}
                        {onDownload && (
                            <button
                                onClick={onDownload}
                                className="p-2 hover:bg-aurora-blue/20 rounded-xl transition-colors text-aurora-blue border border-aurora-blue/30"
                                title="Download"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        )}

                        {/* Delete Button */}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-red-400 hover:text-red-300 border border-red-500/30"
                                title="Delete"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white border border-white/20"
                            title="Close (ESC)"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="relative flex-1 flex items-center justify-center p-6">
                    {loading && (
                        <div className="flex flex-col items-center gap-4">
                            <svg className="animate-spin h-12 w-12 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <p className="text-white text-lg">Loading preview...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-white text-lg">{error}</p>
                        </div>
                    )}

                    {!loading && !error && previewUrl && (
                        <>
                            {isImage && (
                                <Image
                                    width={500}
                                    height={500}
                                    src={previewUrl}
                                    alt={fileName}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            )}

                            {isVideo && (
                                <video
                                    src={previewUrl}
                                    controls
                                    className="max-w-full max-h-full rounded-lg"
                                    autoPlay
                                    preload="auto"
                                >
                                    Your browser does not support video playback.
                                </video>
                            )}

                            {isAudio && (
                                <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                                    {/* Audio Icon */}
                                    <div className="w-32 h-32 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                                        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                        </svg>
                                    </div>

                                    {/* Audio Player */}
                                    <audio
                                        src={previewUrl}
                                        controls
                                        className="w-full"
                                        preload="auto"
                                        style={{
                                            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                                        }}
                                    >
                                        Your browser does not support audio playback.
                                    </audio>

                                    {/* File Info */}
                                    <div className="text-center">
                                        <p className="text-white text-lg font-medium">{fileName}</p>
                                        <p className="text-gray-400 text-sm mt-1">High Quality Audio • {fileSize}</p>
                                    </div>
                                </div>
                            )}

                            {isPDF && (
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full rounded-lg"
                                    title={fileName}
                                />
                            )}

                            {!canPreview && (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                                        <span className="text-4xl">📄</span>
                                    </div>
                                    <p className="text-white text-lg">Preview not available for this file type</p>
                                    <button
                                        onClick={onDownload}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        Download to View
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Navigation Arrows */}
                    {hasPrevious && onPrevious && (
                        <button
                            onClick={onPrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors text-white"
                            title="Previous (←)"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {hasNext && onNext && (
                        <button
                            onClick={onNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors text-white"
                            title="Next (→)"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Footer with keyboard hints */}
                <div className="relative z-10 px-6 py-3 glass-card border-t border-white/10">
                    <p className="text-xs text-gray-400 text-center font-body">
                        <kbd className="px-2 py-1 glass-card border border-white/20 rounded">ESC</kbd> Close
                        {hasPrevious && <> • <kbd className="px-2 py-1 glass-card border border-white/20 rounded">←</kbd> Previous</>}
                        {hasNext && <> • <kbd className="px-2 py-1 glass-card border border-white/20 rounded">→</kbd> Next</>}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MediaPreviewModal;
