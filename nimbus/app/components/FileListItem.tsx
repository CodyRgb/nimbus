import React from 'react';

interface FileListItemProps {
  name: string;
  type: string;
  size: string;
  date: string;
  onSelect?: () => void;
}

const FileListItem: React.FC<FileListItemProps> = ({ name, type, size, date, onSelect }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={onSelect}>
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
           <span className="text-xl">📄</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 md:hidden">{size} • {date}</p>
        </div>
      </div>
      <div className="hidden md:flex items-center space-x-8">
        <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 w-20 text-right">{size}</span>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          ⋮
        </button>
      </div>
    </div>
  );
};

export default FileListItem;
