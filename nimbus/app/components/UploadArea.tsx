import React, { useCallback } from 'react';

const UploadArea: React.FC = () => {
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Handle file drop
    console.log('Files dropped');
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-800"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className="flex flex-col items-center justify-center">
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-lg font-medium text-gray-900 dark:text-white">Drop files here to upload</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to select files</p>
        <input type="file" className="hidden" multiple />
      </div>
    </div>
  );
};

export default UploadArea;
