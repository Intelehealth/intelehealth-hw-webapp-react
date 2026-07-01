import { Suspense, lazy } from 'react';
import {
  Route,
  RouterProvider,
  createHashRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import MainContainer from './main-container.routes';
import ROUTES from './paths';
import ProtectedRoute from './protected.route';

const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="spinner" />
  </div>
);

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
const VideoCallPage = lazy(() => import('../pages/video-call/video-call.page'));
const PrescriptionsPage = lazy(
  () => import('../pages/prescriptions/prescriptions.page')
);
const OpenVisitsPage = lazy(
  () => import('../pages/open-visits/open-visits.page')
);
const AppointmentListPage = lazy(
  () => import('../pages/appointment-list/appointment-list.page')
);
const NotFoundPage = lazy(() => import('../pages/not-found/not-found.page'));
const FollowupVisitsPage = lazy(
  () => import('../pages/followup-visits/followup-visits.page')
);
const AddPatientPage = lazy(
  () => import('../pages/patient/add/add-patient.page')
);
const PatientProfilePage = lazy(
  () => import('../pages/patient/profile/patient-profile.page')
);
const ProfilePage = lazy(() => import('../pages/profile/profile.page'));
const SettingsPage = lazy(() => import('../pages/settings/settings.page'));
const EducationalVideosPage = lazy(
  () => import('../pages/educational-videos/educational-videos.page')
);

import { ProfileGuardProvider } from '../context/ProfileGuardContext';
import AppointmentDetails from '../modules/appointment-visit/appointment-details.component';
import MyAppointments from '../modules/appointment-visit/my-appointments.component';
import PrescriptionDetail from '../modules/prescription-detail/prescription-detail.component';
import ProfileRouteGuard from '../modules/profile/profile-route-guard.component';
import VisitDetails from '../modules/visit-details/visit-details.component';
import VisitSummary from '../modules/visit-summary/visit-summary.component';

const PrescriptionPreviewPage = lazy(
  () => import('../pages/prescriptions/prescription-preview.page')
);
const AchievementUiPage = lazy(
  () => import('../pages/achievement-ui/achievement-ui.page')
);
const AyuModule = lazy(() => import('../modules/ayu'));

const AppointmentVisitPage = lazy(
  () => import('../pages/appointment-visit/appointment-visit.page')
);

const HelpAndSupportPage = lazy(
  () => import('../pages/help-and-support/help-and-support.page')
);

const HelpVideoPage = lazy(
  () => import('../pages/help-and-support/help-video.page')
);
const HelpFaqPage = lazy(
  () => import('../pages/help-and-support/help-faq.page')
);

const AboutUsPage = lazy(() => import('../pages/about-us/about-us.page'));

const router = createHashRouter(
  createRoutesFromElements(
    <>
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
            path={ROUTES.VIDEO_CALL}
            element={
              <Suspense fallback={<RouteLoader />}>
                <VideoCallPage />
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
            path={ROUTES.FOLLOWUP_VISITS}
            element={
              <Suspense fallback={<RouteLoader />}>
                <FollowupVisitsPage />
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
            path={ROUTES.APPOINTMENT_LIST}
            element={
              <Suspense fallback={<RouteLoader />}>
                <AppointmentListPage />
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
            path={ROUTES.VISIT_DETAILS}
            element={
              <Suspense fallback={<RouteLoader />}>
                <VisitDetails />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.PRESCRIPTION_DETAIL}
            element={
              <Suspense fallback={<RouteLoader />}>
                <PrescriptionDetail />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.PROFILE}
            element={
              <Suspense fallback={<RouteLoader />}>
                <ProfileGuardProvider>
                  <ProfilePage />
                </ProfileGuardProvider>
              </Suspense>
            }
          />
          <Route
            path={ROUTES.SETTINGS}
            element={
              <Suspense fallback={<RouteLoader />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.EDUCATIONAL_VIDEOS}
            element={
              <Suspense fallback={<RouteLoader />}>
                <EducationalVideosPage />
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
              path={ROUTES.PATIENT.EDIT_PATIENT}
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AddPatientPage />
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
          <Route
            path={ROUTES.ACHIEVEMENT_UI}
            element={
              <Suspense fallback={<RouteLoader />}>
                <AchievementUiPage />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.HELP}
            element={
              <Suspense fallback={<RouteLoader />}>
                <HelpAndSupportPage />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.HELP_VIDEOS}
            element={
              <Suspense fallback={<RouteLoader />}>
                <HelpVideoPage />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.HELP_FAQ}
            element={
              <Suspense fallback={<RouteLoader />}>
                <HelpFaqPage />
              </Suspense>
            }
          />
          <Route
            path={ROUTES.ABOUT_US}
            element={
              <Suspense fallback={<RouteLoader />}>
                <AboutUsPage />
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

      <Route
        path={ROUTES.NOT_FOUND}
        element={
          <Suspense fallback={<RouteLoader />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </>
  )
);

const AppRoutes = () => <RouterProvider router={router} />;

export default AppRoutes;
