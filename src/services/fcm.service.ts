import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  type MessagePayload,
  type Messaging,
  type Unsubscribe,
} from 'firebase/messaging';
import { env } from '../config/env';

/**
 * Firebase Cloud Messaging Service
 * Handles FCM initialization, token management, and notification handling
 * for both foreground and background scenarios
 */

interface FCMConfig {
  onTokenReceived?: (token: string) => void;
  onMessageReceived?: (payload: MessagePayload) => void;
  onError?: (error: Error) => void;
}

class FCMService {
  private app: FirebaseApp | null = null;
  private messaging: Messaging | null = null;
  private config: FCMConfig = {};
  private token: string | null = null;
  private isMessageHandlerSetup = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private onMessageSubscription: Unsubscribe | null = null;

  /**
   * Register service worker
   * Note: Firebase config is injected from environment variables by Vite plugin
   */
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      if ('serviceWorker' in navigator) {
        // Register service worker
        const registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' }
        );

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        // Small delay to ensure service worker script is fully executed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Prepare Firebase config
        const firebaseConfig = {
          apiKey: env.FIREBASE_API_KEY,
          authDomain: env.FIREBASE_AUTH_DOMAIN,
          projectId: env.FIREBASE_PROJECT_ID,
          storageBucket: env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
          appId: env.FIREBASE_APP_ID,
        };

        // Send config to service worker
        // Try active first, then installing, then wait for activation
        const sendConfig = (worker: ServiceWorker | null) => {
          if (worker) {
            worker.postMessage({
              type: 'FIREBASE_CONFIG',
              config: firebaseConfig,
            });
          }
        };

        if (registration.active) {
          sendConfig(registration.active);
        } else if (registration.installing) {
          registration.installing.addEventListener('statechange', () => {
            if (registration.installing?.state === 'activated') {
              sendConfig(registration.active);
            }
          });
        } else if (registration.waiting) {
          sendConfig(registration.waiting);
        }

