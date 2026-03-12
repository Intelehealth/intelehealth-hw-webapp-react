import { Outlet, useLocation } from 'react-router-dom';
import DownMenu from '../components/down-menu/down-menu.component';
import Navbar from '../components/navbar/navbar.component';
import SideMenu from '../components/side-menu/side-menu.component';
import { NotificationProvider } from '../context/NotificationContext';
import { ProfileProvider } from '../context/ProfileContext';
import { HIDE_MOBILE_NAV_ROUTES } from './paths';

const MainContainer = () => {
  const location = useLocation();
  const hideNavbarOnMobile = HIDE_MOBILE_NAV_ROUTES.includes(location.pathname);

  return (
    <ProfileProvider>
      <NotificationProvider>
        <div
          className="flex flex-col h-full bg-(--color-maint-bg)"
          data-testid="main-container"
        >
          <SideMenu hideNavbarOnMobile={hideNavbarOnMobile}>
            <div className="flex h-full flex-col">
              <div className="flex flex-col h-full md:p-3 gap-2">
                <div className={hideNavbarOnMobile ? 'hidden md:block' : ''}>
                  <Navbar />
                </div>
                <div
                  className={`flex-1 overflow-auto bg-white ${hideNavbarOnMobile ? 'md:rounded-lg md:shadow-md' : 'rounded-lg shadow-md'}`}
                  id="main-container-content"
                >
                  <Outlet />
                </div>
                <div className={hideNavbarOnMobile ? 'hidden' : 'md:hidden'}>
                  <DownMenu />
                </div>
              </div>
            </div>
          </SideMenu>
        </div>
      </NotificationProvider>
    </ProfileProvider>
  );
};

export default MainContainer;
