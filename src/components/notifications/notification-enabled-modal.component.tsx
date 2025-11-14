import React, { useEffect } from 'react';
import Button from '../common/button.component';

interface NotificationEnabledModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationEnabledModal: React.FC<NotificationEnabledModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2e1e91] lg:bg-white/95" />
      <div
        className="relative bg-white rounded-2xl lg:rounded-lg mx-6 border border-gray-200 z-10 overflow-hidden shadow-lg"
        style={{ width: '400px', minHeight: '280px' }}
      >
        <div className="flex items-center justify-center pt-8 pb-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17l-5-5"
                stroke="#10B981"
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
            Notifications Enabled!
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            You'll now receive important updates and alerts directly in your
            browser.
          </p>
          <div className="flex justify-center">
            <Button onClick={onClose} variant="primary" size="lg">
              Got it
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationEnabledModal;
