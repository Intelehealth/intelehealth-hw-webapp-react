import React from 'react';

interface VideoPopupProps {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
}

const toEmbedUrl = (url: string) => {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
};

const VideoPopup: React.FC<VideoPopupProps> = ({
  open,
  title,
  url,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[720px] aspect-video rounded-lg overflow-hidden bg-black"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 text-(--color-dark) flex items-center justify-center hover:bg-white transition cursor-pointer"
        >
          <i className="fa-solid fa-times text-xs" />
        </button>
        <iframe
          className="w-full h-full"
          src={toEmbedUrl(url)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default VideoPopup;
