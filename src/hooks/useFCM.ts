import { type MessagePayload } from 'firebase/messaging';
import { useCallback, useEffect, useRef, useState } from 'react';
import fcmService from '../services/fcm.service';
import { storage } from '../utils/storage';

interface UseFCMReturn {
  isInitialized: boolean;
  isPermissionGranted: boolean;
  isPermissionDenied: boolean;
  isPermissionDefault: boolean;
  token: string | null;
  requestPermission: () => Promise<void>;
  error: Error | null;
}

/**
 * React hook for Firebase Cloud Messaging
 * Provides easy integration with FCM service
 */
export const useFCM = (
  onMessageReceived?: (payload: MessagePayload) => void
): UseFCMReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Track if we're currently requesting permission to avoid duplicate token retrieval
  const isRequestingPermissionRef = useRef(false);

  // Helper function to handle token retrieval and validation
  const handleTokenRetrieval = useCallback(
    async (permissionStatus: NotificationPermission) => {
      // Skip token retrieval if we're currently requesting permission
      // (token will be set by requestPermission function)
      if (isRequestingPermissionRef.current) {
        return;
      }

      if (permissionStatus === 'granted') {
        // Check if token exists in storage first
        const storedToken = fcmService.getToken();

        if (storedToken) {
          // Token exists, validate and refresh if needed
          const validToken = await fcmService.validateAndRefreshToken();
          setToken(validToken);
        } else {
          // No stored token, get a new one directly from Firebase
          const newToken = await fcmService.getTokenFromFirebase();
          setToken(newToken);
        }
      } else {
        // Permission not granted, use stored token if available
        const storedToken = fcmService.getToken();
        setToken(storedToken);
      }
    },
    []
  );

  // Initialize FCM on mount
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        // Check if user is logged in - only initialize for logged-in users
        const authToken = storage.getAuthToken();
        if (!authToken) {
          // User not logged in, skip FCM initialization
          // return;
        }

        // Check if already initialized
        if (fcmService.isInitialized()) {
          setIsInitialized(true);

          // Update config to ensure message handler uses latest callback
          fcmService.updateConfig({
            onMessageReceived: payload => {
              onMessageReceived?.(payload);
            },
          });

          const currentPermission = await fcmService.checkPermission();
          setPermission(currentPermission);
          await handleTokenRetrieval(currentPermission);
          return;
        }

        // Initialize FCM service
        const initialized = await fcmService.initialize({
          onTokenReceived: newToken => {
            setToken(newToken);
            setError(null);
          },
          onMessageReceived: payload => {
            onMessageReceived?.(payload);
          },
          onError: err => {
            setError(err);
            // eslint-disable-next-line no-console -- error logging
            console.error('FCM error:', err);
          },
        });

        setIsInitialized(initialized);

        if (initialized) {
          const currentPermission = await fcmService.checkPermission();
          setPermission(currentPermission);
          await handleTokenRetrieval(currentPermission);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        // eslint-disable-next-line no-console -- error logging
        console.error('FCM initialization error:', error);
      }
    };

    initializeFCM();
  }, [onMessageReceived, handleTokenRetrieval]);

  // Update permission status when it changes
  useEffect(() => {
    if (!isInitialized) return;

    const checkPermission = async () => {
      // Skip if we're currently requesting permission
      if (isRequestingPermissionRef.current) {
        return;
      }

      const currentPermission = await fcmService.checkPermission();
      // Only update if permission actually changed
      if (currentPermission !== permission) {
        setPermission(currentPermission);
      }
    };

    // Check permission periodically (in case user changes it in browser settings)
    const interval = setInterval(checkPermission, 5000);

    return () => clearInterval(interval);
  }, [isInitialized, permission]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      isRequestingPermissionRef.current = true;

      const newToken = await fcmService.requestPermission();
      const currentPermission = await fcmService.checkPermission();

      // Update permission state and ref
      setPermission(currentPermission);

      if (newToken) {
        // Token already retrieved by requestPermission, just set it
        setToken(newToken);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      const currentPermission = await fcmService.checkPermission();
      setPermission(currentPermission);
    } finally {
      // Reset flag after a delay to allow permission state to settle
      // This ensures any permission change effects won't trigger handleTokenRetrieval
      setTimeout(() => {
        isRequestingPermissionRef.current = false;
      }, 5000);
    }
  }, []);

  return {
    isInitialized,
    isPermissionGranted: permission === 'granted',
    isPermissionDenied: permission === 'denied',
    isPermissionDefault: permission === 'default',
    token,
    requestPermission,
    error,
  };
};

export default useFCM;
