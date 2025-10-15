import React, { useEffect, useRef, useState } from 'react';
import iconAbout from '../../assets/icons/icon-about.svg';
import iconAchievements from '../../assets/icons/icon-achievement.svg';
import iconHome from '../../assets/icons/icon-home.svg';
import iconInfo from '../../assets/icons/icon-info.svg';
import iconPowerOff from '../../assets/icons/icon-power-off.svg';
import iconSettings from '../../assets/icons/icon-settings.svg';
import iconVideos from '../../assets/icons/icon-videos.svg';
import mainLogo from '../../assets/logo/intelehealth-logo-white.png';
import thumbnailLogo from '../../assets/logo/intelehealth-thumbnail-logo-white.png';

const menuItems = [
  { label: 'Dashboard', icon: iconHome },
  { label: 'Achievements', icon: iconAchievements },
  { label: 'Help & Support', icon: iconInfo },
  { label: 'Educational Videos', icon: iconVideos },
  { label: 'Settings', icon: iconSettings },
  { label: 'About us', icon: iconAbout },
];

interface SideMenuProps {
  children?: React.ReactNode;
}

const SideMenu: React.FC<SideMenuProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

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
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Toggle Button */}
      {!isMobileOpen && (
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
        className={`fixed md:static top-0 left-0 h-full bg-(--color-main-bg) shadow-lg transform transition-all duration-300 z-50 p-2
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-25' : 'md:w-64'}`}
      >
        <div className="flex flex-col rounded-lg h-full bg-(--color-primary) p-2">
          {/* Arrow Toggle Button (Desktop + Mobile) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-13 right-0 bg-white border border-(--color-primary) shadow rounded-full w-6 h-6 flex items-center justify-center z-50 hover:bg-gray-100 transition"
          >
            <i
              className={`fa-solid text-(--color-primary) text-sm ${
                isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'
              }`}
            ></i>
          </button>

          {/* Header */}
          <div className="flex items-center p-4">
            {isCollapsed ? (
              <img
                src={thumbnailLogo}
                alt="hero"
                className="h-[74px] object-contain"
              />
            ) : (
              <img
                src={mainLogo}
                alt="hero"
                className="h-[74px] object-contain"
              />
            )}
          </div>

          {/* Menu Items */}
          <nav className="p-3 space-y-2">
            {menuItems.map(item => (
              <a
                key={item.label}
                href="#"
                className={`flex items-center gap-3 rounded-lg hover:bg-(--color-primary-dark) transition ${
                  isCollapsed ? 'justify-center py-4 px-0' : 'p-4'
                }`}
              >
                <img src={item.icon} alt={item.label} className="w-6 h-6" />
                {!isCollapsed && (
                  <span className="text-white">{item.label}</span>
                )}
              </a>
            ))}
          </nav>

          {/* DownMenu Items */}
          <nav className="p-3 space-y-2 mt-auto">
            <a
              href="#"
              className={`flex items-center gap-3 rounded-lg hover:bg-(--color-primary-dark) transition ${
                isCollapsed ? 'justify-center py-4 px-0' : 'p-4'
              }`}
            >
              <img src={iconPowerOff} className="w-6 h-6" />
              {!isCollapsed && <span className="text-white">Logout</span>}
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300`}>{children}</main>
    </div>
  );
};

export default SideMenu;
