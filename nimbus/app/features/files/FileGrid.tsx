import React from 'react';
import FileCard from '../../components/FileCard';

interface FileGridProps {
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    thumbnailUrl?: string;
  }>;
  onFileSelect: (fileId: string) => void;
}

const FileGrid: React.FC<FileGridProps> = ({ files, onFileSelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {files.map((file) => (
        <FileCard
          key={file.id}
          name={file.name}
          type={file.type}
          size={file.size}
          thumbnailUrl={file.thumbnailUrl}
          onSelect={() => onFileSelect(file.id)}
        />
      ))}
    </div>
  );
};

export default FileGrid;
