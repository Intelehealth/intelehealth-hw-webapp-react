// Define your environment variable types
interface ImportMetaEnv {
  readonly APP_ENV?: string;
  readonly APP_NAME?: string;
  readonly APP_VERSION?: string;
  readonly AUTH_GATEWAY_API_URL: string;
  readonly OPENMRS_API_URL?: string;
  readonly PORTAL_API_URL?: string;
  readonly DEBUG_MODE?: string;
  readonly API_TIMEOUT?: string;
  readonly SENTRY_DSN?: string;
  readonly FIREBASE_API_KEY?: string;
  readonly FIREBASE_AUTH_DOMAIN?: string;
  readonly FIREBASE_PROJECT_ID?: string;
  readonly FIREBASE_STORAGE_BUCKET?: string;
  readonly FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly FIREBASE_APP_ID?: string;
  readonly FIREBASE_VAPID_KEY?: string;
  // add more as needed
}

// Export a typed object for easy access & debugging
export const env: ImportMetaEnv = {
  APP_ENV: import.meta.env.VITE_APP_ENV,
  APP_NAME: import.meta.env.VITE_APP_NAME,
  APP_VERSION: import.meta.env.VITE_APP_VERSION,
  AUTH_GATEWAY_API_URL: import.meta.env.VITE_AUTH_GATEWAY_API_URL,
  OPENMRS_API_URL: import.meta.env.VITE_OPENMRS_API_URL,
  PORTAL_API_URL: import.meta.env.VITE_PORTAL_API_URL,
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE,
  API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  FIREBASE_VAPID_KEY: import.meta.env.VITE_FIREBASE_VAPID_KEY,
} as const;
