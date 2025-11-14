import { type MessagePayload } from 'firebase/messaging';
import React, { useCallback, useEffect, useState } from 'react';
import './custom-notification.css';

interface CustomNotificationProps {
  notification: MessagePayload;
  onClose: () => void;
  onClick?: () => void;
  duration?: number;
}

const CustomNotification: React.FC<CustomNotificationProps> = ({
  notification,
  onClose,
  onClick,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const title = notification.notification?.title || 'New Notification';
  const body = notification.notification?.body || '';
  const icon = notification.notification?.icon || '/favicon.ico';
  const image = notification.notification?.image;

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match CSS transition duration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    handleClose();
  };

  return (
    <div
      className={`custom-notification ${isVisible ? 'visible' : ''} ${
        isExiting ? 'exiting' : ''
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="custom-notification-content">
        {image ? (
          <img
            src={image}
            alt="Notification"
            className="custom-notification-image"
          />
        ) : (
          <div className="custom-notification-icon">
            <img src={icon} alt="Notification icon" />
          </div>
        )}
        <div className="custom-notification-text">
          <h4 className="custom-notification-title">{title}</h4>
          {body && <p className="custom-notification-body">{body}</p>}
        </div>
        <button
          className="custom-notification-close"
          onClick={e => {
            e.stopPropagation();
            handleClose?.();
          }}
          aria-label="Close notification"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CustomNotification;