        // Also listen for new service worker activation
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated' && registration.active) {
                sendConfig(registration.active);
              }
            });
          }
        });

        return registration;
      }
      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Service worker registration error:', error);
      return null;
    }
  }

  /**
   * Initialize Firebase app and messaging
   */
  async initialize(config: FCMConfig = {}): Promise<boolean> {
    try {
      // Check if Firebase config is available
      if (
        !env.FIREBASE_API_KEY ||
        !env.FIREBASE_AUTH_DOMAIN ||
        !env.FIREBASE_PROJECT_ID ||
        !env.FIREBASE_MESSAGING_SENDER_ID ||
        !env.FIREBASE_APP_ID ||
        !env.FIREBASE_VAPID_KEY
      ) {
        // eslint-disable-next-line no-console
        console.warn('Firebase configuration is incomplete');
        return false;
      }

      // Initialize Firebase app if not already initialized
      if (getApps().length === 0) {
        this.app = initializeApp({
          apiKey: env.FIREBASE_API_KEY,
          authDomain: env.FIREBASE_AUTH_DOMAIN,
          projectId: env.FIREBASE_PROJECT_ID,
          storageBucket: env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
          appId: env.FIREBASE_APP_ID,
        });
      } else {
        this.app = getApps()[0];
      }

      // Initialize messaging (only in browser context)
      if (typeof window !== 'undefined') {
        if ('serviceWorker' in navigator) {
          // Register service worker first
          this.serviceWorkerRegistration = await this.registerServiceWorker();

          // Wait a bit more to ensure service worker is fully ready
          if (this.serviceWorkerRegistration) {
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            // Additional delay to ensure service worker script is executed
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        // Initialize messaging instance
        // Note: getMessaging only takes FirebaseApp, service worker is handled separately
        this.messaging = getMessaging(this.app);
        this.config = config;

        // Verify messaging instance is valid
        if (!this.messaging) {
          // eslint-disable-next-line no-console
          console.error('Failed to initialize Firebase Messaging instance');
          return false;
        }

        // Set up foreground message handler immediately
        // onMessage must be set up in the main thread when app is in foreground
        this.setupForegroundMessageHandler();

        return true;
      }

      // eslint-disable-next-line no-console
      console.warn('Service Worker not supported in this browser');
      return false;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // eslint-disable-next-line no-console
      console.error('FCM initialization error:', err);
      this.config.onError?.(err);
      return false;
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermission(): Promise<string | null> {
    try {
      if (!this.messaging) {
        throw new Error('FCM not initialized. Call initialize() first.');
      }

      // Check if browser supports notifications
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get FCM token
      const vapidKey = env.FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        throw new Error('VAPID key not configured');
      }

      this.token = await getToken(this.messaging, {
        vapidKey,
      });

      if (this.token) {
        this.config.onTokenReceived?.(this.token);
        // Store token in localStorage for persistence
        localStorage.setItem('fcm_token', this.token);
      } else {
        throw new Error('No registration token available');
      }

      return this.token;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // eslint-disable-next-line no-console
      console.error('FCM permission request error:', err);
      this.config.onError?.(err);
      return null;
    }
  }

  /**
   * Get stored FCM token
   */
  getToken(): string | null {
    if (this.token) {
      return this.token;
    }

    // Try to get from localStorage
    const storedToken = localStorage.getItem('fcm_token');
    if (storedToken) {
      this.token = storedToken;
      return storedToken;
    }

    return null;
  }

  /**
   * Validate prerequisites for getting token
   * Returns error message if validation fails, null if valid
   */
  private validateTokenPrerequisites(): string | null {
    if (!this.messaging) {
      return 'FCM not initialized. Call initialize() first.';
    }
    if (!('Notification' in window)) {
      return 'This browser does not support notifications';
    }
    if (Notification.permission !== 'granted') {
      return null; // Permission not granted is expected, not an error
    }
    return null;
  }

  /**
   * Get VAPID key from environment
   * Throws error if not configured
   */
  private getVapidKey(): string {
    const vapidKey = env.FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID key not configured');
    }
    return vapidKey;
  }

  /**
   * Store token and trigger callback
   */
  private storeToken(token: string, shouldNotify = true): void {
    this.token = token;
    localStorage.setItem('fcm_token', token);
    if (shouldNotify) {
      this.config.onTokenReceived?.(token);
    }
  }

  /**
   * Clear stored token
   */
  private clearStoredToken(): void {
    localStorage.removeItem('fcm_token');
    this.token = null;
  }

  /**
   * Get FCM token from Firebase (without requesting permission)
   * Use this when permission is already granted
   * Returns null if permission is not granted or if there's an error
   */
  async getTokenFromFirebase(): Promise<string | null> {
    try {
      const validationError = this.validateTokenPrerequisites();
      if (validationError) {
        throw new Error(validationError);
      }

      if (Notification.permission !== 'granted') {
        return null;
      }

      const token = await getToken(this.messaging!, {
        vapidKey: this.getVapidKey(),
      });

      if (token) {
        this.storeToken(token, true);
        return token;
      }

      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // eslint-disable-next-line no-console
      console.error('FCM get token error:', err);
      return null;
    }
  }

  /**
   * Validate and refresh token if needed
   * Checks if stored token is valid, if not, gets a new one from Firebase
   * Returns the valid token (existing or new)
   */
  async validateAndRefreshToken(): Promise<string | null> {
    try {
      const validationError = this.validateTokenPrerequisites();
      if (validationError) {
        throw new Error(validationError);
      }

      if (Notification.permission !== 'granted') {
        this.clearStoredToken();
        return null;
      }

      const storedToken = localStorage.getItem('fcm_token');
      const freshToken = await getToken(this.messaging!, {
        vapidKey: this.getVapidKey(),
      });

      if (freshToken) {
        // Update token if it changed or is new
        if (!storedToken || storedToken !== freshToken) {
          this.storeToken(freshToken, true);
        } else {
          this.token = freshToken; // Token unchanged, just update reference
        }
        return freshToken;
      }

      // No token from Firebase, clear stored one
      if (storedToken) {
        this.clearStoredToken();
      }

      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // eslint-disable-next-line no-console
      console.error('FCM token validation error:', err);
      this.clearStoredToken();
      return null;
    }
  }

  /**
   * Check if notification permission is granted
   */
  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Check if FCM is initialized
   */
  isInitialized(): boolean {
    return this.messaging !== null;
  }

  /**
   * Set up foreground message handler
   * This handles notifications when the app is in the foreground
   * Uses custom notification component instead of browser default
   * Note: onMessage can only be registered once per messaging instance
   *
   * IMPORTANT: onMessage only works when:
   * 1. The app/tab is in the foreground (active and visible)
   * 2. The messaging instance is properly initialized
   * 3. The service worker is registered (for background messages)
   */
  private setupForegroundMessageHandler(): void {
    if (!this.messaging) {
      // eslint-disable-next-line no-console -- error logging
      console.warn(
        'FCM messaging not initialized, cannot set up foreground handler'
      );
      return;
    }

    // Prevent duplicate registration - onMessage can only be called once
    if (this.isMessageHandlerSetup) {
      // Handler already set up, just ensure config is updated
      return;
    }

    try {
      if (this.onMessageSubscription) {
        this.onMessageSubscription();
      }
      this.onMessageSubscription = onMessage(
        this.messaging,
        (payload: MessagePayload) => {
          // Call custom handler - this will trigger custom notification component
          // Browser default notifications are disabled in favor of custom UI
          // Use this.config to always get the latest callback
          if (this.config.onMessageReceived) {
            try {
              this.config.onMessageReceived(payload);
            } catch (error) {
              // eslint-disable-next-line no-console -- error logging
              console.error('Error in onMessageReceived callback:', error);
            }
          } else {
            // eslint-disable-next-line no-console -- error logging
            console.warn('FCM message received but no handler configured');
          }
        }
      );

      this.isMessageHandlerSetup = true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // eslint-disable-next-line no-console -- error logging
      console.error('Error setting up FCM foreground message handler:', err);
      this.config.onError?.(err);
    }
  }

  /**
   * Delete FCM token (for logout/unsubscribe)
   */
  async deleteToken(): Promise<boolean> {
    try {
      if (!this.messaging || !this.token) {
        return false;
      }

      // Note: deleteToken is not directly available in firebase/messaging
      // You would need to call your backend API to delete the token
      // For now, we'll just clear local storage
      localStorage.removeItem('fcm_token');
      this.token = null;
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console -- error logging
      console.error('Error deleting FCM token:', error);
      return false;
    }
  }

  /**
   * Update configuration
   * If message handler is not set up yet, set it up now
   * Updates properties in place to maintain closure reference
   */
  updateConfig(config: Partial<FCMConfig>): void {
    // Update properties in place so the closure in onMessage handler
    // always reads the latest values
    Object.assign(this.config, config);

    // If messaging is initialized but handler is not set up, set it up now
    if (this.messaging && !this.isMessageHandlerSetup) {
      this.setupForegroundMessageHandler();
    } else if (this.messaging && this.isMessageHandlerSetup) {
      // eslint-disable-next-line no-console -- error logging
      console.error(
        'Config updated, handler already set up (will use new callback)'
      );
    }
  }
}

// Export singleton instance
export const fcmService = new FCMService();
export default fcmService;
