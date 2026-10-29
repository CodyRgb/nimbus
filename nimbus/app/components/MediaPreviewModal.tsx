"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
    onShare?: () => void;
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
    onShare,
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
            const response = await api.get(`/files/${fileId}/preview?quality=low`, {
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

    // Ensure we only render on the client
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) return null;

    const isImage = fileType.startsWith('image/');
    const isVideo = fileType.startsWith('video/');
    const isAudio = fileType.startsWith('audio/');
    const isPDF = fileType === 'application/pdf';
    const canPreview = isImage || isVideo || isAudio || isPDF;

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full h-full flex flex-col">
                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-6 py-3.5 bg-[#202327] border-b border-white/10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white truncate font-sans tracking-tight" title={fileName}>
                                {fileName}
                            </h3>
                            <span className="px-2 py-0.5 bg-[#16181B] border border-white/15 text-[10px] font-mono text-[#B8FE00] font-bold uppercase tracking-wider">
                                {fileType.split('/')[1]?.toUpperCase() || 'ASSET'}
                            </span>
                        </div>
                        <p className="text-xs font-mono text-white/50 mt-0.5">
                            SIZE: {fileSize} • HARDWARE-ENCRYPTED BUFFER
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 ml-4">
                        {/* Share Button */}
                        {onShare && (
                            <button
                                onClick={onShare}
                                className="px-3.5 py-1.5 bg-[#0720C6] hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md border border-[#0720C6]"
                                title="Share encrypted link & permissions"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span>SHARE</span>
                            </button>
                        )}

                        {/* Download Button */}
                        {onDownload && (
                            <button
                                onClick={onDownload}
                                className="px-3.5 py-1.5 bg-[#B8FE00] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-white transition-all flex items-center gap-1.5 shadow-md"
                                title="Download decrypted asset"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>DOWNLOAD</span>
                            </button>
                        )}

                        {/* Delete Button */}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1"
                                title="Delete file"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>DELETE</span>
                            </button>
                        )}

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-1.5 bg-[#16181B] hover:bg-white hover:text-black text-white border border-white/20 transition-all"
                            title="Close (ESC)"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                    className="max-w-full max-h-full object-contain"
                                />
                            )}

                            {isVideo && (
                                <video
                                    src={previewUrl}
                                    controls
                                    className="max-w-full max-h-full"
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
                                    className="w-full h-full"
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
                                        className="px-6 py-2.5 bg-[#B8FE00] hover:bg-white text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg"
                                    >
                                        DOWNLOAD ASSET
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Navigation Arrows */}
                    {hasPrevious && onPrevious && (
                        <button
                            onClick={onPrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-[#16181B]/90 hover:bg-[#B8FE00] hover:text-black border border-white/20 transition-all text-white shadow-xl"
                            title="Previous (←)"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {hasNext && onNext && (
                        <button
                            onClick={onNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-[#16181B]/90 hover:bg-[#B8FE00] hover:text-black border border-white/20 transition-all text-white shadow-xl"
                            title="Next (→)"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Footer with keyboard hints */}
                <div className="relative z-10 px-6 py-2.5 bg-[#16181B] border-t border-white/10">
                    <p className="text-[11px] font-mono text-white/50 text-center uppercase tracking-wider">
                        <kbd className="px-1.5 py-0.5 bg-[#202327] border border-white/20 text-white font-mono mr-1">ESC</kbd> CLOSE
                        {hasPrevious && <> • <kbd className="px-1.5 py-0.5 bg-[#202327] border border-white/20 text-white font-mono mx-1">←</kbd> PREVIOUS</>}
                        {hasNext && <> • <kbd className="px-1.5 py-0.5 bg-[#202327] border border-white/20 text-white font-mono mx-1">→</kbd> NEXT</>}
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MediaPreviewModal;
