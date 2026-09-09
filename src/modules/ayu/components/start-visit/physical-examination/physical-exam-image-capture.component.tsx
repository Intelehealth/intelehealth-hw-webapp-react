import React, { Suspense, useState } from 'react';
import type { CapturedImage } from '../../../types/obs.types';
import {
  PE_IMAGE_RETRY_LABEL,
  PE_IMAGE_UPLOAD_FAILED,
  PE_IMAGE_UPLOADING_LABEL,
} from '../../../utils/ayu.constants';

const PhotoUploadModal = React.lazy(
  () => import('../../../../../components/common/photo-upload-modal.component')
);

interface PhysicalExamImageCaptureProps {
  images: CapturedImage[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  onRetry: (index: number) => void;
}

export const PhysicalExamImageCapture = ({
  images,
  onAdd,
  onRemove,
  onRetry,
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
        // Thumbnails + add more button
        <div className="flex flex-wrap gap-2">
          {images.map((img, index) => {
            const isUploading = img.status === 'uploading';
            const hasFailed = img.status === 'failed';
            return (
              <div key={img.preview} className="relative w-16 h-16">
                <img
                  src={img.preview}
                  alt={`capture-${index}`}
                  className={`w-full h-full object-cover rounded-md border ${
                    hasFailed ? 'border-red-400' : 'border-gray-200'
                  } ${isUploading ? 'opacity-50' : ''}`}
                />

                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/40">
                    <div
                      role="status"
                      aria-label={PE_IMAGE_UPLOADING_LABEL}
                      className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"
                    />
                  </div>
                )}

                {hasFailed && (
                  <button
                    type="button"
                    onClick={() => onRetry(index)}
                    aria-label={PE_IMAGE_RETRY_LABEL}
                    title={PE_IMAGE_UPLOAD_FAILED}
                    className="absolute inset-0 flex items-center justify-center rounded-md bg-red-500/70 text-white text-[10px] font-semibold leading-tight px-1"
                  >
                    {PE_IMAGE_RETRY_LABEL}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={isUploading}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] leading-none hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Add more button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-16 h-16 flex items-center justify-center rounded-md border-2 border-dashed border-emerald-400 text-emerald-500 text-2xl font-light hover:bg-emerald-50 transition-colors"
          >
            +
          </button>
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
