import { Outlet, useLocation } from 'react-router-dom';
import Breadcrumb from '../components/common/breadcrumb.component';
import DownMenu from '../components/down-menu/down-menu.component';
import Navbar from '../components/navbar/navbar.component';
import NotificationManager from '../components/notifications/notification-manager.component';
import SideMenu from '../components/side-menu/side-menu.component';
import {
  BreadcrumbProvider,
  useBreadcrumbContext,
} from '../context/BreadcrumbContext';
import { cn } from '../utils/cn';
import { NotificationProvider } from '../context/NotificationContext';
import { ProfileProvider } from '../context/ProfileContext';
import { HIDE_MOBILE_NAV_ROUTES } from './paths';

const ContentArea = ({
  hideNavbarOnMobile,
}: {
  hideNavbarOnMobile: boolean;
}) => {
  const { bgColor } = useBreadcrumbContext();

  return (
    <div
      className={cn(
        'flex-1 overflow-auto',
        bgColor,
        hideNavbarOnMobile
          ? 'md:rounded-lg md:shadow-md'
          : 'rounded-lg shadow-md'
      )}
      id="main-container-content"
    >
      <Breadcrumb />
      <Outlet />
    </div>
  );
};

const MainContainer = () => {
  const location = useLocation();
  const hideNavbarOnMobile = HIDE_MOBILE_NAV_ROUTES.includes(location.pathname);

  return (
    <ProfileProvider>
      <NotificationProvider>
        <NotificationManager autoRequest={true} requestDelay={300} />
        <div
          className="flex flex-col h-full bg-(--color-maint-bg)"
          data-testid="main-container"
        >
          <SideMenu hideNavbarOnMobile={hideNavbarOnMobile}>
            <BreadcrumbProvider>
              <div className="flex h-full flex-col">
                <div className="flex flex-col h-full md:p-3 gap-2">
                  <div className={hideNavbarOnMobile ? 'hidden md:block' : ''}>
                    <Navbar />
                  </div>
                  <ContentArea hideNavbarOnMobile={hideNavbarOnMobile} />
                  <div className={hideNavbarOnMobile ? 'hidden' : 'md:hidden'}>
                    <DownMenu />
                  </div>
                </div>
              </div>
            </BreadcrumbProvider>
          </SideMenu>
        </div>
      </NotificationProvider>
    </ProfileProvider>
  );
};

export default MainContainer;
