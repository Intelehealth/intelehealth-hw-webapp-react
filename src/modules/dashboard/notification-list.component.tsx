import { useNotificationContext } from '../../context/NotificationContext';

const NotificationList = ({ onClose }: { onClose?: () => void }) => {
  const { notifications, unreadCount } = useNotificationContext();

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white rounded-lg border border-[#ECEEFF] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-[16px] text-gray-800">
          Notifications{' '}
          {unreadCount > 0 && (
            <span className="text-sm text-red-500 font-medium">
              ({unreadCount} new)
            </span>
          )}
        </h3>
        <div className="flex items-center gap-3">
          {/* {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-[#2E1E91] hover:text-[#1e1466] font-medium cursor-pointer"
            >
              Clear all
            </button>
          )} */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Notification items */}
      <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            No notifications
          </div>
        )}
        {notifications.map(n => (
          <div
            key={n.id}
            // onClick={() => !n.isRead && markAsRead(String(n.id))}
            className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
              !n.isRead ? 'bg-[#F0EDFF]' : ''
            }`}
          >
            {/* Unread dot */}
            <div className="pt-1.5 w-3 flex-shrink-0">
              {!n.isRead && (
                <span className="block w-2.5 h-2.5 rounded-full bg-[#2E1E91]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm truncate ${
                  !n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'
                }`}
              >
                {n.title}
              </p>
              {n.description && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {n.description}
                </p>
              )}
            </div>

            {/* Time */}
            <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
              {formatTime(n.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationList;
