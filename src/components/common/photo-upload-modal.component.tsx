import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  fileToBase64,
  validateImageFormat,
} from '../../modules/profile/profile.helpers';
import { startLoading, stopLoading } from '../../reducers/loader.reducer';
import { showToast } from '../../services/toast';
import { debugLog } from '../../utils/debug-logger';
import Button from './button.component';
import { Loader } from './loader.component';

// Lazy load heavy modals for better performance
const CameraCaptureModal = React.lazy(
  () => import('./camera-capture-modal.component')
);

const PhotoCropModal = React.lazy(() => import('./photo-crop-modal.component'));

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
  const [selectedImageBase64, setSelectedImageBase64] = useState<string>('');
  const cropModalRef = useRef<boolean>(false);

  // Hide body scrollbar when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      debugLog.group('File Upload');
      debugLog.log('File selected:', file.name, file.type, file.size);

      // Validate file format before processing
      if (!validateImageFormat(file)) {
        debugLog.warn('Invalid file format:', file.type);
        showToast(
          'Upload error!',
          'Upload JPG, JPEG or PNG format image only.',
          'warning'
        );
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        debugLog.groupEnd();
        return;
      }

      const base64 = await fileToBase64(file);
      debugLog.log('File converted to base64, length:', base64.length);

      setSelectedImageBase64(base64);
      cropModalRef.current = true;
      setIsCropModalOpen(true);
      debugLog.log('Crop modal opened for file upload');
      debugLog.groupEnd();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenCamera = () => {
    debugLog.log('Opening camera modal');
    setIsCameraModalOpen(true);
  };

  const handleCameraCapture = async (file: File) => {
    debugLog.group('Camera Capture');
    debugLog.log('Camera captured file:', file.name, file.type, file.size);
    debugLog.log('Starting loader');
    dispatch(startLoading());

    // Validate format
    if (!validateImageFormat(file)) {
      debugLog.warn('Invalid camera capture format:', file.type);
      dispatch(stopLoading());
      showToast(
        'Upload error!',
        'Upload JPG, JPEG or PNG format image only.',
        'warning'
      );
      debugLog.groupEnd();
      return;
    }

    try {
      // Convert image
      debugLog.log('Converting camera capture to base64');
      const base64 = await fileToBase64(file);
      debugLog.log('Conversion successful, base64 length:', base64.length);

      // Close camera modal first before opening crop modal
      debugLog.log('Closing camera modal');
      setIsCameraModalOpen(false);

      // Wait for camera modal to unmount, then open crop modal
      debugLog.log('Waiting 150ms for camera modal to unmount');
      setTimeout(() => {
        debugLog.log('Setting image base64 and opening crop modal');
        setSelectedImageBase64(base64);
        cropModalRef.current = true;
        setIsCropModalOpen(true);

        // Stop loader after crop modal has time to render
        debugLog.log('Waiting 200ms before stopping loader');
        setTimeout(() => {
          debugLog.log('Stopping loader');
          dispatch(stopLoading());
          debugLog.groupEnd();
        }, 200);
      }, 150);
    } catch (error) {
      debugLog.error('Error converting file to base64:', error);
      console.error('Error converting file to base64:', error);
      showToast('Upload error!', 'Failed to process image.', 'error');
      dispatch(stopLoading());
      debugLog.groupEnd();
    }
  };

  const handleCameraClose = () => {
    debugLog.log('Camera modal closed by user');
    setIsCameraModalOpen(false);
  };

  const handleCropComplete = (croppedImage: string | File) => {
    debugLog.log('Crop completed, type:', typeof croppedImage);
    setIsCropModalOpen(false);
    setSelectedImageBase64('');
    cropModalRef.current = false;

    // Pass the cropped image to the parent component
    if (typeof croppedImage === 'string') {
      debugLog.log('Converting base64 string to file');
      fetch(croppedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `cropped-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          debugLog.log('File created, calling onUploadPhoto');
          onUploadPhoto(file);
        })
        .catch(error => {
          debugLog.error('Error converting cropped image:', error);
          console.error('Error converting cropped image:', error);
          showToast(
            'Upload error!',
            'Failed to process cropped image.',
            'error'
          );
        });
    } else {
      debugLog.log('File already in correct format, calling onUploadPhoto');
      onUploadPhoto(croppedImage);
    }
  };

  const handleCropCancel = () => {
    debugLog.log('Crop cancelled by user');
    setIsCropModalOpen(false);
    setSelectedImageBase64('');
    cropModalRef.current = false;
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

              {/* Hidden file input for Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {isCameraModalOpen && (
        <Suspense fallback={<Loader />}>
          <CameraCaptureModal
            isOpen={isCameraModalOpen}
            onClose={handleCameraClose}
            onCapture={handleCameraCapture}
          />
        </Suspense>
      )}
      <Loader />
      {/* Crop Modal - Rendered after camera capture or file upload */}
      {isCropModalOpen && selectedImageBase64 && (
        <Suspense fallback={<Loader />}>
          <PhotoCropModal
            image={selectedImageBase64}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            manual={true}
            outputType="file"
          />
        </Suspense>
      )}
    </>
  );
};

export default PhotoUploadModal;
