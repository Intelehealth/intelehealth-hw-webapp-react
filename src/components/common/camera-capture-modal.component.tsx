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

        // Force the video to start loading
        console.info('[DEBUG]', 'Calling video.load() to force initialization');
        videoRef.current.load();

        // Add additional event listeners for debugging
        videoRef.current.onloadstart = () => {
          console.info('[DEBUG]', 'Video loadstart event fired');
        };

        videoRef.current.onloadeddata = () => {
          console.info(
            '[DEBUG]',
            'Video loadeddata event fired, readyState:',
            videoRef.current?.readyState
          );
        };

        videoRef.current.oncanplay = () => {
          console.info(
            '[DEBUG]',
            'Video canplay event fired, readyState:',
            videoRef.current?.readyState
          );
        };

        videoRef.current.oncanplaythrough = () => {
          console.info(
            '[DEBUG]',
            'Video canplaythrough event fired, readyState:',
            videoRef.current?.readyState
          );
        };

        videoRef.current.onloadedmetadata = async () => {
          console.info('[DEBUG]', 'Video metadata loaded, attempting to play');
          console.info(
            '[DEBUG]',
            'Video readyState at metadata:',
            videoRef.current?.readyState
          );

          // CRITICAL FIX: Add a small delay before calling play()
          // This allows the video element to fully initialize
          console.info('[DEBUG]', 'Waiting 100ms before calling play()...');
          await new Promise(resolve => setTimeout(resolve, 100));
          console.info('[DEBUG]', 'Delay complete, now calling play()');

          if (!videoRef.current) {
            console.error(
              '[DEBUG ERROR]',
              'videoRef.current is null after delay'
            );
            console.groupEnd();
            return;
          }

          // Try to play with enhanced error handling and timeout
          console.info('[DEBUG]', 'Calling video.play()...');

          const playPromise = videoRef.current.play();

          if (!playPromise) {
            console.error('[DEBUG ERROR]', 'play() returned undefined/null');
            setError('Failed to start camera preview (play returned null)');
            console.groupEnd();
            return;
          }

          // Create a timeout promise that rejects after 5 seconds
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              console.error('[DEBUG ERROR]', 'play() promise timeout after 5s');
              reject(new Error('Video play timeout'));
            }, 5000);
          });

          Promise.race([playPromise, timeoutPromise])
            .then(async () => {
              console.info(
                '[DEBUG]',
                'Video play() promise resolved, readyState:',
                videoRef.current?.readyState
              );
              console.info(
                '[DEBUG]',
                'Video play() started, waiting for frames...'
              );

              // Wait for actual video frames to be available
              await waitForVideoReady(videoRef.current!);

              console.info(
                '[DEBUG]',
                'Video frames available, ready to capture'
              );
              console.info(
                '[DEBUG]',
                'Final readyState:',
                videoRef.current?.readyState
              );
              setIsCameraReady(true);

              // Auto-capture on first permission
              if (!permissionAlreadyGranted) {
                console.info('[DEBUG]', 'Scheduling auto-capture in 300ms');
                setTimeout(capturePhoto, 300);
              } else {
                console.info(
                  '[DEBUG]',
                  'Manual capture mode (permission was already granted)'
                );
              }
              console.groupEnd();
            })
            .catch(err => {
              console.error(
                '[DEBUG ERROR]',
                'Failed to play video or timeout:',
                err
              );
              console.error('[DEBUG ERROR]', 'Error name:', err?.name);
              console.error('[DEBUG ERROR]', 'Error message:', err?.message);
              console.error(
                '[DEBUG ERROR]',
                'Video readyState:',
                videoRef.current?.readyState
              );
              console.error(
                '[DEBUG ERROR]',
                'Video paused:',
                videoRef.current?.paused
              );
              console.error(
                '[DEBUG ERROR]',
                'Video error:',
                videoRef.current?.error
              );

              // Try to recover by manually proceeding if video seems ready
              if (videoRef.current && videoRef.current.readyState >= 2) {
                console.warn(
                  '[DEBUG WARN]',
                  'Attempting recovery: video readyState is acceptable, proceeding anyway'
                );
                waitForVideoReady(videoRef.current)
                  .then(() => {
                    console.info('[DEBUG]', 'Recovery successful, video ready');
                    setIsCameraReady(true);
                    if (!permissionAlreadyGranted) {
                      setTimeout(capturePhoto, 300);
                    }
                    console.groupEnd();
                  })
                  .catch(recoveryErr => {
                    console.error(
                      '[DEBUG ERROR]',
                      'Recovery failed:',
                      recoveryErr
                    );
                    setError('Failed to start camera preview');
                    console.groupEnd();
                  });
              } else {
                setError('Failed to start camera preview');
                console.groupEnd();
              }
            });
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

  // Wait for video to have enough data to play
  const waitForVideoReady = (video: HTMLVideoElement) =>
    new Promise<void>(resolve => {
      console.info(
        '[DEBUG]',
        'waitForVideoReady called, readyState:',
        video.readyState
      );

      if (video.readyState >= 3) {
        console.info('[DEBUG]', 'Video already ready (readyState >= 3)');
        resolve();
        return;
      }

      const check = () => {
        console.info('[DEBUG]', 'Checking readyState:', video.readyState);
        if (video.readyState >= 3) {
          console.info('[DEBUG]', 'Video ready, removing listeners');
          video.removeEventListener('playing', check);
          video.removeEventListener('canplay', check);
          video.removeEventListener('canplaythrough', check);
          video.removeEventListener('loadeddata', check);
          resolve();
        }
      };

      // Listen to multiple events to catch when video is ready
      // This ensures we don't miss the event if it already fired
      console.info(
        '[DEBUG]',
        'Adding multiple event listeners for video ready state'
      );
      video.addEventListener('playing', check);
      video.addEventListener('canplay', check);
      video.addEventListener('canplaythrough', check);
      video.addEventListener('loadeddata', check);

      // Fallback: check periodically in case events don't fire
      const intervalId = setInterval(() => {
        console.info(
          '[DEBUG]',
          'Interval check, readyState:',
          video.readyState
        );
        if (video.readyState >= 3) {
          console.info('[DEBUG]', 'Video ready via interval check');
          clearInterval(intervalId);
          video.removeEventListener('playing', check);
          video.removeEventListener('canplay', check);
          video.removeEventListener('canplaythrough', check);
          video.removeEventListener('loadeddata', check);
          resolve();
        }
      }, 100);

      // Safety timeout: resolve after 5 seconds regardless
      setTimeout(() => {
        console.warn(
          '[DEBUG WARN]',
          'Video ready timeout after 5s, readyState:',
          video.readyState
        );
        clearInterval(intervalId);
        video.removeEventListener('playing', check);
        video.removeEventListener('canplay', check);
        video.removeEventListener('canplaythrough', check);
        video.removeEventListener('loadeddata', check);
        resolve();
      }, 5000);
    });

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

  // Show minimal loading UI during auto-capture (first time)
  if (shouldAutoCapture && !error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-[#2e1e91] rounded-full animate-spin"></div>
          <p className="text-gray-900 text-lg">Processing camera...</p>
        </div>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="fixed opacity-0 pointer-events-none"
          style={{ width: '1px', height: '1px' }}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
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
                <div className="w-16 h-16 border-4 border-gray-300 border-t-[#2e1e91] rounded-full animate-spin mx-auto mb-4"></div>
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
