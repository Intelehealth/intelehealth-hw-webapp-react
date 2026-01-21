import { useCallback, useState } from 'react';
import DefaultUserImage from '../../assets/images/default-user-img.svg';
import PhotoCropModal from './photo-crop-modal.component';
import PhotoUploadModal from './photo-upload-modal.component';

type ProfilePhotoUploadProps = {
  image: string; // base64 or URL
  onUpload: (img: string | File) => void;
  imageFormat?: 'base64' | 'file';
};

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  image,
  onUpload,
  imageFormat = 'file',
}) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string>('');

  const handleTakePhoto = () => {};

  const handleUploadPhoto = useCallback(async (file: File) => {
    const base64 = await fileToBase64(file);
    setSelectedImageBase64(base64);
    setIsPhotoModalOpen(false);
    setIsCropModalOpen(true);
  }, []);

  const handleCropComplete = useCallback(
    async (croppedFile: File | string) => {
      setIsCropModalOpen(false);
      setSelectedImageBase64(''); // Clear base64 reference
      onUpload(croppedFile);
    },
    [onUpload]
  );

  const handleCropCancel = useCallback(() => {
    setIsCropModalOpen(false);
    setSelectedImageBase64(''); // Clear base64 reference
  }, []);

  return (
    <>
      <div className="flex items-center justify-center w-full bg-white">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Profile circle */}
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
            <img
              src={image || DefaultUserImage}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
              onError={e => {
                e.currentTarget.src = DefaultUserImage;
              }}
            />
          </div>

          {/* Camera button */}
          <button
            type="button"
            onClick={() => setIsPhotoModalOpen(true)}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shadow-md"
          >
            <i className="fa-solid fa-camera text-purple-600 text-lg"></i>
          </button>
        </div>
      </div>

      {isCropModalOpen && selectedImageBase64 && (
        <PhotoCropModal
          image={selectedImageBase64}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          outputType={imageFormat}
          manual={true}
        />
      )}
      {isPhotoModalOpen && (
        <PhotoUploadModal
          onTakePhoto={handleTakePhoto}
          onUploadPhoto={handleUploadPhoto}
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
        />
      )}
    </>
  );
};
