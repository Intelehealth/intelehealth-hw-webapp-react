import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileGuard } from '../../context/ProfileGuardContext';
import ROUTES from '../../routes/paths';
import ProfileStatusModal from './profile-status-modal.component';

// Route Guard Component
interface ProfileRouteGuardProps {
  children: React.ReactNode;
}

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
    // Only proceed once we have a non-loading profile state
    if (profileState !== 'loading' && !hasChecked) {
      setHasChecked(true);
      setIsModalOpen(!isProfileComplete);
    }
  }, [isProfileComplete, profileState, hasChecked]);

  // Don't render anything while loading
  if (profileState === 'loading' || !hasChecked) {
    return null;
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
