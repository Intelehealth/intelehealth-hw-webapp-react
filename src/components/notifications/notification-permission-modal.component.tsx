import React, { useEffect, useState } from 'react';
import Button from '../common/button.component';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
  isLoading?: boolean;
}

const NotificationPermissionModal: React.FC<
  NotificationPermissionModalProps
> = ({ isOpen, onAllow, onDeny, isLoading = false }) => {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if browser supports notifications
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Show unsupported message if browser doesn't support notifications
  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-[#2e1e91] lg:bg-white/95" />
        <div
          className="relative bg-white rounded-2xl lg:rounded-lg mx-6 border border-gray-200 z-10 overflow-hidden"
          style={{ width: '400px', minHeight: '280px' }}
        >
          <div className="flex items-center justify-center pt-8 pb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12M12 16H12.01M21.41 16.41L13.41 4.41C12.64 3.64 11.36 3.64 10.59 4.41L2.59 16.41C1.82 17.18 1.82 18.44 2.59 19.21C3.36 19.98 4.62 19.98 5.39 19.21L12 12.59L18.61 19.21C19.38 19.98 20.64 19.98 21.41 19.21C22.18 18.44 22.18 17.18 21.41 16.41Z"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>
          <div className="px-8 pb-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Notifications Not Supported
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Your browser does not support push notifications. Please use a
              modern browser like Chrome, Edge, or Firefox.
            </p>
            <div className="flex justify-center">
              <Button onClick={onDeny} variant="secondary" size="lg">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2e1e91] lg:bg-white/95" />
      <div
        className="relative bg-white rounded-2xl lg:rounded-lg mx-6 border border-gray-200 z-10 overflow-hidden"
        style={{ width: '400px', minHeight: '320px' }}
      >
        <div className="flex items-center justify-center pt-8 pb-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M13.73 21a2 2 0 0 1-3.46 0"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
        <div className="px-8 pb-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Enable Notifications
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Stay updated with important alerts and messages. We'll send you
            notifications about new updates and important information.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={onDeny}
              variant="secondary"
              size="lg"
              disabled={isLoading}
            >
              Not Now
            </Button>
            <Button
              onClick={onAllow}
              variant="primary"
              size="lg"
              isLoading={isLoading}
              loadingText="Enabling..."
            >
              Allow Notifications
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionModal;
