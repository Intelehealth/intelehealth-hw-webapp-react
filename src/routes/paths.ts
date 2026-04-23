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
  FOLLOWUP_VISITS: '/followup-visits',
  ADD_PATIENT: '/add-patient',
  COMMON_UI: '/common-ui',
  TEST_PROFILE_GUARD: '/test-profile-guard',
  MY_APPOINTMENTS: '/my-appointments',
  APPOINTMENT_VISIT_SHEDULE: '/appointment-schedule/:visitUuid?',
  APPOINTMENT_DETAILS: '/my-appointments/:id',
  NOTIFICATIONS: '/notifications',
  PRESCRIPTION_PREVIEW: '/prescription-preview',
  VISIT_SUMMARY: '/visit-summary/:visitId?',
  VISIT_DETAILS: '/visit-details/:visitId',
  ACHIEVEMENT_UI: '/achievement-ui',
  ABOUT_US: '/about-us',
  HELP: '/help',
  HELP_VIDEOS: '/help/videos',
  HELP_FAQ: '/help/faq',
  PRESCRIPTION_DETAIL: '/prescription-detail/:visitId',
  NOT_FOUND: '*', // catch-all
  PATIENT: {
    BASE: '/patient',
    ADD_PATIENT: 'add',
    DETAIL: ':uuid',
  },
  AYU: '/ayu/*',
  AYU_WITH_PATIENT: '/ayu/:patientUuid/*',
};

/* Routes where mobile nav (top navbar, bottom menu) should be hidden */
export const HIDE_MOBILE_NAV_ROUTES: string[] = [ROUTES.PROFILE];

export default ROUTES;
