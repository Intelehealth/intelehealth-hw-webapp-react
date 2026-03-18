import { type MessagePayload } from 'firebase/messaging';
import { useCallback, useEffect, useRef, useState } from 'react';
import fcmService from '../services/fcm.service';

interface UseFCMReturn {
  isInitialized: boolean;
  isPermissionGranted: boolean;
  isPermissionDenied: boolean;
  isPermissionDefault: boolean;
  token: string | null;
  requestPermission: () => Promise<void>;
  error: Error | null;
}

const getPermission = (): NotificationPermission =>
  typeof Notification !== 'undefined' ? Notification.permission : 'default';

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

  const isRequestingPermissionRef = useRef(false);
  const onMessageRef = useRef(onMessageReceived);
  onMessageRef.current = onMessageReceived;

  // Initialize FCM on mount
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        if (fcmService.isInitialized()) {
          setIsInitialized(true);
          setPermission(getPermission());
          setToken(fcmService.getToken());
          return;
        }

        const initialized = await fcmService.initialize({
          onMessageReceived: (payload: MessagePayload) => {
            onMessageRef.current?.(payload);
          },
        });

        setIsInitialized(initialized);

        if (initialized) {
          setPermission(getPermission());
          const existing = fcmService.getToken();
          if (existing) {
            setToken(existing);
          } else if (getPermission() === 'granted') {
            const newToken = await fcmService.requestPermission();
            setToken(newToken);
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      }
    };

    initializeFCM();
  }, []);

  // Periodically sync permission status
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      if (isRequestingPermissionRef.current) return;

      const current = getPermission();
      setPermission(prev => (prev !== current ? current : prev));
    }, 5000);

    return () => clearInterval(interval);
  }, [isInitialized]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      isRequestingPermissionRef.current = true;

      const newToken = await fcmService.requestPermission();
      setPermission(getPermission());

      if (newToken) {
        setToken(newToken);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setPermission(getPermission());
    } finally {
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
