import React from 'react';

interface UploadItemProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  onCancel?: () => void;
}

const UploadItem: React.FC<UploadItemProps> = ({ fileName, progress, status, onCancel }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{fileName}</span>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          ✕
        </button>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className={`h-2.5 rounded-full ${
            status === 'error' ? 'bg-red-600' : status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">{status}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{progress}%</span>
      </div>
    </div>
  );
};

export default UploadItem;
