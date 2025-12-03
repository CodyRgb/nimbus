import React from 'react';
import { motion } from 'framer-motion';

export interface UploadProgressItemProps {
    file: File;
    progress: number;
    status: 'uploading' | 'paused' | 'error' | 'completed' | 'queued';
    uploadedBytes: number;
    totalBytes: number;
    error?: string;
    currentPosition?: number;
    totalUploads?: number;
    onPause: () => void;
    onResume: () => void;
    onCancel: () => void;
    onRetry: () => void;
}

const UploadProgressItem: React.FC<UploadProgressItemProps> = ({
    file,
    progress,
    status,
    uploadedBytes,
    totalBytes,
    error,
    currentPosition,
    totalUploads,
    onPause,
    onResume,
    onCancel,
    onRetry
}) => {
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3 backdrop-blur-sm"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 mr-4">
                    <h4 className="text-white font-medium truncate text-sm" title={file.name}>
                        {file.name}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {status === 'error' ? (
                            <span className="text-red-400">{error || 'Upload failed'}</span>
                        ) : (
                            <>
                                {formatSize(uploadedBytes)} / {formatSize(totalBytes)} ({progress}%)
                                {currentPosition && totalUploads && (
                                    <span className={status === 'uploading' ? 'text-aurora-blue font-semibold' : ''}>
                                        {' • '}{currentPosition} of {totalUploads}
                                    </span>
                                )}
                                {status === 'uploading' && ' • Uploading...'}
                                {status === 'paused' && ' • Paused'}
                                {status === 'completed' && ' • Completed'}
                                {status === 'queued' && ' • Queued'}
                            </>
                        )}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {status === 'uploading' && (
                        <button
                            onClick={onPause}
                            className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                            title="Pause"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    )}
                    {(status === 'paused' || status === 'error') && (
                        <button
                            onClick={status === 'error' ? onRetry : onResume}
                            className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                            title={status === 'error' ? "Retry" : "Resume"}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    )}
                    {status !== 'completed' && (
                        <button
                            onClick={onCancel}
                            className="p-1.5 rounded-full hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
                            title="Cancel"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    {status === 'completed' && (
                        <span className="text-green-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </span>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-none ${status === 'error' ? 'bg-red-500' :
                        status === 'completed' ? 'bg-green-500' :
                            status === 'paused' ? 'bg-yellow-500' :
                                'bg-gradient-aurora'
                        }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </motion.div>
    );
};

export default UploadProgressItem;
