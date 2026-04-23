import { beforeEach, describe, expect, it, vi } from 'vitest';
import settingsService from '../../../modules/settings/settings.service';
import { OpenMRSApi } from '../../../services/openmrs';
import { storage } from '../../../utils/storage';

vi.mock('../../../services/openmrs', () => ({
  OpenMRSApi: {
    post: vi.fn(),
  },
}));

vi.mock('../../../utils/storage', () => ({
  storage: {
    getBasicAuthHeader: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  },
}));

const mockedPost = vi.mocked(OpenMRSApi.post);
const mockedStorage = vi.mocked(storage);

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('changePassword', () => {
    it('POSTs /password with payload and Authorization header from storage', async () => {
      mockedStorage.getBasicAuthHeader.mockReturnValue('Basic abc123');
      mockedPost.mockResolvedValue({});

      await settingsService.changePassword({
        oldPassword: 'Old1',
        newPassword: 'New1',
      });

      expect(mockedPost).toHaveBeenCalledWith(
        '/password',
        { oldPassword: 'Old1', newPassword: 'New1' },
        { headers: { Authorization: 'Basic abc123' } }
      );
    });

    it('omits Authorization header when storage has none', async () => {
      mockedStorage.getBasicAuthHeader.mockReturnValue(null);
      mockedPost.mockResolvedValue({});

      await settingsService.changePassword({
        oldPassword: 'Old1',
        newPassword: 'New1',
      });

      expect(mockedPost).toHaveBeenCalledWith(
        '/password',
        { oldPassword: 'Old1', newPassword: 'New1' },
        { headers: undefined }
      );
    });

    it('propagates errors from the API', async () => {
      mockedStorage.getBasicAuthHeader.mockReturnValue('Basic x');
      mockedPost.mockRejectedValue(new Error('401'));

      await expect(
        settingsService.changePassword({ oldPassword: 'a', newPassword: 'b' })
      ).rejects.toThrow('401');
    });
  });

  describe('notification settings', () => {
    it('persists to localStorage under "settings.notification"', async () => {
      const payload = { notificationAlerts: true, blackoutEnabled: false };
      const result = await settingsService.saveNotificationSettings(payload);

      expect(mockedStorage.set).toHaveBeenCalledWith(
        'settings.notification',
        JSON.stringify(payload)
      );
      expect(result).toEqual(payload);
    });

    it('returns null when nothing is persisted', () => {
      mockedStorage.get.mockReturnValue(null);
      expect(settingsService.getNotificationSettings()).toBeNull();
    });

    it('parses persisted JSON', () => {
      mockedStorage.get.mockReturnValue(
        JSON.stringify({ notificationAlerts: false, blackoutEnabled: true })
      );
      expect(settingsService.getNotificationSettings()).toEqual({
        notificationAlerts: false,
        blackoutEnabled: true,
      });
    });

    it('returns null when persisted value is malformed JSON', () => {
      mockedStorage.get.mockReturnValue('not-json');
      expect(settingsService.getNotificationSettings()).toBeNull();
    });
  });

  describe('language settings', () => {
    it('updateAppLanguage writes to storage and returns code', async () => {
      const code = await settingsService.updateAppLanguage('hi');
      expect(mockedStorage.set).toHaveBeenCalledWith('settings.language', 'hi');
      expect(code).toBe('hi');
    });

    it('getAppLanguage defaults to "en" when nothing stored', () => {
      mockedStorage.get.mockReturnValue(null);
      expect(settingsService.getAppLanguage()).toBe('en');
    });

    it('getAppLanguage returns stored value', () => {
      mockedStorage.get.mockReturnValue('ta');
      expect(settingsService.getAppLanguage()).toBe('ta');
    });

    it('resetAppLanguage sets "en" and returns it', async () => {
      const code = await settingsService.resetAppLanguage();
      expect(mockedStorage.set).toHaveBeenCalledWith('settings.language', 'en');
      expect(code).toBe('en');
    });
  });

  describe('updateProtocols', () => {
    it('persists payload and returns success', async () => {
      const payload = { serverUrl: 'https://x.y', licenseKey: 'KEY-1' };
      const result = await settingsService.updateProtocols(payload);

      expect(mockedStorage.set).toHaveBeenCalledWith(
        'settings.protocols',
        JSON.stringify(payload)
      );
      expect(result).toEqual({ success: true });
    });
  });
});
