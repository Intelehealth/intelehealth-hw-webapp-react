import { useCallback, useEffect, useRef, useState } from 'react';
import type { Crop, PixelCrop } from 'react-image-crop';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Button from './button.component';

export interface ImageCropModalProps {
  image: string | File;
  onCropComplete: (croppedImage: string | File) => void;
  manual?: boolean;
  outputType?: 'base64' | 'file';
  onCancel?: () => void;
  aspectRatio?: number;
  resizeToWidth?: number;
}

const ImageCropModal = ({
  image,
  onCropComplete,
  manual = false,
  outputType = 'base64',
  onCancel,
  aspectRatio = 1,
  resizeToWidth = 256,
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isError, setIsError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = typeof image === 'string' ? image : URL.createObjectURL(image);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => setIsError(false);
    img.onerror = () => setIsError(true);
    img.src = url;

    return () => {
      if (typeof image !== 'string') {
        URL.revokeObjectURL(url);
      }
    };
  }, [image]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;

      const centeredCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 95,
          },
          aspectRatio,
          width,
          height
        ),
        width,
        height
      );

      setCrop(centeredCrop);

      if (centeredCrop.width && centeredCrop.height) {
        setCompletedCrop({
          unit: 'px',
          x: (centeredCrop.x / 100) * width,
          y: (centeredCrop.y / 100) * height,
          width: (centeredCrop.width / 100) * width,
          height: (centeredCrop.height / 100) * height,
        });
      }
    },
    [aspectRatio]
  );

  const handleSave = async () => {
    if (completedCrop && imgRef.current && !isError) {
      try {
        const result = await getCroppedImg(
          imgRef.current,
          completedCrop,
          outputType,
          resizeToWidth
        );
        if (result) {
          onCropComplete(result);
        }
      } catch (error) {
        console.error('Error cropping image:', error);
        setIsError(true);
      }
    }
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative bg-white rounded-xl shadow-2xl z-10 flex flex-col justify-center items-center p-6"
        style={{
          width: '490px',
          maxWidth: '90%',
        }}
      >
        <div className="absolute right-6 top-5">
          <button
            onClick={handleClose}
            className="border-none bg-transparent outline-none hover:opacity-70 transition-opacity flex items-center gap-2 text-gray-600 text-sm"
            aria-label="Close"
          >
            Close
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div
          className="w-full mt-4"
          style={{
            maxHeight: '70vh',
            overflow: 'auto',
            textAlign: 'center',
            padding: '20px',
          }}
        >
          {!isError ? (
            <ReactCrop
              crop={crop}
              onChange={c => {
                if (c && c.width && c.height) {
                  setCrop(c);
                }
              }}
              onComplete={c => {
                if (c && c.width && c.height) {
                  setCompletedCrop(c);
                }
              }}
              aspect={aspectRatio}
              circularCrop
              locked={false}
              disabled={false}
              ruleOfThirds={false}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                  margin: '0 auto',
                }}
              />
            </ReactCrop>
          ) : (
            <div className="flex items-center justify-center py-12">
              <h6 className="text-2xl font-bold text-center leading-relaxed">
                Error in selected image
              </h6>
            </div>
          )}
        </div>

        {manual && !isError && (
          <div className="flex flex-row justify-center items-center mt-3">
            <Button
              onClick={handleSave}
              variant="primary"
              disabled={isError || !completedCrop}
              className="px-6 py-2 font-medium rounded"
              style={{
                minWidth: '119px',
                minHeight: '48px',
                backgroundColor: '#5B21B6',
                color: 'white',
                border: '1px solid #EFE8FF',
              }}
            >
              Save
            </Button>
          </div>
        )}
      </div>

      <style>{`
        .ReactCrop {
          display: inline-block;
          position: relative;
          cursor: default;
          max-width: 100%;
        }

        .ReactCrop__crop-selection {
          background: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 0 0 9999px rgba(238, 235, 235, 0.1) !important;
          cursor: default !important;
        }

        .ReactCrop__crop-selection::before {
          content: none !important;
        }

        .ReactCrop__drag-handle {
          width: 8px !important;
          height: 8px !important;
          background-color: rgba(255, 255, 255, 0.9) !important;
          border: 1px solid rgba(128, 128, 128, 0.8) !important;
          border-radius: 0 !important;
          box-shadow: 0 0 3px rgba(0, 0, 0, 0.4) !important;
          opacity: 1 !important;
          display: block !important;
          visibility: visible !important;
          z-index: 10 !important;
          position: absolute !important;
        }

        .ReactCrop__drag-handle.ord-nw {
          top: -4px !important;
          left: -4px !important;
          cursor: nw-resize !important;
        }

        .ReactCrop__drag-handle.ord-ne {
          top: -4px !important;
          right: -4px !important;
          cursor: ne-resize !important;
        }

        .ReactCrop__drag-handle.ord-sw {
          bottom: -4px !important;
          left: -4px !important;
          cursor: sw-resize !important;
        }

        .ReactCrop__drag-handle.ord-se {
          bottom: -4px !important;
          right: -4px !important;
          cursor: se-resize !important;
        }

        .ReactCrop__drag-handle.ord-n {
          top: -4px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          cursor: n-resize !important;
        }

        .ReactCrop__drag-handle.ord-s {
          bottom: -4px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          cursor: s-resize !important;
        }

        .ReactCrop__drag-handle.ord-e {
          top: 50% !important;
          right: -4px !important;
          transform: translateY(-50%) !important;
          cursor: e-resize !important;
        }

        .ReactCrop__drag-handle.ord-w {
          top: 50% !important;
          left: -4px !important;
          transform: translateY(-50%) !important;
          cursor: w-resize !important;
        }

        .ReactCrop__drag-handle:hover {
          background-color: rgba(91, 33, 182, 0.9) !important;
          border-color: white !important;
          transform: scale(1.3) !important;
          transition: all 0.2s ease;
        }

        .ReactCrop__drag-handle.ord-n:hover,
        .ReactCrop__drag-handle.ord-s:hover {
          transform: translateX(-50%) scale(1.3) !important;
        }

        .ReactCrop__drag-handle.ord-e:hover,
        .ReactCrop__drag-handle.ord-w:hover {
          transform: translateY(-50%) scale(1.3) !important;
        }

        .ReactCrop img {
          display: block;
          max-width: 100%;
          touch-action: none;
          opacity: 1 !important;
        }

        .ReactCrop::before,
        .ReactCrop::after {
          display: none !important;
        }

        .ReactCrop__image {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

const getCroppedImg = (
  image: HTMLImageElement,
  crop: PixelCrop,
  outputType: 'base64' | 'file' = 'base64',
  resizeToWidth = 256
): Promise<File | string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return reject(new Error('Could not get canvas context'));
    }

    const size = resizeToWidth;
    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      size,
      size
    );

    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();

    if (outputType === 'file') {
      canvas.toBlob(
        blob => {
          if (!blob) {
            return reject(new Error('Canvas is empty'));
          }
          const file = new File([blob], 'profile-image.png', {
            type: 'image/png',
          });
          resolve(file);
        },
        'image/png',
        0.95
      );
    } else {
      resolve(canvas.toDataURL('image/png', 0.95));
    }
  });
};

export default ImageCropModal;
