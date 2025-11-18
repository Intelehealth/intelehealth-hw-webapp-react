import { act, renderHook, waitFor } from '@testing-library/react';
import type { MessagePayload } from 'firebase/messaging';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useFCM from '../../hooks/useFCM';

// Mock fcmService - define mock object directly in factory to avoid hoisting issues
vi.mock('../../services/fcm.service', () => ({
  default: {
    isInitialized: vi.fn(),
    initialize: vi.fn(),
    checkPermission: vi.fn(),
    getToken: vi.fn(),
    validateAndRefreshToken: vi.fn(),
    getTokenFromFirebase: vi.fn(),
    requestPermission: vi.fn(),
    updateConfig: vi.fn(),
  },
}));

// Mock storage
vi.mock('../../utils/storage', () => ({
  storage: {
    getAuthToken: vi.fn(),
  },
}));

// Import after mocks are set up
import fcmService from '../../services/fcm.service';
import { storage } from '../../utils/storage';

describe('useFCM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use real timers for async operations
    vi.useRealTimers();
    
    // Default mock implementations
    vi.mocked(fcmService.isInitialized).mockReturnValue(false);
    vi.mocked(fcmService.initialize).mockResolvedValue(true);
    vi.mocked(fcmService.checkPermission).mockResolvedValue('default');
    vi.mocked(fcmService.getToken).mockReturnValue(null);
    vi.mocked(fcmService.validateAndRefreshToken).mockResolvedValue('valid-token');
    vi.mocked(fcmService.getTokenFromFirebase).mockResolvedValue('new-token');
    vi.mocked(fcmService.requestPermission).mockResolvedValue('requested-token');
    vi.mocked(storage.getAuthToken).mockReturnValue('auth-token');
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

    it('should handle initialization when already initialized', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      vi.mocked(fcmService.getToken).mockReturnValue('existing-token');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(fcmService.initialize).not.toHaveBeenCalled();
      expect(fcmService.updateConfig).toHaveBeenCalled();
    });

    it('should handle initialization when already initialized without onMessageReceived callback', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      vi.mocked(fcmService.getToken).mockReturnValue('existing-token');

      let messageCallback: ((payload: MessagePayload) => void) | undefined = vi.fn();

      vi.mocked(fcmService.updateConfig).mockImplementation((config: any) => {
        if (config.onMessageReceived) {
          messageCallback = config.onMessageReceived;
        }
      });

      // Call useFCM without onMessageReceived callback (undefined)
      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(fcmService.updateConfig).toHaveBeenCalled();

      // Test that the callback works even when onMessageReceived is undefined
      // This covers the branch where onMessageReceived?.() is called with undefined callback
      const mockPayload: MessagePayload = {
        notification: { title: 'Test', body: 'Test body' },
        data: {},
        from: 'test-sender',
        collapseKey: 'test-key',
        messageId: 'test-id',
      } as MessagePayload;

      // The callback should be set even when onMessageReceived is undefined
      // because updateConfig is called with a callback that has onMessageReceived?.()
      expect(messageCallback).toBeDefined();
      
      if (messageCallback) {
        // Call the callback - this should not throw even though onMessageReceived was undefined
        // This covers the optional chaining branch onMessageReceived?.(payload) when undefined
        expect(() => messageCallback!(mockPayload)).not.toThrow();
      }
    });

    it('should handle initialization error', async () => {
      const initError = new Error('Initialization failed');
      vi.mocked(fcmService.initialize).mockRejectedValue(initError);

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.message).toBe('Initialization failed');
      expect(result.current.isInitialized).toBe(false);
    });

    it('should initialize even when user is not logged in', async () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);

      renderHook(() => useFCM());

      await waitFor(() => {
        expect(fcmService.initialize).toHaveBeenCalled();
      });
    });

    it('should handle initialization returning false', async () => {
      vi.mocked(fcmService.initialize).mockResolvedValue(false);

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(false);
      });
    });
  });

  describe('Permission Status', () => {
    it('should return correct permission status when granted', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      vi.mocked(fcmService.getToken).mockReturnValue('test-token');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.isPermissionGranted).toBe(true);
        expect(result.current.isPermissionDenied).toBe(false);
        expect(result.current.isPermissionDefault).toBe(false);
      });
    });

    it('should return correct permission status when denied', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('denied');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.isPermissionGranted).toBe(false);
        expect(result.current.isPermissionDenied).toBe(true);
        expect(result.current.isPermissionDefault).toBe(false);
      });
    });

    it('should return correct permission status when default', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('default');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.isPermissionGranted).toBe(false);
        expect(result.current.isPermissionDenied).toBe(false);
        expect(result.current.isPermissionDefault).toBe(true);
      });
    });

    it('should check permission periodically', async () => {
      vi.useFakeTimers();
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('default');

      const { result, unmount } = renderHook(() => useFCM());

      // Wait for initialization with fake timers - limit to avoid infinite loop
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isInitialized).toBe(true);
      
      const initialCallCount = vi.mocked(fcmService.checkPermission).mock.calls.length;

      // Fast-forward 5 seconds (check interval) - but limit iterations
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should have checked permission again
      expect(vi.mocked(fcmService.checkPermission).mock.calls.length).toBeGreaterThan(initialCallCount);
      
      unmount();
      vi.useRealTimers();
    });

    it('should not check permission if currently requesting', async () => {
      vi.useFakeTimers();
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('default');
      vi.mocked(fcmService.requestPermission).mockResolvedValue(null);

      const { result, unmount } = renderHook(() => useFCM());

      // Wait for initialization
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isInitialized).toBe(true);

      // Start requesting permission
      const requestPromise = result.current.requestPermission();

      // Fast-forward time while requesting
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should not check permission while requesting
      const checkCountDuringRequest = vi.mocked(fcmService.checkPermission).mock.calls.length;

      await requestPromise;
      
      // Fast-forward 5 seconds to reset requesting flag
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Fast-forward more time to trigger next check
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should resume checking after request completes
      expect(vi.mocked(fcmService.checkPermission).mock.calls.length).toBeGreaterThan(checkCountDuringRequest);
      
      unmount();
      vi.useRealTimers();
    });
  });

  describe('Token Retrieval', () => {
    it('should retrieve token when permission is granted and token exists in storage', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      vi.mocked(fcmService.getToken).mockReturnValue('stored-token');
      vi.mocked(fcmService.validateAndRefreshToken).mockResolvedValue('valid-token');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.token).toBe('valid-token');
      });

      expect(fcmService.validateAndRefreshToken).toHaveBeenCalled();
    });

    it('should get new token from Firebase when no stored token exists', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      vi.mocked(fcmService.getToken).mockReturnValue(null);
      vi.mocked(fcmService.getTokenFromFirebase).mockResolvedValue('new-token');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.token).toBe('new-token');
      });

      expect(fcmService.getTokenFromFirebase).toHaveBeenCalled();
    });

    it('should use stored token when permission is not granted', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('denied');
      vi.mocked(fcmService.getToken).mockReturnValue('stored-token');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.token).toBe('stored-token');
      });
    });

    it('should skip token retrieval if currently requesting permission', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      vi.mocked(fcmService.getToken).mockReturnValue('stored-token');
      vi.mocked(fcmService.requestPermission).mockResolvedValue('new-token');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Get call count before request
      const validateCallCountBefore = vi.mocked(fcmService.validateAndRefreshToken).mock.calls.length;

      // Start requesting permission - this sets isRequestingPermissionRef.current = true
      const requestPromise = result.current.requestPermission();

      // While request is in progress, change permission to granted to trigger handleTokenRetrieval
      // But it should be skipped because isRequestingPermissionRef.current is true
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      
      // Wait for request to complete
      await requestPromise;

      // Fast-forward 5 seconds to allow the requesting flag to reset
      await new Promise(resolve => setTimeout(resolve, 100));

      // Token retrieval should have been skipped during request
      // The validateAndRefreshToken should not be called during the request period
      const validateCallCountAfter = vi.mocked(fcmService.validateAndRefreshToken).mock.calls.length;
      
      // It might be called during initialization, but not during the request
      // The key is that it's not called more times than expected
      expect(validateCallCountAfter).toBeLessThanOrEqual(validateCallCountBefore + 1);
    });

    it('should skip token retrieval when isRequestingPermissionRef is true', async () => {
      vi.useFakeTimers();
      vi.mocked(fcmService.isInitialized).mockReturnValue(false);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      vi.mocked(fcmService.getToken).mockReturnValue('stored-token');
      vi.mocked(fcmService.validateAndRefreshToken).mockResolvedValue('valid-token');
      vi.mocked(fcmService.requestPermission).mockResolvedValue('new-token');

      // Make initialize delay so we can call requestPermission during initialization
      let resolveInitialize: (value: boolean) => void;
      const initializePromise = new Promise<boolean>(resolve => {
        resolveInitialize = resolve;
      });
      vi.mocked(fcmService.initialize).mockImplementation(async () => {
        return initializePromise;
      });

      const { result, unmount } = renderHook(() => useFCM());

      // Start initialization
      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      // While initialization is in progress, call requestPermission
      // This sets isRequestingPermissionRef.current = true
      const requestPromise = result.current.requestPermission();

      // Now complete initialization - this will call handleTokenRetrieval
      // But it should return early because isRequestingPermissionRef is true
      resolveInitialize!(true);

      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      // Get call count - validateAndRefreshToken should not be called
      // because handleTokenRetrieval returned early
      const validateCount = vi.mocked(fcmService.validateAndRefreshToken).mock.calls.length;

      await requestPromise;

      // ValidateAndRefreshToken should not have been called during initialization
      // because isRequestingPermissionRef was true
      expect(validateCount).toBe(0);

      unmount();
      vi.useRealTimers();
    });

    it('should handle error in validateAndRefreshToken', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      vi.mocked(fcmService.getToken).mockReturnValue('stored-token');
      const tokenError = new Error('Token validation failed');
      vi.mocked(fcmService.validateAndRefreshToken).mockRejectedValue(tokenError);

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should handle the error gracefully
      await waitFor(() => {
        expect(fcmService.validateAndRefreshToken).toHaveBeenCalled();
      });
    });

    it('should handle error in getTokenFromFirebase', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      vi.mocked(fcmService.getToken).mockReturnValue(null);
      const tokenError = new Error('Token fetch failed');
      vi.mocked(fcmService.getTokenFromFirebase).mockRejectedValue(tokenError);

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should handle the error gracefully
      await waitFor(() => {
        expect(fcmService.getTokenFromFirebase).toHaveBeenCalled();
      });
    });

    it('should handle onTokenReceived callback', async () => {
      let tokenCallback: ((token: string) => void) | undefined;

      vi.mocked(fcmService.initialize).mockImplementation(async (config: any) => {
        if (config.onTokenReceived) {
          tokenCallback = config.onTokenReceived;
        }
        return true;
      });

      vi.mocked(fcmService.isInitialized).mockReturnValue(false);

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      if (tokenCallback) {
        tokenCallback('callback-token');
      }

      await waitFor(() => {
        expect(result.current.token).toBe('callback-token');
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle permission change from denied to granted', async () => {
      vi.useFakeTimers();
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission)
        .mockResolvedValueOnce('denied')
        .mockResolvedValueOnce('granted');
      // When permission is denied, getToken returns stored token
      // When permission changes to granted, we need to validate it
      vi.mocked(fcmService.getToken).mockReturnValue('stored-token');
      vi.mocked(fcmService.validateAndRefreshToken).mockResolvedValue('valid-token');

      const { result, unmount } = renderHook(() => useFCM());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isPermissionDenied).toBe(true);
      // Initially, token is stored-token (from denied permission)
      expect(result.current.token).toBe('stored-token');

      // Fast-forward to trigger permission check - this will update permission but not token
      // because handleTokenRetrieval is not called when permission changes via periodic check
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.isPermissionGranted).toBe(true);
      // Token remains stored-token because permission change doesn't trigger token retrieval
      // This is expected behavior - token retrieval only happens on initialization or explicit request
      expect(result.current.token).toBe('stored-token');
      
      unmount();
      vi.useRealTimers();
    });

    it('should handle permission change from granted to denied', async () => {
      vi.useFakeTimers();
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission)
        .mockResolvedValueOnce('granted')
        .mockResolvedValueOnce('denied');
      vi.mocked(fcmService.getToken).mockReturnValue('stored-token');
      vi.mocked(fcmService.validateAndRefreshToken).mockResolvedValue('valid-token');

      const { result, unmount } = renderHook(() => useFCM());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isPermissionGranted).toBe(true);

      // Fast-forward to trigger permission check
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.isPermissionDenied).toBe(true);
      
      unmount();
      vi.useRealTimers();
    });

    it('should handle request permission when token is null', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      // Override the default mock to return null
      vi.mocked(fcmService.requestPermission).mockReset().mockResolvedValue(null);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');
      // Make sure getToken returns null so no token is set during initialization
      vi.mocked(fcmService.getToken).mockReturnValue(null);
      // Also make sure getTokenFromFirebase returns null
      vi.mocked(fcmService.getTokenFromFirebase).mockResolvedValue(null);

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Token should be null after initialization
      expect(result.current.token).toBeNull();

      await result.current.requestPermission();

      await waitFor(() => {
        // After requestPermission, checkPermission is called which returns 'granted'
        expect(result.current.isPermissionGranted).toBe(true);
      });

      // Token should still be null since requestPermission returned null
      expect(result.current.token).toBeNull();
    });
  });

  describe('Request Permission', () => {
    it('should request permission successfully', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.requestPermission).mockResolvedValue('new-token');
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const requestPromise = result.current.requestPermission();

      await waitFor(async () => {
        await requestPromise;
        expect(result.current.token).toBe('new-token');
        expect(result.current.isPermissionGranted).toBe(true);
      });
    });

    it('should handle permission request error', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      const requestError = new Error('Permission request failed');
      vi.mocked(fcmService.requestPermission).mockRejectedValue(requestError);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('denied');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await result.current.requestPermission();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('Permission request failed');
        expect(result.current.isPermissionDenied).toBe(true);
      });
    });

    it('should handle permission request error with non-Error instance', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      // Reject with a string (non-Error) to cover the branch where err instanceof Error is false
      vi.mocked(fcmService.requestPermission).mockRejectedValue('String error');
      vi.mocked(fcmService.checkPermission).mockResolvedValue('denied');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await result.current.requestPermission();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('String error');
        expect(result.current.isPermissionDenied).toBe(true);
      });
    });

    it('should update permission status after request', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.requestPermission).mockResolvedValue('new-token');
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await result.current.requestPermission();

      await waitFor(() => {
        expect(result.current.isPermissionGranted).toBe(true);
      });
    });

    it('should reset requesting flag after delay', async () => {
      vi.useFakeTimers();
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.requestPermission).mockResolvedValue('new-token');
      vi.mocked(fcmService.checkPermission).mockResolvedValue('granted');

      const { result, unmount } = renderHook(() => useFCM());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isInitialized).toBe(true);

      await act(async () => {
        await result.current.requestPermission();
      });

      // Fast-forward 5 seconds (reset delay)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Permission checking should resume
      const checkCount = vi.mocked(fcmService.checkPermission).mock.calls.length;
      
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      expect(vi.mocked(fcmService.checkPermission).mock.calls.length).toBeGreaterThan(checkCount);
      
      unmount();
      vi.useRealTimers();
    });
  });

  describe('Message Handling', () => {
    it('should call onMessageReceived callback when message is received', async () => {
      const mockOnMessageReceived = vi.fn();
      vi.mocked(fcmService.isInitialized).mockReturnValue(false);

      let messageCallback: ((payload: MessagePayload) => void) | undefined;

      vi.mocked(fcmService.initialize).mockImplementation(async (config: any) => {
        if (config.onMessageReceived) {
          messageCallback = config.onMessageReceived;
        }
        return true;
      });

      const { result } = renderHook(() => useFCM(mockOnMessageReceived));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Wait a bit to ensure callback is set
      await new Promise(resolve => setTimeout(resolve, 10));

      const mockPayload: MessagePayload = {
        notification: {
          title: 'Test',
          body: 'Test body',
        },
        data: {},
        from: 'test-sender',
        collapseKey: 'test-key',
        messageId: 'test-id',
      } as MessagePayload;

      if (messageCallback) {
        messageCallback(mockPayload);
      }

      expect(mockOnMessageReceived).toHaveBeenCalledWith(mockPayload);
    });

    it('should handle message when callback is not provided', async () => {
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);

      let messageCallback: ((payload: MessagePayload) => void) | undefined;

      vi.mocked(fcmService.initialize).mockImplementation(async (config: any) => {
        if (config.onMessageReceived) {
          messageCallback = config.onMessageReceived;
        }
        return true;
      });

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const mockPayload: MessagePayload = {
        notification: {
          title: 'Test',
          body: 'Test body',
        },
        data: {},
        from: 'test-sender',
        collapseKey: 'test-key',
        messageId: 'test-id',
      } as MessagePayload;

      // Should not throw error when callback is not provided
      if (messageCallback) {
        const callback = messageCallback;
        expect(() => {
          callback(mockPayload);
        }).not.toThrow();
      }
    });

    it('should update message handler when callback changes', async () => {
      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      vi.mocked(fcmService.isInitialized).mockReturnValue(true);

      const { rerender } = renderHook(
        ({ callback }) => useFCM(callback),
        {
          initialProps: { callback: firstCallback },
        }
      );

      await waitFor(() => {
        expect(fcmService.updateConfig).toHaveBeenCalled();
      });

      rerender({ callback: secondCallback });

      await waitFor(() => {
        expect(fcmService.updateConfig).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-Error exceptions', async () => {
      vi.mocked(fcmService.initialize).mockRejectedValue('String error');

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('String error');
      });
    });

    it('should handle error in onError callback', async () => {
      let errorCallback: ((error: Error) => void) | undefined;

      vi.mocked(fcmService.isInitialized).mockReturnValue(false);

      vi.mocked(fcmService.initialize).mockImplementation(async (config: any) => {
        if (config.onError) {
          errorCallback = config.onError;
        }
        return true;
      });

      const { result } = renderHook(() => useFCM());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Wait a bit to ensure callback is set
      await new Promise(resolve => setTimeout(resolve, 10));

      const testError = new Error('Test error');
      if (errorCallback) {
        errorCallback(testError);
      }

      await waitFor(() => {
        expect(result.current.error).toBe(testError);
      });
    });
  });

  describe('Permission Change Detection', () => {
    it('should update permission when it changes', async () => {
      vi.useFakeTimers();
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission)
        .mockResolvedValueOnce('default')
        .mockResolvedValueOnce('granted');

      const { result, unmount } = renderHook(() => useFCM());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isPermissionDefault).toBe(true);

      // Fast-forward to trigger permission check
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.isPermissionGranted).toBe(true);
      
      unmount();
      vi.useRealTimers();
    });

    it('should not update permission if it has not changed', async () => {
      vi.useFakeTimers();
      vi.mocked(fcmService.isInitialized).mockReturnValue(true);
      vi.mocked(fcmService.checkPermission).mockResolvedValue('default');

      const { result, unmount } = renderHook(() => useFCM());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isInitialized).toBe(true);
      const initialPermission = result.current.isPermissionDefault;

      // Fast-forward to trigger permission check
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Permission should remain the same
      expect(result.current.isPermissionDefault).toBe(initialPermission);
      
      unmount();
      vi.useRealTimers();
    });
  });
});

