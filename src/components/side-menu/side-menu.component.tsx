import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import iconAbout from '../../assets/icons/icon-about.svg';
import iconAchievements from '../../assets/icons/icon-achievement.svg';
import iconHome from '../../assets/icons/icon-home.svg';
import iconInfo from '../../assets/icons/icon-info.svg';
import iconPowerOff from '../../assets/icons/icon-power-off.svg';
import iconSettings from '../../assets/icons/icon-settings.svg';
import iconVideos from '../../assets/icons/icon-videos.svg';
import mainLogo from '../../assets/logo/intelehealth-logo-white.png';
import thumbnailLogo from '../../assets/logo/intelehealth-thumbnail-logo-white.png';
import ROUTES from '../../routes/paths';
import { cookie } from '../../utils/cookie';
import { storage } from '../../utils/storage';

const menuItems = [
  { label: 'Home', icon: iconHome, path: ROUTES.DASHBOARD },
  {
    label: 'Achievements',
    icon: iconAchievements,
    path: ROUTES.ACHIEVEMENT_UI,
  },
  { label: 'Help & Support', icon: iconInfo, path: ROUTES.HELP },
  { label: 'Educational Videos', icon: iconVideos, path: '#' },
  { label: 'Settings', icon: iconSettings, path: ROUTES.SETTINGS },
  { label: 'About us', icon: iconAbout, path: ROUTES.ABOUT_US },
];

interface SideMenuProps {
  children?: React.ReactNode;
  hideNavbarOnMobile?: boolean;
}

const SideMenu: React.FC<SideMenuProps> = ({
  children,
  hideNavbarOnMobile,
}) => {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const innerDivRef = useRef<HTMLDivElement>(null);

  // Set responsive height for sidebar inner div
  useEffect(() => {
    const updateHeight = () => {
      if (innerDivRef.current) {
        if (window.innerWidth >= 768) {
          innerDivRef.current.style.height = 'calc(100vh - 1.5rem)';
          innerDivRef.current.style.maxHeight = 'calc(100vh - 1.5rem)';
        } else {
          innerDivRef.current.style.height = 'calc(100vh - 1rem)';
          innerDivRef.current.style.maxHeight = 'calc(100vh - 1rem)';
        }
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Close on outside click (only for mobile)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        window.innerWidth < 768
      ) {
        setIsMobileOpen(false);
      }
    };
    if (isMobileOpen)
      document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen]);

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Mobile Toggle Button */}
      {!isMobileOpen && !hideNavbarOnMobile && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center"
        >
          <i className="fa-solid fa-bars text-gray-700 text-[30px] pt-2"></i>
        </button>
      )}

      {/* Overlay for Mobile */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden"></div>
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen bg-transparent z-50 transition-all duration-300 ease-in-out overflow-visible
  ${isCollapsed ? 'w-20 md:w-24' : 'w-64'}
  ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Arrow Toggle Button - positioned near Add Patient button, overlapping edge - on aside to avoid clipping */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute top-20 md:top-28 right-0 translate-x-1/2 bg-white   shadow-md rounded-full w-7 h-7 items-center justify-center z-50 hover:bg-gray-100 transition-all duration-300"
        >
          <i
            className={`fa-solid text-(--color-primary) text-sm ${
              isCollapsed ? 'fa-chevron-left' : 'fa-chevron-right'
            }`}
          ></i>
        </button>

        <div
          ref={innerDivRef}
          className="flex flex-col rounded-lg bg-(--color-primary) p-2 md:p-3 my-2 md:my-3 ml-2 md:ml-3 relative shadow-lg overflow-hidden"
        >
          {/* Close Button for Mobile */}
          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden absolute top-4 right-4 text-white z-50 w-8 h-8 flex items-center justify-center"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          )}

          {/* Header */}
          <div className="flex items-center p-3 md:p-4 flex-shrink-0 pt-4 md:pt-6">
            {isCollapsed ? (
              <img
                src={thumbnailLogo}
                alt="hero"
                className="h-12 md:h-[74px] object-contain mx-auto"
              />
            ) : (
              <img
                src={mainLogo}
                alt="hero"
                className="h-12 md:h-[74px] object-contain"
              />
            )}
          </div>

          {/* Add Patients Button */}
          <div className="px-1 mt-2 md:mt-3 mb-3 md:mb-4 flex-shrink-0">
            <Link
              to="/patient/add"
              onClick={() => setIsMobileOpen(false)}
              className={`w-full flex items-center ${
                isCollapsed
                  ? 'justify-center p-2'
                  : 'bg-white rounded-lg px-3 py-2 md:px-4 md:py-2 justify-between shadow-md hover:shadow-lg transition-shadow'
              }`}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div
                  className={`rounded-full flex items-center justify-center ${
                    isCollapsed
                      ? 'w-8 h-8 md:w-10 md:h-10'
                      : 'w-7 h-7 md:w-8 md:h-8'
                  }`}
                  style={{ backgroundColor: '#2e1e91' }}
                >
                  <i
                    className={`fa-solid fa-user-plus text-white ${
                      isCollapsed
                        ? 'text-sm md:text-base'
                        : 'text-xs md:text-sm'
                    }`}
                  ></i>
                </div>
                {!isCollapsed && (
                  <span
                    className="font-medium text-xs md:text-sm"
                    style={{ color: '#2e1e91' }}
                  >
                    Add Patients
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div
                  className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#e1dcff' }}
                >
                  <i
                    className="fa-solid fa-chevron-right text-xs"
                    style={{ color: '#2e1e91' }}
                  ></i>
                </div>
              )}
            </Link>
          </div>
          {/* Menu Items */}
          <nav className="flex-1 space-y-1 md:space-y-2 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-hidden">
              {menuItems.map(item => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-2 md:gap-3 rounded-lg hover:bg-(--color-primary-dark) transition ${
                    isCollapsed
                      ? 'justify-center py-3 px-0 md:py-4'
                      : 'p-3 md:p-4'
                  }`}
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0"
                  />
                  {!isCollapsed && (
                    <span className="text-white text-base md:text-lg whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </nav>

          {/* Logout Section with Top Border */}
          <div className="border-t border-gray-300/20 mt-auto">
            <nav>
              <a
                onClick={() => {
                  setIsMobileOpen(false);
                  storage.clearAuthToken();
                  storage.clearBasicAuthHeader();
                  cookie.removeJSessionId();
                  navigate('/auth/login');
                }}
                className={`flex items-center gap-2 md:gap-3 rounded-lg hover:bg-(--color-primary-dark) transition cursor-pointer ${
                  isCollapsed
                    ? 'justify-center py-3 px-0 md:py-4'
                    : 'p-3 md:p-4'
                }`}
              >
                <img
                  src={iconPowerOff}
                  className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0"
                />
                {!isCollapsed && (
                  <span className="text-white text-base md:text-lg">
                    Log-out
                  </span>
                )}
              </a>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:ml-24 ml-0' : 'md:ml-64 ml-0'
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default SideMenu;
