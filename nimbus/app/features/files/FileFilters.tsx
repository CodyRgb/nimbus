import React from 'react';

interface FileFiltersProps {
  onFilterChange: (filterType: string, value: string) => void;
}

const FileFilters: React.FC<FileFiltersProps> = ({ onFilterChange }) => {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      <button className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium whitespace-nowrap">
        All Files
      </button>
      <button className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-600">
        Images
      </button>
      <button className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-600">
        Videos
      </button>
      <button className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-600">
        Documents
      </button>
      <button className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-600">
        Audio
      </button>
    </div>
  );
};

export default FileFilters;
