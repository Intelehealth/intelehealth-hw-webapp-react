import { act, renderHook, waitFor } from '@testing-library/react';
import type { MessagePayload } from 'firebase/messaging';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useFCM from '../../hooks/useFCM';

// Mock fcmService
vi.mock('../../services/fcm.service', () => ({
  default: {
    isInitialized: vi.fn(),
    initialize: vi.fn(),
    getToken: vi.fn(),
    requestPermission: vi.fn(),
    clearToken: vi.fn(),
    destroy: vi.fn(),
  },
}));

import fcmService from '../../services/fcm.service';

// Helper to set Notification.permission
const setNotificationPermission = (perm: NotificationPermission) => {
  Object.defineProperty(globalThis, 'Notification', {
    value: { permission: perm, requestPermission: vi.fn() },
    writable: true,
    configurable: true,
  });
};

describe('useFCM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    setNotificationPermission('default');

    vi.mocked(fcmService.isInitialized).mockReturnValue(false);
    vi.mocked(fcmService.initialize).mockResolvedValue(true);
    vi.mocked(fcmService.getToken).mockReturnValue(null);
    vi.mocked(fcmService.requestPermission).mockResolvedValue('requested-token');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize FCM on mount', async () => {
      const { result } = renderHook(() => useFCM());

      expect(result.current.isInitialized).toBe(false);

      await waitFor(() => {
        expect(fcmService.initialize).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });

    it('should handle already initialized service', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.getToken).mockReturnValue('existing-token');
      setNotificationPermission('granted');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(fcmService.initialize).not.toHaveBeenCalled();
      expect(result.current.token).toBe('existing-token');
      expect(result.current.isPermissionGranted).toBe(true);
    });

    it('should handle initialization error', async () => {
      vi.mocked(fcmService.initialize).mockRejectedValue(new Error('Init failed'));

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.message).toBe('Init failed');
      expect(result.current.isInitialized).toBe(false);
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(fcmService.initialize).mockRejectedValue('String error');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('String error');
      });
    });

    it('should handle initialization returning false', async () => {
      vi.mocked(fcmService.initialize).mockResolvedValue(false);

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(fcmService.initialize).toHaveBeenCalled();
      });

      expect(result.current.isInitialized).toBe(false);
    });

    it('should request token when permission is already granted and no stored token', async () => {
      setNotificationPermission('granted');
      vi.mocked(fcmService.getToken).mockReturnValue(null);
      vi.mocked(fcmService.requestPermission).mockResolvedValue('auto-token');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.token).toBe('auto-token');
      });

      expect(fcmService.requestPermission).toHaveBeenCalled();
    });

    it('should use existing token when available', async () => {
      vi.mocked(fcmService.getToken).mockReturnValue('stored-token');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.token).toBe('stored-token');
      expect(fcmService.requestPermission).not.toHaveBeenCalled();
    });
  });

  describe('Permission Status', () => {
    it('should return correct status when granted', async () => {
      setNotificationPermission('granted');
      vi.mocked(fcmService.getToken).mockReturnValue('test-token');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isPermissionGranted).toBe(true);
      expect(result.current.isPermissionDenied).toBe(false);
      expect(result.current.isPermissionDefault).toBe(false);
    });

    it('should return correct status when denied', async () => {
      setNotificationPermission('denied');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isPermissionGranted).toBe(false);
      expect(result.current.isPermissionDenied).toBe(true);
      expect(result.current.isPermissionDefault).toBe(false);
    });

    it('should return correct status when default', async () => {
      setNotificationPermission('default');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isPermissionGranted).toBe(false);
      expect(result.current.isPermissionDenied).toBe(false);
      expect(result.current.isPermissionDefault).toBe(true);
    });

    it('should check permission periodically', async () => {
      vi.useFakeTimers();
      setNotificationPermission('default');

      const { result, unmount } = renderHook(() => useFCM());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isPermissionDefault).toBe(true);

      // Simulate permission change
      setNotificationPermission('granted');

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.isPermissionGranted).toBe(true);

      unmount();
      vi.useRealTimers();
    });

    it('should not update permission if unchanged', async () => {
      vi.useFakeTimers();
      setNotificationPermission('default');

      const { result, unmount } = renderHook(() => useFCM());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isPermissionDefault).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.isPermissionDefault).toBe(true);

      unmount();
      vi.useRealTimers();
    });

    it('should skip periodic check while requesting permission', async () => {
      vi.useFakeTimers();
      setNotificationPermission('default');
      vi.mocked(fcmService.requestPermission).mockResolvedValue(null);

      const { result, unmount } = renderHook(() => useFCM());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isInitialized).toBe(true);

      // Start requesting permission
      const requestPromise = result.current.requestPermission();

      // Permission changes externally while requesting
      setNotificationPermission('granted');

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await requestPromise;

      // After requesting, the flag stays true for 5 seconds
      // So periodic check should be skipped
      setNotificationPermission('denied');

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Permission should still reflect what requestPermission set,
      // not the periodic check (which is skipped)
      expect(result.current.isPermissionGranted).toBe(true);

      // After 5s the flag resets
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      unmount();
      vi.useRealTimers();
    });
  });

  describe('Request Permission', () => {
    it('should request permission successfully', async () => {
      vi.mocked(fcmService.requestPermission).mockResolvedValue('new-token');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      setNotificationPermission('granted');
      await result.current.requestPermission();

      await waitFor(() => {
        expect(result.current.token).toBe('new-token');
        expect(result.current.isPermissionGranted).toBe(true);
      });
    });

    it('should handle permission request error', async () => {
      vi.mocked(fcmService.requestPermission).mockRejectedValue(
        new Error('Permission request failed')
      );

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      setNotificationPermission('denied');
      await result.current.requestPermission();

      await waitFor(() => {
        expect(result.current.error?.message).toBe('Permission request failed');
        expect(result.current.isPermissionDenied).toBe(true);
      });
    });

    it('should handle non-Error permission request error', async () => {
      vi.mocked(fcmService.requestPermission).mockRejectedValue('String error');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      setNotificationPermission('denied');
      await result.current.requestPermission();

      await waitFor(() => {
        expect(result.current.error?.message).toBe('String error');
        expect(result.current.isPermissionDenied).toBe(true);
      });
    });

    it('should handle null token from requestPermission', async () => {
      vi.mocked(fcmService.requestPermission).mockResolvedValue(null);

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await result.current.requestPermission();

      expect(result.current.token).toBeNull();
    });

    it('should reset requesting flag after delay', async () => {
      vi.useFakeTimers();
      vi.mocked(fcmService.requestPermission).mockResolvedValue('new-token');
      setNotificationPermission('granted');

      const { result, unmount } = renderHook(() => useFCM());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isInitialized).toBe(true);

      await act(async () => {
        await result.current.requestPermission();
      });

      // Permission checking should resume after 5s reset delay
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Change permission externally
      setNotificationPermission('denied');

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // After flag reset + interval, periodic check should pick up the change
      expect(result.current.isPermissionDenied).toBe(true);

      unmount();
      vi.useRealTimers();
    });
  });

  describe('Message Handling', () => {
    it('should call onMessageReceived callback', async () => {
      const mockOnMessage = vi.fn();
      let messageHandler: ((payload: MessagePayload) => void) | undefined;

      vi.mocked(fcmService.initialize).mockImplementation(async (config) => {
        if (config?.onMessageReceived) {
          messageHandler = config.onMessageReceived;
        }
        return true;
      });

      const { result } = renderHook(() => useFCM(mockOnMessage));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const mockPayload: MessagePayload = {
        notification: { title: 'Test', body: 'Test body' },
        data: {},
        from: 'test-sender',
        collapseKey: 'test-key',
        messageId: 'test-id',
      } as MessagePayload;

      expect(messageHandler).toBeDefined();
      messageHandler!(mockPayload);

      expect(mockOnMessage).toHaveBeenCalledWith(mockPayload);
    });

    it('should not throw when no callback is provided', async () => {
      let messageHandler: ((payload: MessagePayload) => void) | undefined;

      vi.mocked(fcmService.initialize).mockImplementation(async (config) => {
        if (config?.onMessageReceived) {
          messageHandler = config.onMessageReceived;
        }
        return true;
      });

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const mockPayload = {
        notification: { title: 'Test', body: 'body' },
        data: {},
      } as MessagePayload;

      expect(messageHandler).toBeDefined();
      expect(() => messageHandler!(mockPayload)).not.toThrow();
    });

    it('should use latest callback via ref', async () => {
      const firstCb = vi.fn();
      const secondCb = vi.fn();
      let messageHandler: ((payload: MessagePayload) => void) | undefined;

      vi.mocked(fcmService.initialize).mockImplementation(async (config) => {
        if (config?.onMessageReceived) {
          messageHandler = config.onMessageReceived;
        }
        return true;
      });

      const { result, rerender } = renderHook(
        ({ cb }) => useFCM(cb),
        { initialProps: { cb: firstCb } }
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      rerender({ cb: secondCb });

      const mockPayload = { data: {} } as MessagePayload;
      messageHandler!(mockPayload);

      expect(secondCb).toHaveBeenCalledWith(mockPayload);
      expect(firstCb).not.toHaveBeenCalled();
    });
  });
});
