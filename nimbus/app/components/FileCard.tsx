import React from 'react';

interface FileCardProps {
  name: string;
  type: string;
  size: string;
  thumbnailUrl?: string;
  onSelect?: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ name, type, size, thumbnailUrl, onSelect }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <div className="aspect-w-10 aspect-h-7 mb-4 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden flex items-center justify-center">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={name} className="object-cover w-full h-full" />
        ) : (
          <span className="text-gray-400 text-4xl">📄</span>
        )}
      </div>
      <div className="flex justify-between items-start">
        <div className="truncate">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={name}>{name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{size}</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <span className="sr-only">Options</span>
          ⋮
        </button>
      </div>
    </div>
  );
};

export default FileCard;
