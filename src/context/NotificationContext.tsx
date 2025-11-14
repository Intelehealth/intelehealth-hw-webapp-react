import { type MessagePayload } from 'firebase/messaging';
import React, { createContext, useCallback, useContext, useState } from 'react';
import CustomNotification from '../components/notifications/custom-notification.component';

interface NotificationItem {
  id: string;
  payload: MessagePayload;
  timestamp: number;
}

interface NotificationContextType {
  showNotification: (payload: MessagePayload) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showNotification = useCallback((payload: MessagePayload) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications(prev => {
      const newNotifications = [
        ...prev,
        { id, payload, timestamp: Date.now() },
      ];
      return newNotifications;
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleNotificationClick = useCallback((payload: MessagePayload) => {
    // Handle click action if provided
    if (payload.data?.click_action) {
      window.open(payload.data.click_action, '_blank');
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        clearNotifications: () => setNotifications([]),
      }}
    >
      {children}
      <div className="custom-notifications-container">
        {notifications.map(notification => (
          <CustomNotification
            key={notification.id}
            notification={notification.payload}
            onClose={() => removeNotification(notification.id)}
            onClick={() => handleNotificationClick(notification.payload)}
            duration={5000}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
