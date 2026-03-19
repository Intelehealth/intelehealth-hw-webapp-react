import { Suspense, lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import MainContainer from './main-container.routes';
import ROUTES from './paths';
import ProtectedRoute from './protected.route';

// Simple loading fallback for code-split routes
const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="spinner" />
  </div>
);

// Lazy load pages for code splitting
const CommonUiComponent = lazy(
  () => import('../components/common/common-ui.component')
);
const ForgotPasswordPage = lazy(
  () => import('../pages/auth/forgot-password/forgot-password.page')
);
const ForgotUsernamePage = lazy(
  () => import('../pages/auth/forgot-username/forgot-username.page')
);
const LoginPage = lazy(() => import('../pages/auth/login/login.page'));
const ResetPasswordPage = lazy(
  () => import('../pages/auth/reset-password/reset-password.page')
);
const VerifyOtpPage = lazy(
  () => import('../pages/auth/verify-otp/verify-otp.page')
);
const DashboardPage = lazy(() => import('../pages/dashboard/dashboard.page'));
const PrescriptionsPage = lazy(
  () => import('../pages/prescriptions/prescriptions.page')
);
const OpenVisitsPage = lazy(
  () => import('../pages/open-visits/open-visits.page')
);
const NotFoundPage = lazy(() => import('../pages/not-found/not-found.page'));
const AddPatientPage = lazy(
  () => import('../pages/patient/add/add-patient.page')
);
const PatientProfilePage = lazy(
  () => import('../pages/patient/profile/patient-profile.page')
);
const ProfilePage = lazy(() => import('../pages/profile/profile.page'));

// Profile Guard Components
import { ProfileGuardProvider } from '../context/ProfileGuardContext';
import AppointmentDetails from '../modules/appointment-visit/appointment-details.component';
import MyAppointments from '../modules/appointment-visit/my-appointments.component';
import ProfileRouteGuard from '../modules/profile/profile-route-guard.component';
import VisitSummary from '../modules/visit-summary/visit-summary.component';

const PrescriptionPreviewPage = lazy(
  () => import('../pages/prescriptions/prescription-preview.page')
);
const AyuModule = lazy(() => import('../modules/ayu'));

// appointment module
const AppointmentVisitPage = lazy(
  () => import('../pages/appointment-visit/appointment-visit.page')
);

const AppRoutes = () => (
  <HashRouter>
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Auth routes (ignored) */}
        <Route
          path={ROUTES.AUTH.BASE}
          element={
            <ProtectedRoute ignoredRoutes={[...Object.values(ROUTES.AUTH)]} />
          }
        >
          <Route
            path={ROUTES.AUTH.LOGIN}
            element={
              <Suspense fallback={<RouteLoader />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.AUTH.FORGOT_USERNAME}
            element={
              <Suspense fallback={<RouteLoader />}>
                <ForgotUsernamePage />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.AUTH.FORGOT_PASSWORD}
            element={
              <Suspense fallback={<RouteLoader />}>
                <ForgotPasswordPage />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.AUTH.VERIFY_OTP}
            element={
              <Suspense fallback={<RouteLoader />}>
                <VerifyOtpPage />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.AUTH.RESET_PASSWORD}
            element={
              <Suspense fallback={<RouteLoader />}>
                <ResetPasswordPage />
              </Suspense>
            }
          />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainContainer />}>
            <Route
              path={ROUTES.ROOT}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <ProfileGuardProvider>
                    <ProfileRouteGuard>
                      <AddPatientPage />
                    </ProfileRouteGuard>
                  </ProfileGuardProvider>
                </Suspense>
              }
            />
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.NOTIFICATIONS}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.PRESCRIPTIONS}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <PrescriptionsPage />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.OPEN_VISITS}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <OpenVisitsPage />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.MY_APPOINTMENTS}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <MyAppointments />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.APPOINTMENT_DETAILS}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AppointmentDetails />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.APPOINTMENT_VISIT_SHEDULE}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AppointmentVisitPage />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.PRESCRIPTION_PREVIEW}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <PrescriptionPreviewPage />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.VISIT_SUMMARY}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <VisitSummary />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.PROFILE}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <ProfilePage />
                </Suspense>
              }
            />
            <Route path={ROUTES.PATIENT.BASE}>
              <Route
                path={ROUTES.PATIENT.ADD_PATIENT}
                element={
                  <Suspense fallback={<RouteLoader />}>
                    <ProfileGuardProvider>
                      <ProfileRouteGuard>
                        <AddPatientPage />
                      </ProfileRouteGuard>
                    </ProfileGuardProvider>
                  </Suspense>
                }
              />
              <Route
                path={ROUTES.PATIENT.DETAIL}
                element={
                  <Suspense fallback={<RouteLoader />}>
                    <PatientProfilePage />
                  </Suspense>
                }
              />
            </Route>
            <Route
              path={ROUTES.AYU_WITH_PATIENT}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AyuModule />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.AYU}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AyuModule />
                </Suspense>
              }
            />
          </Route>
        </Route>
        <Route
          path={ROUTES.COMMON_UI}
          element={
            <Suspense fallback={<RouteLoader />}>
              <CommonUiComponent />
            </Suspense>
          }
        />
        {/* 404 fallback */}
        <Route
          path={ROUTES.NOT_FOUND}
          element={
            <Suspense fallback={<RouteLoader />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </Suspense>
  </HashRouter>
);

export default AppRoutes;
