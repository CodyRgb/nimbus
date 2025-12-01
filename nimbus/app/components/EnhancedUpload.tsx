"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAxiosError } from 'axios';
import api from '../../lib/api';
import GlassCard from './ui/GlassCard';
import ParticleBackground from './ui/ParticleBackground';
import UploadProgressItem, { UploadProgressItemProps } from './UploadProgressItem';

interface EnhancedUploadProps {
    onUploadComplete: () => void;
}

interface UploadState {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'paused' | 'error' | 'completed' | 'queued';
    uploadedBytes: number;
    totalBytes: number;
    error?: string;
}


const DB_NAME = 'cloudcontainer_db';
const DB_VERSION = 1;
const STORE_NAME = 'uploads';
const COUNTER_KEY = 'upload_counter';

export default function EnhancedUpload({ onUploadComplete }: EnhancedUploadProps) {
    const [uploads, setUploads] = useState<UploadState[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [totalUploadsProcessed, setTotalUploadsProcessed] = useState(0);
    const abortControllers = useRef<{ [key: string]: AbortController }>({});
    const isProcessingQueue = useRef(false);

    // IndexedDB helper functions
    const openDB = (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    };

    const saveUploadsToDB = async (uploadsToSave: UploadState[], counter: number) => {
        try {
            const db = await openDB();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Clear existing data
            await new Promise((resolve, reject) => {
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => resolve(undefined);
                clearRequest.onerror = () => reject(clearRequest.error);
            });

            // Save each upload with its File object
            for (const upload of uploadsToSave) {
                const uploadData = {
                    id: upload.id,
                    file: upload.file, // File objects can be stored in IndexedDB
                    progress: upload.progress,
                    status: upload.status,
                    uploadedBytes: upload.uploadedBytes,
                    totalBytes: upload.totalBytes,
                    error: upload.error
                };
                store.put(uploadData);
            }

            // Save counter
            store.put({ id: COUNTER_KEY, value: counter });

            db.close();
        } catch (error) {
            console.error('Failed to save uploads to IndexedDB:', error);
        }
    };

    const loadUploadsFromDB = async (): Promise<{ uploads: UploadState[], counter: number }> => {
        try {
            const db = await openDB();
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);

            return new Promise((resolve, reject) => {
                const request = store.getAll();

                request.onsuccess = () => {
                    const results = request.result;
                    let counter = 0;
                    const uploads: UploadState[] = [];

                    results.forEach((item: any) => {
                        if (item.id === COUNTER_KEY) {
                            counter = item.value;
                        } else if (item.file) {
                            // Only restore non-completed uploads
                            if (item.status !== 'completed') {
                                uploads.push({
                                    id: item.id,
                                    file: item.file,
                                    progress: 0, // Reset progress to start fresh
                                    status: 'queued', // Always set to queued so they auto-resume
                                    uploadedBytes: 0, // Reset uploaded bytes
                                    totalBytes: item.totalBytes,
                                    error: undefined // Clear any previous errors
                                });
                            }
                        }
                    });

                    db.close();
                    resolve({ uploads, counter });
                };

                request.onerror = () => {
                    db.close();
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Failed to load uploads from IndexedDB:', error);
            return { uploads: [], counter: 0 };
        }
    };

    // Load uploads from IndexedDB on mount
    useEffect(() => {
        const restoreUploads = async () => {
            const { uploads: restoredUploads, counter } = await loadUploadsFromDB();

            if (restoredUploads.length > 0) {
                console.log('Restored', restoredUploads.length, 'uploads from previous session');
                setUploads(restoredUploads);
                setTotalUploadsProcessed(counter);
            }
        };

        restoreUploads();
    }, []);

    // Save to IndexedDB whenever uploads or counter change
    useEffect(() => {
        saveUploadsToDB(uploads, totalUploadsProcessed);
    }, [uploads, totalUploadsProcessed]);

    const startUpload = async (uploadId: string, file: File) => {
        const controller = new AbortController();
        abortControllers.current[uploadId] = controller;

        setUploads(prev => prev.map(u =>
            u.id === uploadId ? { ...u, status: 'uploading', error: undefined } : u
        ));

        const formData = new FormData();
        formData.append('files', file);

        try {
            await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                signal: controller.signal,
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || file.size || 1;
                    const loaded = progressEvent.loaded;
                    const percentCompleted = Math.round((loaded * 100) / total);

                    setUploads(prev => prev.map(u =>
                        u.id === uploadId ? {
                            ...u,
                            progress: percentCompleted,
                            uploadedBytes: loaded,
                            totalBytes: total
                        } : u
                    ));
                },
            });

            setUploads(prev => prev.map(u =>
                u.id === uploadId ? { ...u, status: 'completed', progress: 100, uploadedBytes: u.totalBytes } : u
            ));

            onUploadComplete();

        } catch (err) {
            if (isAxiosError(err) && err.code === 'ERR_CANCELED') {
                setUploads(prev => prev.map(u =>
                    u.id === uploadId ? { ...u, status: 'paused' } : u
                ));
            } else {
                console.error(err);
                const message = isAxiosError(err) ? (err.response?.data?.message || 'Upload failed') : 'Upload failed';
                setUploads(prev => prev.map(u =>
                    u.id === uploadId ? { ...u, status: 'error', error: message } : u
                ));
            }
        } finally {
            delete abortControllers.current[uploadId];
            isProcessingQueue.current = false;
        }
    };

    // Auto-process queue when uploads change
    useEffect(() => {
        const processQueue = async () => {
            if (isProcessingQueue.current) return;

            // Find next upload to process
            const nextUpload = uploads.find(u =>
                u.status === 'queued' && !abortControllers.current[u.id]
            );

            if (!nextUpload) return;

            isProcessingQueue.current = true;
            await startUpload(nextUpload.id, nextUpload.file);
        };

        processQueue();
    }, [uploads]);

    const uploadFiles = async (files: File[]) => {
        const newUploads: UploadState[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            progress: 0,
            status: 'queued',
            uploadedBytes: 0,
            totalBytes: file.size
        }));

        setUploads(prev => [...prev, ...newUploads]);
        setTotalUploadsProcessed(prev => prev + files.length);
    };

    const handlePause = (id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
        }
    };

    const handleResume = (id: string) => {
        const upload = uploads.find(u => u.id === id);
        if (upload) {
            setUploads(prev => prev.map(u =>
                u.id === id ? { ...u, status: 'queued' } : u
            ));
        }
    };

    const handleRetry = (id: string) => {
        const upload = uploads.find(u => u.id === id);
        if (upload) {
            setUploads(prev => prev.map(u =>
                u.id === id ? { ...u, status: 'queued', progress: 0, uploadedBytes: 0, error: undefined } : u
            ));
        }
    };

    const handleCancel = (id: string) => {
        if (abortControllers.current[id]) {
            abortControllers.current[id].abort();
        }
        setUploads(prev => prev.filter(u => u.id !== id));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await uploadFiles(Array.from(e.target.files));
        }
        // Reset input
        e.target.value = '';
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    return (
        <div className="relative min-h-[400px] rounded-3xl">
            <div className="relative z-10">
                <GlassCard className="p-8 border-2 border-white/10 mb-8">
                    <h3 className="text-2xl font-bold mb-6 text-gradient font-display">Upload Files</h3>

                    <motion.div
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${isDragging
                            ? 'border-aurora-blue bg-aurora-blue/10 scale-105'
                            : 'border-white/20 hover:border-aurora-blue/50 hover:bg-white/5'
                            }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />

                        <label htmlFor="file-upload" className="cursor-pointer block">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <motion.div
                                    className="text-6xl mb-4"
                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                    transition={{ type: "spring" }}
                                >
                                    {isDragging ? '📥' : '☁️'}
                                </motion.div>
                                <p className="text-xl font-semibold text-white font-display">
                                    {isDragging ? 'Drop your files here' : 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-sm text-gray-400 font-body">
                                    Any file type • Max 2GB
                                </p>
                            </motion.div>
                        </label>
                    </motion.div>

                    {/* Upload Tips */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: '🚀', title: 'Fast Upload', desc: 'Optimized for speed' },
                            { icon: '🔒', title: 'Secure', desc: 'End-to-end encrypted' },
                            { icon: '♾️', title: 'Unlimited', desc: 'No storage limits' },
                        ].map((tip, i) => (
                            <motion.div
                                key={tip.title}
                                className="glass-card p-4 text-center bg-gradient-to-br from-white/5 to-white/10"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="text-3xl mb-2">{tip.icon}</div>
                                <h4 className="font-semibold text-white mb-1 font-display">{tip.title}</h4>
                                <p className="text-xs text-gray-400 font-body">{tip.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </GlassCard>

                {/* Upload Progress List */}
                <AnimatePresence>
                    {uploads.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                        >
                            <h4 className="text-lg font-semibold text-white mb-4 pl-2">Active Uploads</h4>
                            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {uploads.map((upload, index) => {
                                    // Calculate global position (never resets)
                                    const currentPosition = totalUploadsProcessed - uploads.length + index + 1;

                                    return (
                                        <UploadProgressItem
                                            key={upload.id}
                                            {...upload}
                                            currentPosition={currentPosition}
                                            totalUploads={totalUploadsProcessed}
                                            onPause={() => handlePause(upload.id)}
                                            onResume={() => handleResume(upload.id)}
                                            onRetry={() => handleRetry(upload.id)}
                                            onCancel={() => handleCancel(upload.id)}
                                        />
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
