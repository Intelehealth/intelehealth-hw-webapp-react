import React from 'react';
import Button from '../../components/common/button.component';

interface ProfileStatusModalProps {
  isOpen: boolean;
  onGoToProfile: () => void;
  profileState: 'not-started' | 'incomplete';
}

const ProfileStatusModal: React.FC<ProfileStatusModalProps> = ({
  isOpen,
  onGoToProfile,
  profileState,
}) => {
  if (!isOpen) return null;

  const isNotStarted = profileState === 'not-started';

  const modalContent = {
    'not-started': {
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
            fill="#2f1e91"
          />
        </svg>
      ),
      message: 'Complete your profile to get started!',
      buttonText: 'Go to profile',
    },
    incomplete: {
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 8V12M12 16H12.01M21.41 16.41L13.41 4.41C12.64 3.64 11.36 3.64 10.59 4.41L2.59 16.41C1.82 17.18 1.82 18.44 2.59 19.21C3.36 19.98 4.62 19.98 5.39 19.21L12 12.59L18.61 19.21C19.38 19.98 20.64 19.98 21.41 19.21C22.18 18.44 22.18 17.18 21.41 16.41Z"
            stroke="#FF5733"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      ),
      message: 'Please complete all required fields to continue.',
      buttonText: 'Go to Profile',
    },
  };

  const content = modalContent[profileState];

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-48">
      <div className="absolute inset-0 bg-[#2e1e91] lg:bg-white/95" />
      <div
        className="relative bg-white rounded-2xl lg:rounded-lg mx-6 border border-gray-200 z-10 overflow-hidden"
        style={{ width: '400px', minHeight: '280px' }}
      >
        <div className="flex items-center justify-center pt-8 pb-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full"
            style={{ backgroundColor: isNotStarted ? '#e1dcff' : '#FFF0ED' }}
          >
            {content.icon}
          </div>
        </div>
        <div className="px-8 pb-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {content.message}
          </h3>
          <div className="flex justify-center">
            <Button onClick={onGoToProfile} variant="primary" size="lg">
              {content.buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileStatusModal;
