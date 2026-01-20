import { useCallback, useState } from 'react';
import DefaultUserImage from '../../assets/images/default-user-img.svg';
import ImageCropModal from './image-crop-modal.component';
import PhotoUploadModal from './photo-upload-modal.component';

type ProfilePhotoUploadProps = {
  image: string; // base64 or URL
  onUpload: (img: string | File) => void;
  imageFormat?: 'base64' | 'file';
};

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  image,
  onUpload,
  imageFormat = 'file',
}) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleTakePhoto = () => {};

  const handleUploadPhoto = (file: File) => {
    setSelectedFile(file);
    setIsPhotoModalOpen(false);
    setIsCropModalOpen(true);
  };

  const handleCropComplete = useCallback(
    async (croppedFile: File | string) => {
      setIsCropModalOpen(false);
      onUpload(croppedFile);
    },
    [onUpload]
  );

  const handleCropCancel = useCallback(() => {
    setIsCropModalOpen(false);
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

      {isCropModalOpen && selectedFile && (
        <ImageCropModal
          image={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          outputType={imageFormat}
          manual={true}
          aspectRatio={1}
          resizeToWidth={256}
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
