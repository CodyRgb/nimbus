"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAxiosError } from 'axios';
import api from '../../lib/api';
import GlassCard from './ui/GlassCard';
import ParticleBackground from './ui/ParticleBackground';

interface EnhancedUploadProps {
    onUploadComplete: () => void;
}

export default function EnhancedUpload({ onUploadComplete }: EnhancedUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const uploadFile = async (file: File) => {
        setUploading(true);
        setProgress(0);
        setError('');
        setUploadedFile(file);

        const formData = new FormData();
        formData.append('files', file);

        try {
            await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setProgress(percentCompleted);
                },
            });

            // Success animation delay
            setTimeout(() => {
                onUploadComplete();
                setUploadedFile(null);
                setProgress(0);
            }, 1000);
        } catch (err) {
            console.error(err);
            const message = isAxiosError(err) ? (err.response?.data?.message || 'Upload failed') : 'Upload failed';
            setError(message);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            await uploadFile(file);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            uploadFile(file);
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

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="relative min-h-[400px] overflow-hidden rounded-3xl">
            {/* Particle Background */}
            <div className="absolute inset-0 opacity-30">
                <ParticleBackground />
            </div>

            {/* Floating gradient orbs */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-aurora-purple/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-aurora-blue/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

            <GlassCard className="relative z-10 p-8 border-2 border-white/10">
                <h3 className="text-2xl font-bold mb-6 text-gradient font-display">Upload Files</h3>

                <motion.div
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${isDragging
                        ? 'border-aurora-blue bg-aurora-blue/10 scale-105'
                        : uploading
                            ? 'border-aurora-purple bg-aurora-purple/5'
                            : 'border-white/20 hover:border-aurora-blue/50 hover:bg-white/5'
                        }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    whileHover={{ scale: uploading ? 1 : 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <input
                        type="file"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="hidden"
                        id="file-upload"
                    />

                    <label htmlFor="file-upload" className="cursor-pointer block">
                        <AnimatePresence mode="wait">
                            {uploading ? (
                                <motion.div
                                    key="uploading"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    <motion.div
                                        className="text-6xl mb-4"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >
                                        ⚡
                                    </motion.div>
                                    <p className="text-lg font-semibold text-white font-display">
                                        Uploading {uploadedFile?.name}...
                                    </p>
                                    <p className="text-sm text-gray-400 font-body">
                                        {formatSize(uploadedFile?.size || 0)}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="w-full max-w-md mx-auto">
                                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-aurora rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                        <p className="text-sm text-aurora-blue mt-2 font-semibold">{progress}%</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
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
                                        {isDragging ? 'Drop your file here' : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-sm text-gray-400 font-body">
                                        Any file type • Max 2GB
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </label>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-4 glass-card border border-red-500/30 bg-red-500/10 rounded-xl"
                        >
                            <p className="text-red-400 text-sm font-semibold">❌ {error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

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
        </div>
    );
}
