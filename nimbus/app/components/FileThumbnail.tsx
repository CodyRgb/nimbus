"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import api from '../../lib/api';
import { cacheDB } from '../../lib/db';
import Image from 'next/image';

interface FileThumbnailProps {
    fileId: string;
    fileName: string;
    mimeType: string;
    className?: string;
    size?: 'small' | 'medium' | 'large';
    lazy?: boolean;
}

const FileThumbnail: React.FC<FileThumbnailProps> = ({
    fileId,
    fileName,
    mimeType,
    className = "",
    size = 'medium',
    lazy = true,
}) => {
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const hasFetched = useRef(false);

    // Intersection observer for lazy loading
    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: true,
        skip: !lazy,
    });

    useEffect(() => {
        if (!isImage && !isVideo) {
            setLoading(false);
            return;
        }

        // Only fetch when in view (or if lazy loading is disabled)
        if (!lazy || inView) {
            if (hasFetched.current) return;
            hasFetched.current = true;

            setLoading(true);
            let isMounted = true;

            const fetchThumbnail = async () => {
                try {
                    // Check IndexedDB cache first
                    const cachedUrl = await cacheDB.getThumbnail(fileId);

                    if (cachedUrl && isMounted) {
                        setPreviewUrl(cachedUrl);
                        setLoading(false);
                        return;
                    }

                    // Fetch from API with size parameter
                    const response = await api.get(`/files/${fileId}/thumbnail`, {
                        params: { size },
                    });

                    if (isMounted && response.data.thumbnailUrl) {
                        const url = response.data.thumbnailUrl;
                        setPreviewUrl(url);
                        setLoading(false);

                        // Cache in IndexedDB
                        await cacheDB.setThumbnail(fileId, url);
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
        }
    }, [fileId, mimeType, fileName, isImage, isVideo, inView, lazy, size]);

    // Skeleton loader
    if (loading && (isImage || isVideo)) {
        return (
            <div ref={ref} className={`flex items-center justify-center bg-gray-800 ${className}`}>
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Placeholder when not yet in view
    if (lazy && !inView && !previewUrl) {
        return (
            <div ref={ref} className={`flex items-center justify-center bg-gray-800 ${className}`}>
                <span className="text-2xl opacity-50">⏳</span>
            </div>
        );
    }

    if (error || !previewUrl) {
        return (
            <div ref={ref} className={`flex items-center justify-center bg-gray-800 ${className}`}>
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
        <div ref={ref} className={`relative bg-gray-900 ${className}`}>
            <Image
                src={previewUrl}
                alt={fileName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading={lazy ? "lazy" : "eager"}
                quality={size === 'small' ? 75 : 85}
            />
        </div>
    );
};

export default FileThumbnail;
