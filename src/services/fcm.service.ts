import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken as fcmGetToken, // renamed to avoid collision
  onMessage,
  type MessagePayload,
  type Messaging,
  type Unsubscribe,
} from 'firebase/messaging';
import { env } from '../config/env';

interface FCMConfig {
  onMessageReceived?: (payload: MessagePayload) => void;
}

const FIREBASE_CONFIG = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

class FCMService {
  private app: FirebaseApp | null = null;
  private messaging: Messaging | null = null;
  private config: FCMConfig = {};
  private _token: string | null = null;
  private onMessageUnsub: Unsubscribe | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;

  async initialize(config: FCMConfig = {}): Promise<boolean> {
    try {
      if (
        !FIREBASE_CONFIG.apiKey ||
        !FIREBASE_CONFIG.projectId ||
        !env.FIREBASE_VAPID_KEY
      ) {
        console.warn('[FCM] Firebase configuration incomplete');
        return false;
      }
      if (!('serviceWorker' in navigator)) {
        console.warn('[FCM] Service Worker not supported');
        return false;
      }

      this.app = getApps().length
        ? getApps()[0]
        : initializeApp(FIREBASE_CONFIG);

      // Register SW, then wait for the *active* registration
      const swUrl = `${import.meta.env.BASE_URL}firebase-messaging-sw.js`;
      await navigator.serviceWorker.register(swUrl, {
        scope: import.meta.env.BASE_URL,
      });
      this.swRegistration = await navigator.serviceWorker.ready;

      this.messaging = getMessaging(this.app);
      this.config = config;

      // Unsubscribe any previous listener before re-registering
      this.onMessageUnsub?.();
      this.onMessageUnsub = onMessage(
        this.messaging,
        (payload: MessagePayload) => {
          this.showForegroundNotification(payload);
          this.config.onMessageReceived?.(payload);
        }
      );
      return true;
    } catch (error) {
      console.error('[FCM] Initialization error:', error);
      return false;
    }
  }

  private showForegroundNotification(payload: MessagePayload): void {
    if (!this.swRegistration) return;

    const data = payload.data || {};
    const notif = payload.notification || {};
    const title = data['title'] || notif.title || 'New Notification';
    const body = data['body'] || notif.body || '';
    const tag = data['tag'] || 'fcm-foreground';

    this.swRegistration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag,
      data,
    } as NotificationOptions & { renotify: boolean });
  }

  async requestPermission(): Promise<string | null> {
    try {
      if (!this.messaging) {
        console.error('[FCM] Not initialized');
        return null;
      }
      if (!('Notification' in window)) {
        console.error('[FCM] Notifications not supported');
        return null;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;

      this._token = await fcmGetToken(this.messaging, {
        vapidKey: env.FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: this.swRegistration ?? undefined,
      });

      if (!this._token) {
        console.error('[FCM] No token received');
        return null;
      }

      // Watch for token rotation — stale tokens silently drop messages
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'FCM_TOKEN_REFRESH') {
          this.requestPermission();
        }
      });

      return this._token;
    } catch (error) {
      console.error('[FCM] Token error:', error);
      return null;
    }
  }

  getToken(): string | null {
    return this._token; // no longer collides with firebase import
  }

  isInitialized(): boolean {
    return this.messaging !== null;
  }

  clearToken(): void {
    this._token = null;
  }

  destroy(): void {
    this.onMessageUnsub?.();
    this.onMessageUnsub = null;
  }
}

export const fcmService = new FCMService();
export default fcmService;
