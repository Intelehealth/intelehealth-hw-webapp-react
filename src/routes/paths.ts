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
  PROFILE: '/profile',
  ADD_PATIENT: '/add-patient',
  COMMON_UI: '/common-ui',
  TEST_PROFILE_GUARD: '/test-profile-guard',
  NOT_FOUND: '*', // catch-all
  PATIENT: {
    BASE: '/patient',
    ADD_PATIENT: 'add',
  },
  AYU: '/ayu',
};

export default ROUTES;
