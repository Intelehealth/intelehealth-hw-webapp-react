import { MindmapPortalApi } from './mindmap';

interface ApiResponse {
  success: boolean;
  data?: unknown;
  message?: string;
}

interface NotificationListResponse {
  total: number;
  rows: {
    id: number;
    type: string;
    user_uuid: string;
    title: string;
    description: string;
    payload: unknown;
    isRead: boolean | number;
    createdAt: string;
    updatedAt: string;
  }[];
  totalPages: number;
  currentPage: number;
}

interface NotificationStatusResponse {
  success: boolean;
  data?: {
    notification_status: number | boolean;
    snooze_till?: string | number;
  };
}

interface UserSettingsResponse {
  message: string;
  data: {
    user_uuid: string;
    device_reg_token: string | null;
    notification: boolean | number;
    snooze_till: string;
    locale: string;
  };
}

const config = { headers: { loader: false } };

const notificationService = {
  // Notification Status
  getNotificationStatus: (uuid: string) =>
    MindmapPortalApi.get<NotificationStatusResponse>(
      `/mindmap/getNotificationStatus/${uuid}`,
      config
    ),

  toggleNotificationStatus: (uuid: string) =>
    MindmapPortalApi.put<NotificationStatusResponse>(
      `/mindmap/toggleNotificationStatus/${uuid}`,
      {},
      config
    ),

  // FCM Token
  registerFCMToken: (uuid: string, token: string) =>
    MindmapPortalApi.put<ApiResponse>(
      '/mindmap/user_settings',
      {
        user_uuid: uuid,
        data: { device_reg_token: token },
      },
      config
    ),

  clearFCMToken: (uuid: string) =>
    MindmapPortalApi.put<ApiResponse>(
      '/mindmap/user_settings',
      {
        user_uuid: uuid,
        data: { device_reg_token: null },
      },
      config
    ),

  // User Settings
  getUserSettings: (uuid: string) =>
    MindmapPortalApi.get<UserSettingsResponse>(
      `/mindmap/user_settings/${uuid}`,
      config
    ),

  setUserSettings: (uuid: string, data: Record<string, unknown>) =>
    MindmapPortalApi.put<ApiResponse>(
      '/mindmap/user_settings',
      { user_uuid: uuid, data },
      config
    ),

  // Snooze
  snoozeNotification: (uuid: string, snoozeFor: '30m' | '1h' | '2h' | 'off') =>
    MindmapPortalApi.put<ApiResponse>(
      `/mindmap/snooze_notification/${uuid}`,
      { snooze_for: snoozeFor },
      config
    ),

  // Notifications CRUD
  listNotifications: (userId: string, page = 1, size = 10) =>
    MindmapPortalApi.get<NotificationListResponse>(
      `/mindmap/notifications?userId=${userId}&page=${page}&size=${size}`,
      config
    ),

  acknowledgeNotification: (notificationId: string) =>
    MindmapPortalApi.put<ApiResponse>(
      `/mindmap/acknowledge/${notificationId}`,
      {},
      config
    ),

  clearAllNotifications: (userId: string) =>
    MindmapPortalApi.delete<ApiResponse>(`/mindmap/clearAll/${userId}`, config),
};

export default notificationService;
