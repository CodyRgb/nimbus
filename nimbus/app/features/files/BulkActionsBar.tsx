import React from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onMove: () => void;
  onDownload: () => void;
  onClearSelection: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onDelete, onMove, onDownload, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-6 py-3 flex items-center space-x-4 border border-gray-200 dark:border-gray-700 z-40">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{selectedCount} selected</span>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
      <button onClick={onDownload} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" title="Download">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
      </button>
      <button onClick={onMove} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400" title="Move">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
      </button>
      <button onClick={onDelete} className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" title="Delete">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
      <button onClick={onClearSelection} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        Cancel
      </button>
    </div>
  );
};

export default BulkActionsBar;
