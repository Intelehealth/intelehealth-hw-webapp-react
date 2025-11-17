import { type MessagePayload } from 'firebase/messaging';
import React, { useEffect, useState } from 'react';
import useFCM from '../../hooks/useFCM';
import NotificationEnabledModal from './notification-enabled-modal.component';
import NotificationPermissionModal from './notification-permission-modal.component';

interface NotificationManagerProps {
  /**
   * Whether to automatically request permission on mount
   * @default false
   */
  autoRequest?: boolean;
  /**
   * Delay in milliseconds before showing permission modal (if autoRequest is true)
   * @default 2000
   */
  requestDelay?: number;
  /**
   * Callback when a notification is received
   */
  onNotificationReceived?: (payload: MessagePayload) => void;
  /**
   * Callback when permission is granted
   */
  onPermissionGranted?: (token: string) => void;
  /**
   * Callback when permission is denied
   */
  onPermissionDenied?: () => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  autoRequest = false,
  requestDelay = 2000,
  onNotificationReceived,
  onPermissionGranted,
  onPermissionDenied,
}) => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showEnabledModal, setShowEnabledModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);

  const {
    isInitialized,
    isPermissionGranted,
    isPermissionDenied,
    isPermissionDefault,
    token,
    requestPermission,
    error,
  } = useFCM(payload => {
    // Show custom notification instead of browser default
    onNotificationReceived?.(payload);
  });

  // Handle permission status changes
  useEffect(() => {
    if (!isInitialized || hasCheckedPermission) return;

    // If permission is already granted, show enabled modal briefly
    if (isPermissionGranted && token) {
      setHasCheckedPermission(true);
      if (autoRequest) {
        setShowEnabledModal(true);
        onPermissionGranted?.(token);
      }
      return;
    }

    // If permission is denied, don't show modal
    if (isPermissionDenied) {
      setHasCheckedPermission(true);
      return;
    }

    // If permission is default and autoRequest is enabled, show modal after delay
    if (isPermissionDefault && autoRequest && !hasCheckedPermission) {
      const timer = setTimeout(() => {
        setShowPermissionModal(true);
        setHasCheckedPermission(true);
      }, requestDelay);

      return () => clearTimeout(timer);
    }

    setHasCheckedPermission(true);
  }, [
    isInitialized,
    isPermissionGranted,
    isPermissionDenied,
    isPermissionDefault,
    token,
    autoRequest,
    requestDelay,
    hasCheckedPermission,
    onPermissionGranted,
  ]);

  // Handle permission request
  const handleAllow = async () => {
    setIsRequesting(true);
    try {
      await requestPermission();
      setShowPermissionModal(false);
      if (token) {
        setShowEnabledModal(true);
        onPermissionGranted?.(token);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      // eslint-disable-next-line no-console -- error logging
      console.error('Permission request error:', error);
      onPermissionDenied?.();
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle permission denial
  const handleDeny = () => {
    setShowPermissionModal(false);
    onPermissionDenied?.();
  };

  // Handle enabled modal close
  const handleEnabledModalClose = () => {
    setShowEnabledModal(false);
  };

  // Don't render anything if not initialized or if there's an error
  if (!isInitialized || error) {
    return null;
  }

  return (
    <>
      <NotificationPermissionModal
        isOpen={showPermissionModal}
        onAllow={handleAllow}
        onDeny={handleDeny}
        isLoading={isRequesting}
      />
      <NotificationEnabledModal
        isOpen={showEnabledModal}
        onClose={handleEnabledModalClose}
      />
    </>
  );
};

export default NotificationManager;
