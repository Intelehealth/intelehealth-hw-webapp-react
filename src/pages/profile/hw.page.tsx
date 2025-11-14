import React from 'react';
import ProfileForm from '../../modules/profile/profile-form.component';

const HwPage: React.FC = () => {
  return (
    <div className="h-screen w-full bg-white">
      <div className="w-full mt-4">
        <ProfileForm />
      </div>
    </div>
  );
};

export default HwPage;
