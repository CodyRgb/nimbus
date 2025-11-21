import React from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster }) => {
  return (
    <div className="w-full aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
      <video
        controls
        className="w-full h-full object-contain"
        poster={poster}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
