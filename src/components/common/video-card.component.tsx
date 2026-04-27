import React from 'react';

interface VideoCardProps {
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  title,
  duration,
  thumbnail,
  videoUrl,
}) => {
  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <div className="flex flex-row items-center gap-3 py-4 border-b border-gray-100 md:flex-col md:items-start md:py-0 md:border-b-0 md:gap-2">
        <div className="relative group rounded-lg overflow-hidden shrink-0 w-[120px] h-[78px] md:w-full md:h-auto md:aspect-video">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#2E1E91]/80 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center group-hover:scale-110 transition">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M4 2L14 8L4 14V2Z" fill="#ffffff" />
              </svg>
            </div>
          </div>

          <div
            className="absolute bottom-1.5 right-1.5 bg-black/70 text-white px-1.5 py-0.5 rounded"
            style={{ fontSize: '10px' }}
          >
            {duration}
          </div>
        </div>
        <span className="text-sm text-gray-800 leading-snug">{title}</span>
      </div>
    </a>
  );
};

export default VideoCard;
