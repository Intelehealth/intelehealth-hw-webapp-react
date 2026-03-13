import { Link } from 'react-router-dom';
import iconLocation from '../../assets/icons/icon-location.svg';
import iconSync from '../../assets/icons/icon-sync.svg';
import iconNotification from '../../assets/icons/icon-notification.svg';
import DefaultUserImage from '../../assets/images/default-user-img.svg';
import { useNotificationContext } from '../../context/NotificationContext';
import { useProfileContext } from '../../context/ProfileContext';
import ROUTES from '../../routes/paths';
import { storage } from '../../utils/storage';
import PatientSearch from './patient-search/patient-search.component';

const CountReadNotification = () => {
  const { unreadCount, isEnabled } = useNotificationContext();
  return (
    <Link to={ROUTES.NOTIFICATIONS} className="relative cursor-pointer">
      <img
        src={iconNotification}
        alt="Notification"
        className={`w-6 h-6 ${!isEnabled ? 'opacity-40' : ''}`}
      />
      {isEnabled && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

const Navbar = () => {
  const { profile } = useProfileContext();
  const locationName =
    storage.getLocationName() || profile?.setupLocation || '';

  return (
    <header className="bg-white shadow-md flex flex-col justify-between gap-4 items-center p-4 rounded-lg">
      {/* Desktop */}
      <div className="flex justify-between items-center w-full gap-4">
        <div className="items-center space-x-2 w-4/12 hidden md:flex">
          <PatientSearch />
        </div>
        <div className="flex flex-col w-8/12 md:w-6/12 pl-12 md:pl-4">
          <div className="flex gap-2">
            <img src={iconLocation} alt="Location" className="w-6 h-6" />
            <span className="text-(--color-muted)">{locationName}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-auto gap-4">
          <img src={iconSync} alt="Sync" className="w-6 h-6" />
          <CountReadNotification />
          <Link
            to={ROUTES.PROFILE}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={profile?.avatar || DefaultUserImage}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
              onError={e => {
                e.currentTarget.src = DefaultUserImage;
              }}
            />
          </Link>
        </div>
      </div>

      <div className="w-full md:hidden">
        <PatientSearch />
      </div>
    </header>
  );
};

export default Navbar;
