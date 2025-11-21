import React from 'react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={onClose}>
      <div className="relative max-w-4xl max-h-screen p-4">
        <button
          className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 focus:outline-none"
          onClick={onClose}
        >
          ✕
        </button>
        <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain" />
      </div>
    </div>
  );
};

export default ImagePreview;
