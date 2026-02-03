import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  const [error, setError] = useState('');
  const [autoCapture, setAutoCapture] = useState(false);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;

    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // mirror selfie
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      blob => {
        if (!blob) return;

        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        stopCamera();
        onCapture(file);
      },
      'image/jpeg',
      0.95
    );
  }, [stopCamera, onCapture]);

  const startCamera = useCallback(async () => {
    try {
      setError('');

      /* check permission */
      let granted = false;

      try {
        const p = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        granted = p.state === 'granted';
      } catch {
        // ignore (not supported)
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      setStream(mediaStream);
      /* attach to video */
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      /* first time → auto capture */
      if (!granted) {
        setAutoCapture(true);
        setTimeout(capturePhoto, 300);
      }
    } catch (err) {
      setError('Failed to access camera');
      console.error(err);
    }
  }, [capturePhoto]);

  useEffect(() => {
    if (!isOpen) return;

    startCamera();
    document.body.style.overflow = 'hidden';

    return () => {
      stopCamera();
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  /* FIRST TIME (auto capture loader only) */
  if (autoCapture && !error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <p className="text-white">Opening camera...</p>

        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }
  /* NORMAL PREVIEW MODE */
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#2e1e91] lg:bg-white/90 z-50">
      <div className="bg-white rounded-2xl lg:rounded-lg shadow-xl overflow-hidden w-[400px] mx-6">
        {error && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <p className="text-gray-900 text-lg mb-2">Camera Error</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        )}

        {!error && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-[320px] object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />

            <div className="p-4 flex justify-center gap-3">
              <button
                onClick={capturePhoto}
                className="px-6 py-2 bg-[#2e1e91] text-white rounded-lg hover:bg-[#1e1070] transition-colors font-medium"
              >
                Capture
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraCaptureModal;
