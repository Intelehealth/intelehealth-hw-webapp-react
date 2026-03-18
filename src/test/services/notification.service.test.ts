import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../services/mindmap', () => ({
  MindmapPortalApi: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

import notificationService from '../../services/notification.service';

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: {} });
    mockPut.mockResolvedValue({ data: {} });
    mockDelete.mockResolvedValue({ data: {} });
  });

  describe('getNotificationStatus', () => {
    it('should call GET with correct URL', async () => {
      await notificationService.getNotificationStatus('uuid-123');
      expect(mockGet).toHaveBeenCalledWith(
        '/mindmap/getNotificationStatus/uuid-123',
        expect.objectContaining({ headers: { loader: false } })
      );
    });
  });

  describe('toggleNotificationStatus', () => {
    it('should call PUT with correct URL', async () => {
      await notificationService.toggleNotificationStatus('uuid-123');
      expect(mockPut).toHaveBeenCalledWith(
        '/mindmap/toggleNotificationStatus/uuid-123',
        {},
        expect.objectContaining({ headers: { loader: false } })
      );
    });
  });

  describe('registerFCMToken', () => {
    it('should call PUT with user_uuid and token', async () => {
      await notificationService.registerFCMToken('uuid-123', 'fcm-token');
      expect(mockPut).toHaveBeenCalledWith(
        '/mindmap/user_settings',
        { user_uuid: 'uuid-123', data: { device_reg_token: 'fcm-token' } },
        expect.objectContaining({ headers: { loader: false } })
      );
    });
  });

  describe('clearFCMToken', () => {
    it('should call PUT with null token', async () => {
      await notificationService.clearFCMToken('uuid-123');
      expect(mockPut).toHaveBeenCalledWith(
        '/mindmap/user_settings',
        { user_uuid: 'uuid-123', data: { device_reg_token: null } },
        expect.objectContaining({ headers: { loader: false } })
      );
    });
  });

  describe('getUserSettings', () => {
    it('should call GET with correct URL', async () => {
      await notificationService.getUserSettings('uuid-123');
      expect(mockGet).toHaveBeenCalledWith(
        '/mindmap/user_settings/uuid-123',
        expect.objectContaining({ headers: { loader: false } })
      );
    });
  });

  describe('setUserSettings', () => {
    it('should call PUT with user_uuid and data', async () => {
      await notificationService.setUserSettings('uuid-123', { locale: 'en' });
      expect(mockPut).toHaveBeenCalledWith(
        '/mindmap/user_settings',
        { user_uuid: 'uuid-123', data: { locale: 'en' } },
        expect.objectContaining({ headers: { loader: false } })
      );
    });
  });

  describe('snoozeNotification', () => {
    it('should call PUT with snooze duration', async () => {
      await notificationService.snoozeNotification('uuid-123', '1h');
      expect(mockPut).toHaveBeenCalledWith(
        '/mindmap/snooze_notification/uuid-123',
        { snooze_for: '1h' },
        expect.objectContaining({ headers: { loader: false } })
      );
    });
  });

  describe('listNotifications', () => {
    it('should call GET with default pagination', async () => {
      await notificationService.listNotifications('user-123');
      expect(mockGet).toHaveBeenCalledWith(
        '/mindmap/notifications?userId=user-123&page=1&size=10',
        expect.objectContaining({ headers: { loader: false } })
      );
    });

    it('should call GET with custom pagination', async () => {
      await notificationService.listNotifications('user-123', 2, 20);
      expect(mockGet).toHaveBeenCalledWith(
        '/mindmap/notifications?userId=user-123&page=2&size=20',
        expect.objectContaining({ headers: { loader: false } })
      );
    });
  });

  describe('acknowledgeNotification', () => {
    it('should call PUT with notification ID', async () => {
      await notificationService.acknowledgeNotification('notif-456');
      expect(mockPut).toHaveBeenCalledWith(
        '/mindmap/acknowledge/notif-456',
        {},
        expect.objectContaining({ headers: { loader: false } })
      );
    });
  });

  describe('clearAllNotifications', () => {
    it('should call DELETE with user ID', async () => {
      await notificationService.clearAllNotifications('user-123');
      expect(mockDelete).toHaveBeenCalledWith(
        '/mindmap/clearAll/user-123',
        expect.objectContaining({ headers: { loader: false } })
      );
    });
  });
});
