import { Link, useLocation } from 'react-router-dom';
import iconAchievements from '../../assets/icons/icon-achievement.svg';
import iconHome from '../../assets/icons/icon-home.svg';
import iconInfo from '../../assets/icons/icon-info.svg';
import iconPatientPlus from '../../assets/icons/icon-user-plus.svg';
import ROUTES from '../../routes/paths';

const menuItems = [
  { label: 'Dashboard', icon: iconHome, path: ROUTES.DASHBOARD },
  {
    label: 'Achievements',
    icon: iconAchievements,
    path: ROUTES.ACHIEVEMENT_UI,
  },
  { label: 'Help & Support', icon: iconInfo, path: ROUTES.HELP },
  { label: 'Add Patient', icon: iconPatientPlus, path: ROUTES.ADD_PATIENT },
];

const DownMenu = () => {
  const location = useLocation();

  return (
    <div className=" flex justify-around p-3 shodow rounded-t-lg bg-white">
      {menuItems.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            to={item.path}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg min-h-[50px] ${
              isActive ? '' : ''
            }`}
            key={item.label}
          >
            <img
              src={item.icon}
              alt={item.label}
              className="w-6 h-6 text-black"
              style={{
                filter: isActive
                  ? 'invert(12%) sepia(81%) saturate(4258%) hue-rotate(249deg) brightness(78%) contrast(99%)'
                  : 'filter: invert(73%) sepia(15%) saturate(204%) hue-rotate(210deg) brightness(93%) contrast(92%)',
              }}
            />
            <span
              className={`text-(--color-muted) ${isActive ? 'text-(--color-primary)' : ''}`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default DownMenu;
