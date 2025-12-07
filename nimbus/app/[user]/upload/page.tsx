"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import EnhancedUpload from "../../components/EnhancedUpload";
import ParticleBackground from "../../components/ui/ParticleBackground";
import GlassCard from "../../components/ui/GlassCard";
import api from "../../../lib/api";

interface FileData {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
}

export default function UploadPage() {
    const router = useRouter();
    const [uploadComplete, setUploadComplete] = useState(false);
    const [recentFiles, setRecentFiles] = useState<FileData[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);

    const fetchRecentFiles = useCallback(async () => {
        setLoadingFiles(true);
        try {
            const res = await api.get("/files");
            setRecentFiles((res.data.files || []).slice(0, 5));
        } catch (error) {
            console.error("Failed to fetch recent files", error);
        } finally {
            setLoadingFiles(false);
        }
    }, []);

    useEffect(() => {
        fetchRecentFiles();
    }, [fetchRecentFiles]);

    const handleUploadComplete = useCallback(() => {
        setUploadComplete(true);
        fetchRecentFiles();
        // Removed redirection to keep user on the same page
        setTimeout(() => {
            setUploadComplete(false);
        }, 3000);
    }, [fetchRecentFiles]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎬';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📕';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
        return '📄';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-deep-space-start via-deep-space-end to-deep-space-start text-white p-6 relative overflow-hidden">
            <ParticleBackground />

            <div className="absolute top-20 left-10 w-96 h-96 bg-aurora-purple/30 rounded-full blur-3xl animate-float opacity-50" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-aurora-blue/30 rounded-full blur-3xl animate-float opacity-50" style={{ animationDelay: "2s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-aurora-pink/20 rounded-full blur-3xl animate-float opacity-40" style={{ animationDelay: "4s" }} />

            <div className="max-w-5xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <EnhancedUpload onUploadComplete={handleUploadComplete} />
                </motion.div>

                {uploadComplete && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6"
                    >
                        <GlassCard className="p-6 bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    className="text-4xl"
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    ✅
                                </motion.div>
                                <div>
                                    <h3 className="text-xl font-bold text-white font-display">Upload Complete!</h3>
                                    <p className="text-green-300 font-body">File uploaded successfully.</p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                <motion.div
                    className="mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gradient font-display">Recently Uploaded</h2>
                    </div>

                    <GlassCard className="p-6 bg-gradient-to-br from-white/5 to-white/10 border-white/10">
                        {loadingFiles ? (
                            <div className="text-center py-12">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="inline-block text-5xl mb-4"
                                >
                                    ⚡
                                </motion.div>
                                <p className="text-gray-400 font-body">Loading recent files...</p>
                            </div>
                        ) : recentFiles.length > 0 ? (
                            <div className="space-y-3">
                                {recentFiles.map((file, index) => (
                                    <motion.div
                                        key={file._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="flex items-center justify-between p-4 glass-card border border-white/5 rounded-xl hover:border-aurora-blue/30 hover:bg-white/5 transition-all cursor-pointer group"
                                        whileHover={{ scale: 1.02, x: 5 }}
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <motion.div
                                                className="text-4xl flex-shrink-0"
                                                whileHover={{ scale: 1.2, rotate: 10 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                            >
                                                {getFileIcon(file.mimeType)}
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white truncate font-display group-hover:text-aurora-blue transition-colors">
                                                    {file.originalName}
                                                </p>
                                                <p className="text-sm text-gray-400 font-body">
                                                    {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <motion.div
                                            className="text-aurora-blue opacity-0 group-hover:opacity-100 transition-opacity"
                                            initial={{ x: -10 }}
                                            whileHover={{ x: 0 }}
                                        >
                                            →
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📁</div>
                                <p className="text-gray-400 text-lg font-body">No files uploaded yet</p>
                                <p className="text-gray-500 text-sm font-body mt-2">Upload your first file to get started!</p>
                            </div>
                        )}
                    </GlassCard>
                </motion.div>

                <motion.div
                    className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <GlassCard className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                        <h3 className="text-xl font-bold text-white mb-3 font-display flex items-center gap-2">
                            <span>💡</span> Upload Tips
                        </h3>
                        <ul className="space-y-2 text-gray-300 font-body">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                <span>Drag and drop files directly into the upload area</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                <span>Maximum file size: 2GB per file</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                <span>All file types are supported</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                <span>Files are automatically encrypted</span>
                            </li>
                        </ul>
                    </GlassCard>

                    <GlassCard className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                        <h3 className="text-xl font-bold text-white mb-3 font-display flex items-center gap-2">
                            <span>🎯</span> Features
                        </h3>
                        <ul className="space-y-2 text-gray-300 font-body">
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400">•</span>
                                <span>Unlimited storage space</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400">•</span>
                                <span>Fast upload speeds</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400">•</span>
                                <span>Secure cloud storage</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400">•</span>
                                <span>Access from anywhere</span>
                            </li>
                        </ul>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}
