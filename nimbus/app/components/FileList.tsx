import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import FileGrid from '../features/files/FileGrid';

interface FileData {
    _id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
}

const FileList = ({ refreshTrigger }: { refreshTrigger: number }) => {
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFiles = async () => {
        try {
            const res = await api.get('/files');
            setFiles(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [refreshTrigger]);

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
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm("Are you sure you want to delete this file?")) return;
        
        try {
            await api.delete(`/files/${fileId}`);
            fetchFiles();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    // Map to FileGrid format
    const gridFiles = files.map(f => ({
        id: f._id,
        name: f.originalName,
        type: f.mimeType,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        thumbnailUrl: f.mimeType.startsWith('image/') ? undefined : undefined // We could add thumbnail logic later
    }));

    if (loading) return <div>Loading files...</div>;

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Your Files</h2>
            {files.length === 0 ? (
                <p className="text-gray-500">No files uploaded yet.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file) => (
                        <div key={file._id} className="border rounded-lg p-4 flex flex-col justify-between bg-white dark:bg-gray-800 shadow-sm">
                            <div>
                                <div className="flex items-center justify-center h-24 bg-gray-100 dark:bg-gray-700 rounded mb-2">
                                    <span className="text-gray-500 text-xs">{file.mimeType}</span>
                                </div>
                                <p className="font-medium truncate" title={file.originalName}>{file.originalName}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <div className="flex justify-between mt-4">
                                <button 
                                    onClick={() => handleDownload(file._id, file.originalName)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Download
                                </button>
                                <button 
                                    onClick={() => handleDelete(file._id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileList;
