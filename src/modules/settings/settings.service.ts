import { OpenMRSApi } from '../../services/openmrs';
import { storage } from '../../utils/storage';

const PASSWORD_ENDPOINT = '/password';
const DEFAULT_LANGUAGE = 'en';

const STORAGE_KEYS = {
  notification: 'settings.notification',
  language: 'settings.language',
  protocols: 'settings.protocols',
} as const;

interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface NotificationSettings {
  notificationAlerts: boolean;
  blackoutEnabled: boolean;
}

export interface ProtocolUpdatePayload {
  serverUrl: string;
  licenseKey: string;
}

const readJson = <T>(key: string): T | null => {
  const raw = storage.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const settingsService = {
  changePassword: (payload: ChangePasswordPayload) => {
    const authHeader = storage.getBasicAuthHeader();
    return OpenMRSApi.post(PASSWORD_ENDPOINT, payload, {
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });
  },

  saveNotificationSettings: async (payload: NotificationSettings) => {
    storage.set(STORAGE_KEYS.notification, JSON.stringify(payload));
    return payload;
  },

  getNotificationSettings: (): NotificationSettings | null =>
    readJson<NotificationSettings>(STORAGE_KEYS.notification),

  updateAppLanguage: async (languageCode: string) => {
    storage.set(STORAGE_KEYS.language, languageCode);
    return languageCode;
  },

  getAppLanguage: (): string =>
    storage.get(STORAGE_KEYS.language) || DEFAULT_LANGUAGE,

  resetAppLanguage: async () =>
    settingsService.updateAppLanguage(DEFAULT_LANGUAGE),

  updateProtocols: async (payload: ProtocolUpdatePayload) => {
    storage.set(STORAGE_KEYS.protocols, JSON.stringify(payload));
    return { success: true };
  },
};

export default settingsService;
