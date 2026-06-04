import React from 'react';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import SettingsLayout from '../../modules/settings/settings-layout.component';
import ROUTES from '../../routes/paths';

const SettingsPage: React.FC = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Settings' },
  ]);

  return (
    <div className="h-full w-full bg-white flex flex-col overflow-hidden">
      <SettingsLayout />
    </div>
  );
};

export default SettingsPage;
