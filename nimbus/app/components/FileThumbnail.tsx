"use client";

import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import Image from 'next/image';

interface FileThumbnailProps {
    fileId: string;
    fileName: string;
    mimeType: string;
    className?: string;
}

const FileThumbnail: React.FC<FileThumbnailProps> = ({ fileId, fileName, mimeType, className = "" }) => {
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(isImage || isVideo);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!isImage && !isVideo) {
            setLoading(false);
            return;
        }

        setLoading(true);
        let isMounted = true;

        const fetchThumbnail = async () => {
            try {
                // First try to get thumbnail URL from the new endpoint
                const response = await api.get(`/files/${fileId}/thumbnail`);

                if (isMounted && response.data.thumbnailUrl) {
                    setPreviewUrl(response.data.thumbnailUrl);
                    setLoading(false);
                }
            } catch (err) {
                console.error(`Failed to load thumbnail for ${fileName}`, err);
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        fetchThumbnail();

        return () => {
            isMounted = false;
        };
    }, [fileId, mimeType, fileName, isImage, isVideo]);

    if (loading && (isImage || isVideo)) {
        return (
            <div className={`flex items-center justify-center bg-gray-800 ${className}`}>
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !previewUrl) {
        return (
            <div className={`flex items-center justify-center bg-gray-800 ${className}`}>
                <span className="text-4xl">
                    {mimeType.startsWith('image/') ? '🖼️' :
                        mimeType.startsWith('video/') ? '🎬' :
                            mimeType.startsWith('audio/') ? '🎵' : '📄'}
                </span>
            </div>
        );
    }

    if (mimeType.startsWith('video/')) {
        return (
            <div className={`relative bg-black flex items-center justify-center ${className}`}>
                <video
                    src={previewUrl}
                    className="max-w-full max-h-full object-cover w-full h-full"
                    preload="metadata"
                    muted // Muted to allow potential autoplay if we wanted, but mostly to avoid noise
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white text-xl">▶</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative bg-gray-900 ${className}`}>
            <Image
                src={previewUrl}
                alt={fileName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </div>
    );
};

export default FileThumbnail;
