import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { startLoading, stopLoading } from '../../reducers/loader.reducer';
import { Loader } from './loader.component';
import Button from './button.component';
import CameraCaptureModal from './camera-capture-modal.component';
import PhotoCropModal from './photo-crop-modal.component';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onUploadPhoto: (file: File) => void;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadPhoto,
}) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      setSelectedFile(file);
      setIsCropModalOpen(true); // Open crop modal
    }
  };

  const handleOpenCamera = () => {
    dispatch(startLoading()); // Start global loader
    setIsCameraModalOpen(true);
  };

  const handleCameraCapture = (file: File) => {
    dispatch(stopLoading()); // Stop global loader
    setIsCameraModalOpen(false);
    setSelectedFile(file);
    setIsCropModalOpen(true); // Open crop modal with captured image
  };

  const handleCameraClose = () => {
    dispatch(stopLoading()); // Stop global loader
    setIsCameraModalOpen(false);
  };

  const handleCropComplete = (croppedImage: string | File) => {
    setIsCropModalOpen(false);
    setSelectedFile(null);
    // Pass the cropped image to the parent component
    if (typeof croppedImage === 'string') {
      fetch(croppedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `cropped-${Date.now()}.png`, {
            type: 'image/png',
          });
          onUploadPhoto(file);
        });
    } else {
      onUploadPhoto(croppedImage);
    }
  };

  const handleCropCancel = () => {
    setIsCropModalOpen(false);
    setSelectedFile(null);
  };

  return (
    <>
      {/* Global Loader */}
      <Loader />
      {/* Upload Modal - Hide when camera or crop modal is open */}
      {isOpen && !isCameraModalOpen && !isCropModalOpen && (
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
                  onClick={handleOpenCamera}
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
      )}

      {/* Camera Capture Modal - Rendered outside so it persists */}
      {isCameraModalOpen && (
        <CameraCaptureModal
          isOpen={isCameraModalOpen}
          onClose={handleCameraClose}
          onCapture={handleCameraCapture}
        />
      )}

      {/* Crop Modal - Rendered after camera capture or file upload */}
      {isCropModalOpen && selectedFile && (
        <PhotoCropModal
          image={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          manual={true}
          outputType="file"
        />
      )}
    </>
  );
};

export default PhotoUploadModal;
