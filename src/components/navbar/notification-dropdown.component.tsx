import { useEffect, useRef } from 'react';
import { useNotificationContext } from '../../context/NotificationContext';

const NotificationDropdown = ({ onClose }: { onClose: () => void }) => {
  const { unreadCount } = useNotificationContext();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // const formatTime = (dateStr: string) => {
  //   const date = new Date(dateStr);
  //   const now = new Date();
  //   const diffMs = now.getTime() - date.getTime();
  //   const diffMins = Math.floor(diffMs / 60000);
  //   if (diffMins < 1) return 'Just now';
  //   if (diffMins < 60) return `${diffMins}m ago`;
  //   const diffHours = Math.floor(diffMins / 60);
  //   if (diffHours < 24) return `${diffHours}h ago`;
  //   const diffDays = Math.floor(diffHours / 24);
  //   return `${diffDays}d ago`;
  // };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800">
          Notifications{' '}
          {unreadCount > 0 && (
            <span className="text-sm text-red-500">({unreadCount})</span>
          )}
        </h3>
        {/* {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        )} */}
      </div>

      <div className="max-h-80 overflow-y-auto">
        <div className="px-4 py-8 text-center text-gray-400 text-sm">
          No notifications
        </div>
        {/* {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markAsRead(String(n.id))}
            className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
              !n.isRead ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              {!n.isRead && (
                <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
              <div className={`flex-1 ${n.isRead ? 'ml-4' : ''}`}>
                <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                  {n.title}
                </p>
                {n.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
              </div>
            </div>
          </div>
        ))} */}
      </div>
    </div>
  );
};

export default NotificationDropdown;
