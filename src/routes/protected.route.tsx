import { Navigate, Outlet } from 'react-router-dom';
import { Loader } from '../components/loader';
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
    return <Outlet />;
  }

  // If no token, redirect to login
  if (!token) {
    return <Navigate to={redirectPath} replace />;
  }

  // Otherwise, allow access
  return (
    <>
      <Loader />
      <Outlet />
    </>
  );
};

export default ProtectedRoute;
