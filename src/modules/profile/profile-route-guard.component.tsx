import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileGuard } from '../../context/ProfileGuardContext';
import ROUTES from '../../routes/paths';
import ProfileStatusModal from './profile-status-modal.component';
import { Loader } from '../../components/common';

// Route Guard Component
interface ProfileRouteGuardProps {
  children: React.ReactNode;
}

const PROFILE_LOADER_ID = 'profile-guard';

const ProfileRouteGuard: React.FC<ProfileRouteGuardProps> = ({ children }) => {
  const { isProfileComplete, profileState } = useProfileGuard();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [hasChecked, setHasChecked] = React.useState(false);

  const handleGoToProfile = () => {
    setIsModalOpen(false);
    navigate(ROUTES.PROFILE);
  };
  React.useEffect(() => {
    if (
      profileState === 'complete' ||
      profileState === 'incomplete' ||
      profileState === 'not-started'
    ) {
      setHasChecked(true);
      setIsModalOpen(!isProfileComplete);
    }
  }, [isProfileComplete, profileState, hasChecked]);

  if (!hasChecked) {
    return (
      <>
        <Loader id={PROFILE_LOADER_ID} />
      </>
    );
  }

  return (
    <>
      {!isProfileComplete && (
        <ProfileStatusModal
          isOpen={isModalOpen}
          onGoToProfile={handleGoToProfile}
          profileState={
            profileState === 'not-started' ? 'not-started' : 'incomplete'
          }
        />
      )}
      {isProfileComplete && children}
    </>
  );
};

export default ProfileRouteGuard;
