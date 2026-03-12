import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Toggle } from '../../components/common';
import { useNotificationContext } from '../../context/NotificationContext';

const ProfileHeader: React.FC = () => {
  const navigate = useNavigate();
  const { isEnabled, toggleNotifications } = useNotificationContext();

  return (
    <div className="flex items-center justify-between mb-2 md:mb-6 bg-white md:bg-inherit border-b md:border-0 border-gray-200 p-2 md:p-0 sticky md:static top-0 z-10 md:z-auto">
      <div className="flex items-center gap-3">
        <button className="p-2 md:hidden" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left text-gray-600 text-lg"></i>
        </button>
        <div
          className="hidden md:flex w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <i className="fa-solid fa-user text-white text-sm"></i>
        </div>
        <h2 className="text-heading-5 text-[--color-dark]">My Profile</h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 md:hidden">
          <i className="fa-solid fa-sync text-teal-500 text-lg"></i>
        </button>
        <div
          className="hidden md:flex"
          style={
            { ['--color-accent' as string]: '#34cc8b' } as React.CSSProperties
          }
        >
          <Toggle
            label="Notifications"
            checked={isEnabled}
            onChange={() => toggleNotifications()}
            size="md"
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
