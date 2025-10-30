import React from 'react';
import { Toggle } from '../../components/common';

interface ProfileHeaderProps {
  notificationsEnabled: boolean;
  onNotificationsChange: (enabled: boolean) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  notificationsEnabled,
  onNotificationsChange,
}) => {
  return (
    <div className="flex items-center justify-between mb-6 mobile-profile-header">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <button className="p-2">
            <i className="fa-solid fa-arrow-left text-gray-600 text-lg"></i>
          </button>
          <h2 className="text-xl font-bold text-gray-900">My profile</h2>
        </div>
        <button className="p-2">
          <i className="fa-solid fa-sync text-teal-500 text-lg"></i>
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <i className="fa-solid fa-user text-white text-sm"></i>
        </div>
        <h2 className="text-heading-5 text-[--color-dark]">My Profile</h2>
      </div>

      <div className="hidden lg:flex items-center gap-4">
        <div style={{ ['--color-accent' as any]: '#34cc8b' }}>
          <Toggle
            label="Notifications"
            checked={notificationsEnabled}
            onChange={e => onNotificationsChange(e.target.checked)}
            size="md"
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
