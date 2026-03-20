const ROUTES = {
  ROOT: '/',
  AUTH: {
    BASE: '/auth',
    LOGIN: 'login',
    FORGOT_USERNAME: 'forgot-username',
    FORGOT_PASSWORD: 'forgot-password',
    VERIFY_OTP: 'verify-otp',
    RESET_PASSWORD: 'reset-password',
  },
  DASHBOARD: '/dashboard',
  PRESCRIPTIONS: '/prescriptions',
  OPEN_VISITS: '/open-visits',
  PROFILE: '/profile',
  ADD_PATIENT: '/add-patient',
  COMMON_UI: '/common-ui',
  TEST_PROFILE_GUARD: '/test-profile-guard',
  MY_APPOINTMENTS: '/my-appointments',
  APPOINTMENT_VISIT_SHEDULE: '/appointment-schedule',
  APPOINTMENT_DETAILS: '/my-appointments/:id',
  NOTIFICATIONS: '/notifications',
  PRESCRIPTION_PREVIEW: '/prescription-preview',
  VISIT_SUMMARY: '/visit-summary',
  VISIT_DETAILS: '/visit-details/:visitId',
  PRESCRIPTION_DETAIL: '/prescription-detail/:visitId',
  NOT_FOUND: '*', // catch-all
  PATIENT: {
    BASE: '/patient',
    ADD_PATIENT: 'add',
    DETAIL: ':uuid',
  },
  AYU: '/ayu/*',
};

/* Routes where mobile nav (top navbar, bottom menu) should be hidden */
export const HIDE_MOBILE_NAV_ROUTES: string[] = [ROUTES.PROFILE];

export default ROUTES;
