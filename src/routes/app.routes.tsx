import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainContainer from './main-container.routes';
import ROUTES from './paths';
import ProtectedRoute from './protected.route';

// Pages
import CommonUiComponent from '../components/common/common-ui.component';
import { ProfileGuardProvider } from '../context/ProfileGuardContext';
import ProfileRouteGuard from '../modules/profile/profile-route-guard.component';
import AddPatientPage from '../pages/add-patient/add-patient.page';
import ForgotPasswordPage from '../pages/auth/forgot-password/forgot-password.page';
import ForgotUsernamePage from '../pages/auth/forgot-username/forgot-username.page';
import LoginPage from '../pages/auth/login/login.page';
import ResetPasswordPage from '../pages/auth/reset-password/reset-password.page';
import VerifyOtpPage from '../pages/auth/verify-otp/verify-otp.page';
import DashboardPage from '../pages/dashboard/dashboard.page';
import NotFoundPage from '../pages/not-found/not-found.page';
import HwPage from '../pages/profile/hw.page';

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Auth routes (ignored) */}
      <Route
        path={ROUTES.AUTH.BASE}
        element={
          <ProtectedRoute ignoredRoutes={[...Object.values(ROUTES.AUTH)]} />
        }
      >
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
        <Route
          path={ROUTES.AUTH.FORGOT_USERNAME}
          element={<ForgotUsernamePage />}
        />
        <Route
          path={ROUTES.AUTH.FORGOT_PASSWORD}
          element={<ForgotPasswordPage />}
        />
        <Route path={ROUTES.AUTH.VERIFY_OTP} element={<VerifyOtpPage />} />
        <Route
          path={ROUTES.AUTH.RESET_PASSWORD}
          element={<ResetPasswordPage />}
        />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainContainer />}>
          <Route path={ROUTES.ROOT} element={<DashboardPage />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROFILE} element={<HwPage />} />
          <Route
            path={ROUTES.ADD_PATIENT}
            element={
              <ProfileGuardProvider>
                <ProfileRouteGuard>
                  <AddPatientPage />
                </ProfileRouteGuard>
              </ProfileGuardProvider>
            }
          />
        </Route>
      </Route>
      <Route path={ROUTES.COMMON_UI} element={<CommonUiComponent />} />

      {/* 404 fallback */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
