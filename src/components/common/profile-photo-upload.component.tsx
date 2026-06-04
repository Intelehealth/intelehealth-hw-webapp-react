import { useCallback, useState } from 'react';
import DefaultUserImage from '../../assets/images/default-user-img.svg';
import PhotoUploadModal from './photo-upload-modal.component';
import { fileToBase64 } from '../../modules/profile/profile.helpers';
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

  const handleTakePhoto = () => {};

  const handleUploadPhoto = useCallback(
    async (file: File) => {
      setIsPhotoModalOpen(false);
      if (imageFormat === 'base64') {
        const base64 = await fileToBase64(file);
        onUpload(base64);
      } else {
        onUpload(file);
      }
    },
    [imageFormat, onUpload]
  );

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
