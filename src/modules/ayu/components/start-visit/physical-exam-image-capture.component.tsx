import React, { Suspense, useState } from 'react';
import AyuButton from '../common/ayu-button.component';

const PhotoUploadModal = React.lazy(
  () => import('../../../../components/common/photo-upload-modal.component')
);

interface PhysicalExamImageCaptureProps {
  images: string[]; // base64 data URLs
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  onUpload: () => void;
  showTick?: boolean;
}

export const PhysicalExamImageCapture = ({
  images,
  onAdd,
  onRemove,
  onUpload,
  showTick = false,
}: PhysicalExamImageCaptureProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUploadPhoto = (file: File) => {
    setIsModalOpen(false);
    onAdd(file);
  };

  return (
    <div className="mt-2">
      {images.length === 0 ? (
        // Empty state
        <div className="flex items-center gap-3 px-3 py-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-9 h-9 flex-shrink-0 rounded-md bg-emerald-500 text-white flex items-center justify-center text-xl font-light hover:bg-emerald-600 transition-colors"
          >
            +
          </button>
          <p className="text-xs text-gray-500">
            Upload an image from gallery or take a picture
          </p>
        </div>
      ) : (
        // Thumbnails + add button + upload action
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map((src, index) => (
              <div key={index} className="relative w-16 h-16">
                <img
                  src={src}
                  alt={`capture-${index}`}
                  className="w-full h-full object-cover rounded-md border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] leading-none hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Add more button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-16 h-16 flex items-center justify-center rounded-md border-2 border-dashed border-emerald-400 text-emerald-500 text-2xl font-light hover:bg-emerald-50 transition-colors"
            >
              +
            </button>
          </div>

          {/* Upload button */}
          <div className="flex justify-center">
            <AyuButton variant="primary" size="sm" onClick={onUpload}>
              Upload
              {showTick && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="ml-1 inline"
                >
                  <path
                    d="M2 7l3.5 3.5L12 3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </AyuButton>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {isModalOpen && (
        <Suspense>
          <PhotoUploadModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onTakePhoto={() => {}}
            onUploadPhoto={handleUploadPhoto}
            skipCrop
          />
        </Suspense>
      )}
    </div>
  );
};
