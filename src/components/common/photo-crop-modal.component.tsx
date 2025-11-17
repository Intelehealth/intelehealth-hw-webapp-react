import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import Button from './button.component';

export interface PhotoCropModalProps {
  image: string | File;
  onCropComplete: (croppedImage: string | File) => void;
  manual?: boolean;
  outputType?: 'base64' | 'file';
  onCancel?: () => void;
}

const PhotoCropModal = ({
  image,
  onCropComplete,
  manual = false,
  outputType = 'base64',
  onCancel,
}: PhotoCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_: any, croppedPixels: any) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const handleSave = async () => {
    if (croppedAreaPixels) {
      const result = await getCroppedImg(image, croppedAreaPixels, outputType);
      if (result) {
        onCropComplete(result);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - Custom purple for mobile, heavily white dimmed for desktop */}
      <div
        className="absolute inset-0 bg-[#2e1e91] lg:bg-white/90"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl lg:rounded-lg shadow-xl mx-6 border border-gray-200 z-10 overflow-hidden p-8 w-1/2">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-64 h-64 bg-gray-200 rounded-full overflow-hidden">
            <Cropper
              image={
                typeof image === 'string' ? image : URL.createObjectURL(image)
              }
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>

          <div className="w-64 flex items-center space-x-2">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {manual && (
            <div className="flex gap-3">
              <Button onClick={handleSave} variant="primary">
                Save
              </Button>
              {onCancel && (
                <Button onClick={onCancel} variant="secondary">
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getCroppedImg = (
  imageSrc: File | string,
  crop: { x: number; y: number; width: number; height: number },
  outputType: 'base64' | 'file' = 'base64'
) => {
  return new Promise<File | string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src =
      typeof imageSrc === 'string' ? imageSrc : URL.createObjectURL(imageSrc);

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = crop.width;
      canvas.height = crop.height;

      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.arc(crop.width / 2, crop.height / 2, crop.width / 2, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();

      if (outputType === 'file') {
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('Canvas is empty'));
          const file = new File([blob], 'cropped.png', { type: 'image/png' });
          resolve(file);
        }, 'image/png');
      } else {
        resolve(canvas.toDataURL('image/png'));
      }
    };

    image.onerror = reject;
  });
};

export default PhotoCropModal;
