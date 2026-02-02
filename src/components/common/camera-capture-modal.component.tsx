import React, { useEffect, useRef, useState } from 'react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [shouldAutoCapture, setShouldAutoCapture] = useState(false);

  // Initialize camera when modal opens
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

  // Start camera and check permissions
  const startCamera = async () => {
    try {
      console.group('[DEBUG] Camera Start');
      setError('');
      setIsCameraReady(false);

      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error('[DEBUG ERROR]', 'Camera not supported on this device');
        setError('Camera not supported on this device');
        console.groupEnd();
        return;
      }

      // Check if permission was already granted
      let permissionAlreadyGranted = false;
      try {
        const permissionStatus = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        permissionAlreadyGranted = permissionStatus.state === 'granted';
        console.info('[DEBUG]', 'Permission status:', permissionStatus.state);
        console.info(
          '[DEBUG]',
          'Permission already granted:',
          permissionAlreadyGranted
        );
      } catch (err) {
        console.warn(
          '[DEBUG WARN]',
          'Permission API not supported, assuming first time'
        );
        // Permission API not supported, assume first time
      }

      // Request camera access
      console.info('[DEBUG]', 'Requesting camera access');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      console.info('[DEBUG]', 'Camera access granted, stream obtained');

      // Set auto-capture flag for first-time permission
      setShouldAutoCapture(!permissionAlreadyGranted);
      console.info(
        '[DEBUG]',
        'Should auto-capture:',
        !permissionAlreadyGranted
      );
      setStream(mediaStream);

      // Setup video stream
      if (videoRef.current) {
        console.info('[DEBUG]', 'Setting up video stream');
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          console.info('[DEBUG]', 'Video metadata loaded, attempting to play');

          // Add timeout to detect hanging play promise
          const playTimeout = setTimeout(() => {
            console.warn(
              '[DEBUG WARN]',
              'Video play() promise taking longer than 3 seconds'
            );
          }, 3000);
          setTimeout(() => {
            videoRef.current
              ?.play()
              .then(() => {
                clearTimeout(playTimeout);
                console.info('[DEBUG]', 'Video playing successfully');
                setIsCameraReady(true);
                // Auto-capture on first permission
                if (!permissionAlreadyGranted) {
                  console.info('[DEBUG]', 'Scheduling auto-capture in 1000ms');
                  setTimeout(capturePhoto, 1000);
                } else {
                  console.info(
                    '[DEBUG]',
                    'Manual capture mode (permission was already granted)'
                  );
                }
                console.groupEnd();
              })
              .catch(err => {
                clearTimeout(playTimeout);
                console.error('[DEBUG ERROR]', 'Failed to play video:', err);
                console.error('[DEBUG ERROR]', 'Error name:', err?.name);
                console.error('[DEBUG ERROR]', 'Error message:', err?.message);
                setError('Failed to start camera preview');
                console.groupEnd();
              });
          }, 300);
        };
      }
    } catch (err) {
      // Handle errors with user-friendly messages
      if (err instanceof Error) {
        console.error('[DEBUG ERROR]', 'Camera error:', err.name, err.message);
        const errorMap: Record<string, string> = {
          NotAllowedError:
            'Camera permission denied. Please allow camera access.',
          PermissionDeniedError:
            'Camera permission denied. Please allow camera access.',
          NotFoundError: 'No camera found on this device.',
          DevicesNotFoundError: 'No camera found on this device.',
          NotReadableError: 'Camera is already in use by another application.',
          TrackStartError: 'Camera is already in use by another application.',
        };
        setError(
          errorMap[err.name] || 'Failed to access camera. Please try again.'
        );
      }
      console.groupEnd();
    }
  };

  // Stop camera and release resources
  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    console.info('[DEBUG]', 'Capture photo called');
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      console.warn(
        '[DEBUG WARN]',
        'Cannot capture: video or canvas not ready',
        {
          hasVideo: !!video,
          hasCanvas: !!canvas,
          videoWidth: video?.videoWidth,
          videoHeight: video?.videoHeight,
        }
      );
      return;
    }

    console.info('[DEBUG]', 'Capturing photo from video stream', {
      width: video.videoWidth,
      height: video.videoHeight,
    });

    // Setup canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[DEBUG ERROR]', 'Failed to get canvas context');
      return;
    }

    // Mirror image for selfie mode
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    console.info('[DEBUG]', 'Image drawn to canvas');

    // Convert to file and trigger callback
    canvas.toBlob(
      blob => {
        if (blob) {
          console.info('[DEBUG]', 'Blob created, size:', blob.size);
          const file = new File([blob], `camera-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          console.info(
            '[DEBUG]',
            'File created, stopping camera and calling onCapture'
          );
          stopCamera();
          onCapture(file);
        } else {
          console.error('[DEBUG ERROR]', 'Failed to create blob from canvas');
        }
      },
      'image/jpeg',
      0.95
    );
  };

  if (!isOpen) return null;

  // Hide UI during auto-capture (first time)
  if (shouldAutoCapture && !error) {
    return (
      <>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="fixed opacity-0 pointer-events-none"
          style={{ width: '1px', height: '1px' }}
        />
        <canvas ref={canvasRef} className="hidden" />
      </>
    );
  }

  // Show full camera modal for manual capture
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#2e1e91] lg:bg-white/90"
        onClick={onClose}
      />

      <div
        className="relative bg-white rounded-2xl lg:rounded-lg shadow-xl mx-6 border border-gray-200 z-10 overflow-hidden"
        style={{ width: '600px', maxWidth: '90vw' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Take Photo</h3>
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

        {/* Camera Preview */}
        <div className="relative bg-black" style={{ height: '450px' }}>
          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
              <div className="text-center px-6">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-exclamation-triangle text-red-500 text-2xl"></i>
                </div>
                <p className="text-gray-900 text-lg mb-2">Camera Error</p>
                <p className="text-gray-600 text-sm mb-6">{error}</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-[#00897B] text-white rounded-lg hover:bg-[#00796B] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {!isCameraReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-[#00897B] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-900 text-lg">Starting camera...</p>
              </div>
            </div>
          )}

          {/* Video Preview */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Capture Button */}
          {isCameraReady && !error && (
            <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center p-6 bg-gradient-to-t from-black/60 to-transparent">
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 hover:scale-105 active:scale-95 transition-transform shadow-lg flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-400"></div>
              </button>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCaptureModal;
