import { Outlet } from 'react-router-dom';
import DownMenu from '../components/down-menu/down-menu.component';
import Navbar from '../components/navbar/navbar.component';
import SideMenu from '../components/side-menu/side-menu.component';

const MainContainer = () => {
  return (
    <div
      className="flex flex-col h-full bg-(--color-maint-bg)"
      data-testid="main-container"
    >
      <SideMenu>
        <div className="flex h-full flex-col">
          <div className="flex flex-col md:p-3 gap-2 h-full">
            <Navbar />
            <div className="flex-1 bg-white rounded-lg shadow-md overflow-auto">
              <Outlet />
            </div>
            <div className="md:hidden">
              <DownMenu />
            </div>
          </div>
        </div>
      </SideMenu>
    </div>
  );
};

export default MainContainer;
