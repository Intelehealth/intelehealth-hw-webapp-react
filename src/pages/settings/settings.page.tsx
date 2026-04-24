import React from 'react';
import SettingsLayout from '../../modules/settings/settings-layout.component';

const SettingsPage: React.FC = () => {
  return (
    <div className="h-full w-full bg-white flex flex-col overflow-hidden">
      <SettingsLayout />
    </div>
  );
};

export default SettingsPage;
