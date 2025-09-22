import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ROUTES from './paths';
import ProtectedRoute from './protected.route';

// Pages
import ExampleUsage from '../components/common/ExampleUsage';
import DashboardPage from '../pages/dashboard/dashboard';
import LoginPage from '../pages/login/login';
import NotFoundPage from '../pages/not-found/not-found';

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Public routes (ignored) */}
      <Route element={<ProtectedRoute ignoredRoutes={[ROUTES.AUTH.LOGIN]} />}>
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.ROOT} element={<DashboardPage />} />
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
      </Route>

      <Route path={ROUTES.COMMON_UI} element={<ExampleUsage />} />

      {/* 404 fallback */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
