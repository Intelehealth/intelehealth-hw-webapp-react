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
  const { isProfileComplete, loading, profileState } = useProfileGuard();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleGoToProfile = () => {
    setIsModalOpen(false);
    navigate(ROUTES.PROFILE);
  };

  // Show modal when profile is incomplete and not loading
  React.useEffect(() => {
    if (!loading && !isProfileComplete) {
      setIsModalOpen(true);
    } else if (isProfileComplete) {
      // Close modal when profile becomes complete
      setIsModalOpen(false);
    }
  }, [isProfileComplete, loading]);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!isProfileComplete) {
    return (
      <>
        {/* Show the modal verlay */}
        {isModalOpen && (
          <ProfileStatusModal
            isOpen={isModalOpen}
            onGoToProfile={handleGoToProfile}
            profileState={
              profileState === 'not-started' ? 'not-started' : 'incomplete'
            }
          />
        )}
        {/* Don't render children when profile is incomplete */}
      </>
    );
  }

  // Profile is complete, render children (AddPatientPage)
  return <>{children}</>;
};

export default ProfileRouteGuard;
