import React, { useState } from 'react';
import { isAxiosError } from 'axios';
import api from '../../lib/api';

const Upload = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await uploadFiles(Array.from(e.target.files));
        }
    };

    const uploadFiles = async (files: File[]) => {
        setUploading(true);
        setProgress(0);
        setError('');

        const formData = new FormData();
<<<<<<< HEAD
        formData.append('files', file);
=======
        files.forEach(file => {
            formData.append('files', file);
        });
>>>>>>> 1a14695ebf6ff247bb4d8887164f58e75a5e9d34

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
            onUploadComplete();
        } catch (err) {
            console.error(err);
            const message = isAxiosError(err) ? (err.response?.data?.message || 'Upload failed') : 'Upload failed';
            setError(message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4">Upload File</h3>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Any file (Max 2GB)</p>
                    </div>
                    <input id="dropzone-file" type="file" multiple className="hidden" onChange={handleFileChange} disabled={uploading} />
                </label>
            </div>

            {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    <p className="text-xs text-center mt-1">{progress}%</p>
                </div>
            )}

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
};

export default Upload;
