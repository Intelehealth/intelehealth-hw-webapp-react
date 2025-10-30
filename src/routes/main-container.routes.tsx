import { Outlet } from 'react-router-dom';
import DownMenu from '../components/down-menu/down-menu.component';
import Navbar from '../components/navbar/navbar.component';
import SideMenu from '../components/side-menu/side-menu.component';

const MainContainer = () => {
  return (
    <div className="flex h-screen w-full bg-(--color-maint-bg)">
      <SideMenu>
        <div className="flex h-full w-full flex-col">
          <div className="flex-1 md:p-3">
            <Navbar />
            <div className="h-screen">
              <Outlet />
            </div>
          </div>
          <div className="md:hidden">
            <DownMenu />
          </div>
        </div>
      </SideMenu>
    </div>
  );
};

export default MainContainer;
