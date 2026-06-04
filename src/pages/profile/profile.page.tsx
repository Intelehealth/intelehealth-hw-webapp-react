import React from 'react';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import ProfileForm from '../../modules/profile/profile-form.component';
import ROUTES from '../../routes/paths';

const ProfilePage: React.FC = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Profile' },
  ]);

  return (
    <div className="h-screen w-full bg-white">
      <div className="w-full mt-4">
        <ProfileForm />
      </div>
    </div>
  );
};

export default ProfilePage;
