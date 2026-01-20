import React, { useEffect, useRef, useState } from 'react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('[Camera] getUserMedia not supported');
        return;
      }
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        console.error('[Camera] Not a secure context');
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video to be ready to play
        videoRef.current.onloadedmetadata = () => {
          // Ensure video is playing
          videoRef.current
            ?.play()
            .then(() => {
              // Auto-capture after camera is fully ready and playing
              setTimeout(() => {
                capturePhoto();
              }, 1000);
            })
            .catch(err => {
              console.error('[Camera] Error playing video:', err);
            });
        };
      }
    } catch (err) {
      console.error('[Camera] Error accessing camera:', err);
      if (err instanceof Error) {
        console.error('[Camera] Error name:', err.name);
        console.error('[Camera] Error message:', err.message);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('[Camera] Video or canvas ref not available');
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('[Camera] Video dimensions are zero, cannot capture');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[Camera] Cannot get canvas context');
      return;
    }

    // Save the current canvas state
    ctx.save();

    // Mirror the image horizontally for front camera (selfie mode)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Draw video frame to canvas (full image, no circular mask)
    // The PhotoCropModal will handle the circular cropping
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Restore the canvas state
    ctx.restore();
    // Convert canvas to blob and create File as PNG
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.png`, {
          type: 'image/png',
        });
        stopCamera();
        onCapture(file);
      } else {
        console.error('[Camera] Failed to create blob');
      }
    }, 'image/png');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden video and canvas - no UI shown */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default CameraCaptureModal;
