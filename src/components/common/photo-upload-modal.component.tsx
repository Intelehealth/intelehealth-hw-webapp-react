import React, { useEffect, useRef } from 'react';
import Button from './button.component';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onUploadPhoto: (file: File) => void;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onTakePhoto,
  onUploadPhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hide body scrollbar when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scrollbar when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadPhoto(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - Custom purple for mobile, heavily white dimmed for desktop */}
      <div
        className="absolute inset-0 bg-[#2e1e91] lg:bg-white/90"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl lg:rounded-lg shadow-xl mx-6 border border-gray-200 z-10 overflow-hidden"
        style={{ width: '500px', height: '250px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Upload/Change photo
          </h3>
          <button
            onClick={onClose}
            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors border"
            style={{ borderColor: '#7f7b92' }}
          >
            <i
              className="fa-solid fa-times"
              style={{ fontSize: '8px', color: '#7f7b92' }}
            ></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Take Photo Option */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 ">
                <i className="fa-solid fa-camera text-green-600 text-lg"></i>
              </div>
              <span className="text-gray-800 font-medium text-base">
                Take photo
              </span>
            </div>
            <Button
              onClick={onTakePhoto}
              variant="primary"
              size="md"
              className="px-6"
              leftIcon={<i className="fa-solid fa-camera text-white"></i>}
            >
              Use Camera
            </Button>
          </div>

          {/* Upload Photo Option */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 ">
                <i className="fa-solid fa-upload text-green-600 text-lg"></i>
              </div>
              <span className="text-gray-800 font-medium text-base">
                Upload photo
              </span>
            </div>
            <Button
              onClick={handleUploadClick}
              variant="primary"
              size="md"
              className="px-6"
              leftIcon={<i className="fa-solid fa-upload text-white"></i>}
            >
              Upload
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal;
