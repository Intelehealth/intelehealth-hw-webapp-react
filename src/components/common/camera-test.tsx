import React, { useState } from 'react';
import CameraCaptureModal from './camera-capture-modal.component';
import Button from './button.component';

/**
 * Test component for camera functionality
 * Add this to your app temporarily to test camera
 */
const CameraTest: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const handleCapture = (file: File) => {
    setCapturedFile(file);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Camera Test</h1>

      <div className="mb-4">
        <p>
          <strong>Current URL:</strong> {window.location.href}
        </p>
        <p>
          <strong>Protocol:</strong> {window.location.protocol}
        </p>
        <p>
          <strong>Is Secure Context:</strong>{' '}
          {window.isSecureContext ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>getUserMedia Available:</strong>{' '}
          {typeof navigator.mediaDevices?.getUserMedia === 'function'
            ? 'Yes'
            : 'No'}
        </p>
      </div>

      <Button onClick={() => setIsOpen(true)} variant="primary">
        Open Camera Modal
      </Button>

      {capturedFile && (
        <div className="mt-4">
          <p className="font-semibold">Captured File:</p>
          <p>Name: {capturedFile.name}</p>
          <p>Size: {capturedFile.size} bytes</p>
          <p>Type: {capturedFile.type}</p>
          <img
            src={URL.createObjectURL(capturedFile)}
            alt="Captured"
            className="mt-2 max-w-xs"
          />
        </div>
      )}

      <CameraCaptureModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
};

export default CameraTest;
