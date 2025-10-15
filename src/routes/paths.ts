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
  COMMON_UI: '/common-ui',
  NOT_FOUND: '*', // catch-all
};

export default ROUTES;
