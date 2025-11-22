"use client";

import { useState, useEffect, useMemo } from "react";
import api from "../../../lib/api";

interface FileData {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
}

export default function StoragePage() {
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortOrder, setSortOrder] = useState("date-desc");

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await api.get("/files");
            setFiles(res.data);
        } catch (error) {
            console.error("Failed to fetch files", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileId: string, fileName: string) => {
        try {
            const response = await api.get(`/files/${fileId}/download`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download file");
        }
    };

    // Stats Calculation
    const stats = useMemo(() => {
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        const typeStats = files.reduce((acc, file) => {
            const type = file.mimeType.split('/')[0];
            acc[type] = (acc[type] || 0) + file.size;
            return acc;
        }, {} as Record<string, number>);

        return { totalSize, typeStats };
    }, [files]);

    // Filter and Sort
    const filteredFiles = useMemo(() => {
        return files
            .filter((file) => {
                const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = filterType === "all" || file.mimeType.startsWith(filterType);
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                if (sortOrder === "date-desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                if (sortOrder === "date-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                if (sortOrder === "name-asc") return a.originalName.localeCompare(b.originalName);
                if (sortOrder === "size-desc") return b.size - a.size;
                return 0;
            });
    }, [files, searchTerm, filterType, sortOrder]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getBarColor = (type: string) => {
        switch (type) {
            case 'image': return 'bg-blue-500';
            case 'video': return 'bg-purple-500';
            case 'application': return 'bg-orange-500'; // Docs usually application/pdf etc
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Storage Overview</h1>

            {/* Stats Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Used Storage</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatSize(stats.totalSize)}</p>
                    </div>
                    <div className="text-right">
                        {/* Could add total limit here if available */}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                    {Object.entries(stats.typeStats).map(([type, size]) => (
                        <div
                            key={type}
                            style={{ width: `${(size / stats.totalSize) * 100}%` }}
                            className={`h-full ${getBarColor(type)}`}
                            title={`${type}: ${formatSize(size)}`}
                        />
                    ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                    {Object.entries(stats.typeStats).map(([type, size]) => (
                        <div key={type} className="flex items-center">
                            <span className={`w-3 h-3 rounded-full mr-2 ${getBarColor(type)}`} />
                            <span className="text-gray-600 dark:text-gray-300 capitalize">{type}</span>
                            <span className="text-gray-400 ml-1">({formatSize(size)})</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="application">Documents</option>
                </select>
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="size-desc">Size (Largest)</option>
                </select>
            </div>

            {/* File List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading files...</div>
                ) : filteredFiles.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white font-semibold border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Size</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredFiles.map((file) => (
                                    <tr key={file._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {file.originalName}
                                        </td>
                                        <td className="px-6 py-4">{formatSize(file.size)}</td>
                                        <td className="px-6 py-4 capitalize">{file.mimeType.split('/')[1]}</td>
                                        <td className="px-6 py-4">{new Date(file.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDownload(file._id, file.originalName)}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                            >
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No files found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
