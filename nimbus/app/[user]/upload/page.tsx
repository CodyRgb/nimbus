"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import api from "../../../lib/api";

interface FileData {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
}

// Add webkitdirectory to InputHTMLAttributes
declare module 'react' {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
        webkitdirectory?: string;
        directory?: string;
    }
}

export default function UploadPage() {
    const params = useParams();
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [recentFiles, setRecentFiles] = useState<FileData[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [progress, setProgress] = useState(0);

    const folderInputRef = useRef<HTMLInputElement>(null);

    const fetchRecentFiles = useCallback(async () => {
        try {
            const res = await api.get("/files");
            setRecentFiles(res.data.slice(0, 5));
        } catch (error) {
            console.error("Failed to fetch recent files", error);
        }
    }, []);

    useEffect(() => {
        fetchRecentFiles();
    }, [fetchRecentFiles]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files);
        }
    };

    const handleUpload = async (files: FileList) => {
        setUploading(true);
        setMessage(null);
        setProgress(0);

        // Check total size
        let totalSize = 0;
        const filesArray = Array.from(files);
        for (const file of filesArray) {
            totalSize += file.size;
        }

        if (totalSize > 2 * 1024 * 1024 * 1024) {
            setMessage({ type: 'error', text: "Total upload size exceeds 2GB limit." });
            setUploading(false);
            return;
        }

        const formData = new FormData();
        filesArray.forEach(file => {
            formData.append("files", file);
        });

        try {
            await api.post("/files/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || totalSize));
                    setProgress(percentCompleted);
                }
            });
            setMessage({ type: 'success', text: `Successfully uploaded ${files.length} file(s)` });
            fetchRecentFiles();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || "Upload failed" });
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Upload Files</h1>

            {/* Upload Area */}
            <div
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors ${dragActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto mb-4 text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                    </div>
                    <p className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                        {uploading ? `Uploading... ${progress}%` : "Drag & Drop files here"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Max 2GB per upload
                    </p>

                    <div className="flex space-x-4 justify-center">
                        <label className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors">
                            Select Files
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                onChange={handleChange}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Status Message */}
            {message && (
                <div className={`mt-4 p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Recent Files */}
            <div className="mt-12">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recently Uploaded</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {recentFiles.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {recentFiles.map((file) => (
                                <li key={file._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            📄
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                                {file.originalName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                        {file.mimeType.split('/')[1] || 'file'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No files uploaded yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
