import { Navigate, Outlet } from 'react-router-dom';
import { Loader } from '../components/common';
import { storage } from '../utils/storage';

interface Props {
  redirectPath?: string;
  ignoredRoutes?: string[];
}

const ProtectedRoute: React.FC<Props> = ({
  redirectPath = '/auth/login',
  ignoredRoutes = [],
}) => {
  const token = storage.getAuthToken();
  const currentPath = window.location.pathname;

  // If route is ignored (like login, public pages) -> skip auth check
  if (ignoredRoutes.some(route => currentPath.startsWith(route))) {
    return (
      <div data-testid="protected-route">
        <Outlet />
      </div>
    );
  }

  // If no token, redirect to login
  if (!token) {
    return <Navigate to={redirectPath} replace />;
  }

  // Otherwise, allow access
  return (
    <div data-testid="protected-route">
      <Loader />
      <Outlet />
    </div>
  );
};

export default ProtectedRoute;
