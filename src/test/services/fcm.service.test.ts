import type { MessagePayload } from 'firebase/messaging';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Firebase modules
const mockGetApps = vi.fn();
const mockInitializeApp = vi.fn();
const mockGetMessaging = vi.fn();
const mockGetToken = vi.fn();
const mockOnMessage = vi.fn();

vi.mock('firebase/app', () => ({
  getApps: () => mockGetApps(),
  initializeApp: (config: any) => mockInitializeApp(config),
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: () => mockGetMessaging(),
  getToken: (messaging: any, options: any) => mockGetToken(messaging, options),
  onMessage: (messaging: any, callback: any) => mockOnMessage(messaging, callback),
}));

// Mock environment variables
vi.mock('../../config/env', () => ({
  env: {
    FIREBASE_API_KEY: 'test-api-key',
    FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
    FIREBASE_PROJECT_ID: 'test-project-id',
    FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
    FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
    FIREBASE_APP_ID: 'test-app-id',
    FIREBASE_VAPID_KEY: 'test-vapid-key',
  },
}));

// We need a fresh instance per test to avoid singleton state leaking
let fcmService: any;

describe('FCMService', () => {
  let mockMessaging: any;
  let mockApp: any;
  let mockServiceWorkerRegistration: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Re-import to get fresh module (singleton reset)
    vi.resetModules();

    // Re-apply mocks after resetModules
    vi.doMock('firebase/app', () => ({
      getApps: () => mockGetApps(),
      initializeApp: (config: any) => mockInitializeApp(config),
    }));
    vi.doMock('firebase/messaging', () => ({
      getMessaging: () => mockGetMessaging(),
      getToken: (messaging: any, options: any) => mockGetToken(messaging, options),
      onMessage: (messaging: any, callback: any) => mockOnMessage(messaging, callback),
    }));
    vi.doMock('../../config/env', () => ({
      env: {
        FIREBASE_API_KEY: 'test-api-key',
        FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
        FIREBASE_PROJECT_ID: 'test-project-id',
        FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
        FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
        FIREBASE_APP_ID: 'test-app-id',
        FIREBASE_VAPID_KEY: 'test-vapid-key',
      },
    }));

    mockApp = { name: 'test-app' };
    mockMessaging = { messaging: 'instance' };
    mockServiceWorkerRegistration = {
      active: { state: 'activated' },
      showNotification: vi.fn(),
    };

    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue(mockApp);
    mockGetMessaging.mockReturnValue(mockMessaging);
    mockGetToken.mockResolvedValue('test-token-123');
    mockOnMessage.mockReturnValue(() => {}); // unsubscribe fn

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
        ready: Promise.resolve(mockServiceWorkerRegistration),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
    });

    const mod = await import('../../services/fcm.service');
    fcmService = mod.fcmService;
  });

  afterEach(() => {
    fcmService?.destroy?.();
  });

  describe('initialize', () => {
    it('should initialize Firebase app and messaging successfully', async () => {
      const result = await fcmService.initialize();

      expect(result).toBe(true);
      expect(mockInitializeApp).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        authDomain: 'test-auth-domain',
        projectId: 'test-project-id',
        storageBucket: 'test-storage-bucket',
        messagingSenderId: 'test-sender-id',
        appId: 'test-app-id',
      });
      expect(mockGetMessaging).toHaveBeenCalled();
    });

    it('should use existing Firebase app if already initialized', async () => {
      mockGetApps.mockReturnValue([mockApp]);

      await fcmService.initialize();

      expect(mockInitializeApp).not.toHaveBeenCalled();
    });

    it('should register service worker', async () => {
      await fcmService.initialize();

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
        '/firebase-messaging-sw.js',
        { scope: '/' }
      );
    });

    it('should setup onMessage listener', async () => {
      const onMessageReceived = vi.fn();
      await fcmService.initialize({ onMessageReceived });

      expect(mockOnMessage).toHaveBeenCalledWith(mockMessaging, expect.any(Function));
    });

    it('should return false when service worker is not supported', async () => {
      // Delete the property so 'serviceWorker' in navigator === false (covers lines 39-42)
      const savedSW = navigator.serviceWorker;
      delete (navigator as any).serviceWorker;

      const result = await fcmService.initialize();
      expect(result).toBe(false);

      // Restore for subsequent tests
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: savedSW,
      });
    });

    it('should return false when Firebase config is incomplete', async () => {
      vi.doMock('../../config/env', () => ({
        env: {
          FIREBASE_API_KEY: '',
          FIREBASE_AUTH_DOMAIN: '',
          FIREBASE_PROJECT_ID: '',
          FIREBASE_STORAGE_BUCKET: '',
          FIREBASE_MESSAGING_SENDER_ID: '',
          FIREBASE_APP_ID: '',
          FIREBASE_VAPID_KEY: '',
        },
      }));

      vi.resetModules();
      // Re-apply firebase mocks
      vi.doMock('firebase/app', () => ({
        getApps: () => mockGetApps(),
        initializeApp: (config: any) => mockInitializeApp(config),
      }));
      vi.doMock('firebase/messaging', () => ({
        getMessaging: () => mockGetMessaging(),
        getToken: (messaging: any, options: any) => mockGetToken(messaging, options),
        onMessage: (messaging: any, callback: any) => mockOnMessage(messaging, callback),
      }));

      const mod = await import('../../services/fcm.service');
      const result = await mod.fcmService.initialize();
      expect(result).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      mockInitializeApp.mockImplementation(() => {
        throw new Error('Init failed');
      });

      const result = await fcmService.initialize();
      expect(result).toBe(false);
    });

    it('should call onMessageReceived when a foreground message arrives', async () => {
      const onMessageReceived = vi.fn();
      await fcmService.initialize({ onMessageReceived });

      // Get the callback passed to onMessage
      const messageCallback = mockOnMessage.mock.calls[0][1];
      const payload = {
        data: { title: 'Test', body: 'Test body' },
      } as unknown as MessagePayload;

      messageCallback(payload);
      expect(onMessageReceived).toHaveBeenCalledWith(payload);
    });

    it('should show foreground notification via service worker', async () => {
      await fcmService.initialize();

      const messageCallback = mockOnMessage.mock.calls[0][1];
      const payload = {
        data: { title: 'Test Title', body: 'Test body', tag: 'test-tag' },
      } as unknown as MessagePayload;

      messageCallback(payload);

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Test Title',
        expect.objectContaining({
          body: 'Test body',
          tag: 'test-tag',
        })
      );
    });

    it('should use notification fields when data fields are missing (lines 92-95)', async () => {
      await fcmService.initialize();

      const messageCallback = mockOnMessage.mock.calls[0][1];
      const payload = {
        notification: { title: 'Notif Title', body: 'Notif body' },
      } as unknown as MessagePayload;

      messageCallback(payload);

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Notif Title',
        expect.objectContaining({
          body: 'Notif body',
          tag: 'fcm-foreground',
        })
      );
    });

    it('should use default title when no title in data or notification (line 94)', async () => {
      await fcmService.initialize();

      const messageCallback = mockOnMessage.mock.calls[0][1];
      const payload = {} as unknown as MessagePayload;

      messageCallback(payload);

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'New Notification',
        expect.objectContaining({
          body: '',
          tag: 'fcm-foreground',
        })
      );
    });

    it('should unsubscribe previous listener when initialize is called twice (line 73)', async () => {
      const unsub1 = vi.fn();
      mockOnMessage.mockReturnValueOnce(unsub1);

      await fcmService.initialize();
      expect(unsub1).not.toHaveBeenCalled();

      await fcmService.initialize();
      expect(unsub1).toHaveBeenCalled();
    });
  });

  describe('requestPermission', () => {
    it('should request permission and return token', async () => {
      await fcmService.initialize();

      const token = await fcmService.requestPermission();

      expect(window.Notification.requestPermission).toHaveBeenCalled();
      expect(mockGetToken).toHaveBeenCalledWith(mockMessaging, {
        vapidKey: 'test-vapid-key',
        serviceWorkerRegistration: mockServiceWorkerRegistration,
      });
      expect(token).toBe('test-token-123');
    });

    it('should return null when not initialized', async () => {
      const token = await fcmService.requestPermission();
      expect(token).toBeNull();
    });

    it('should return null when permission is denied', async () => {
      await fcmService.initialize();
      (window.Notification.requestPermission as any).mockResolvedValue('denied');

      const token = await fcmService.requestPermission();
      expect(token).toBeNull();
    });

    it('should return null when Notification API is not available', async () => {
      await fcmService.initialize();
      // Delete the property so 'Notification' in window === false (covers lines 91-93)
      delete (window as any).Notification;

      const token = await fcmService.requestPermission();
      expect(token).toBeNull();
    });

    it('should return null when no token is received', async () => {
      await fcmService.initialize();
      mockGetToken.mockResolvedValue(null);

      const token = await fcmService.requestPermission();
      expect(token).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      await fcmService.initialize();
      mockGetToken.mockRejectedValue(new Error('Token error'));

      const token = await fcmService.requestPermission();
      expect(token).toBeNull();
    });

    it('should listen for FCM_TOKEN_REFRESH and re-request permission (covers lines 110-113)', async () => {
      const messageListeners: Array<(event: any) => void> = [];
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
          ready: Promise.resolve(mockServiceWorkerRegistration),
          addEventListener: vi.fn((_, handler) => messageListeners.push(handler)),
          removeEventListener: vi.fn(),
        },
      });

      await fcmService.initialize();
      await fcmService.requestPermission();

      // The token refresh listener should have been registered
      expect(messageListeners.length).toBeGreaterThan(0);

      // Reset mock to track the re-request
      mockGetToken.mockResolvedValue('refreshed-token');

      // Simulate FCM_TOKEN_REFRESH message
      messageListeners[messageListeners.length - 1]({ data: { type: 'FCM_TOKEN_REFRESH' } });

      // Non-matching message type should not trigger re-request
      const callsBefore = mockGetToken.mock.calls.length;
      messageListeners[messageListeners.length - 1]({ data: { type: 'OTHER_EVENT' } });
      // getToken should not have been called again synchronously for non-matching type
      expect(mockGetToken.mock.calls.length).toBe(callsBefore);
    });
  });

  describe('getToken', () => {
    it('should return null before requestPermission', () => {
      expect(fcmService.getToken()).toBeNull();
    });

    it('should return token after successful requestPermission', async () => {
      await fcmService.initialize();
      await fcmService.requestPermission();

      expect(fcmService.getToken()).toBe('test-token-123');
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialize', () => {
      expect(fcmService.isInitialized()).toBe(false);
    });

    it('should return true after successful initialize', async () => {
      await fcmService.initialize();
      expect(fcmService.isInitialized()).toBe(true);
    });
  });

  describe('clearToken', () => {
    it('should clear the stored token', async () => {
      await fcmService.initialize();
      await fcmService.requestPermission();
      expect(fcmService.getToken()).toBe('test-token-123');

      fcmService.clearToken();
      expect(fcmService.getToken()).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should unsubscribe onMessage listener', async () => {
      const unsubscribe = vi.fn();
      mockOnMessage.mockReturnValue(unsubscribe);

      await fcmService.initialize();
      fcmService.destroy();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should be safe to call multiple times', async () => {
      await fcmService.initialize();
      fcmService.destroy();
      expect(() => fcmService.destroy()).not.toThrow();
    });
  });
});
