import { useCallback, useState } from 'react';
import { useNotificationContext } from '../../context/NotificationContext';
import { changeLanguage } from '../../i18n';
import { showToast, type ToastOptions } from '../../services/toast';
import {
  DEFAULT_GENERATED_PASSWORD_LENGTH,
  getApiErrorMessage,
  randomString,
} from './settings.helpers';
import settingsService, {
  type ProtocolUpdatePayload,
} from './settings.service';
import {
  hasPasswordErrors,
  validatePasswordChange,
  type PasswordChangeErrors,
  type PasswordChangeValues,
} from './settings.validation';

export const SETTINGS_TOAST: ToastOptions = {
  position: 'top-right',
  closeButton: false,
  hideProgressBar: true,
  style: { marginTop: '48px' },
};

const EMPTY_PASSWORD: PasswordChangeValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const toastError = (error: unknown, fallback: string) =>
  showToast('Error', getApiErrorMessage(error, fallback), 'error');

const toastOk = (message: string, opts?: ToastOptions) =>
  showToast('Success', message, 'success', opts);

interface UseChangePasswordReturn {
  values: PasswordChangeValues;
  errors: PasswordChangeErrors;
  isSaving: boolean;
  setCurrentPassword: (v: string) => void;
  setNewPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  handleGenerate: () => void;
  handleSave: () => Promise<boolean>;
}

export const useChangePassword = (): UseChangePasswordReturn => {
  const [values, setValues] = useState<PasswordChangeValues>(EMPTY_PASSWORD);
  const [errors, setErrors] = useState<PasswordChangeErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const setField = (key: keyof PasswordChangeValues) => (v: string) => {
    setValues(prev => ({ ...prev, [key]: v }));
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleGenerate = useCallback(() => {
    const g = randomString(DEFAULT_GENERATED_PASSWORD_LENGTH);
    setValues(prev => ({ ...prev, newPassword: g, confirmPassword: g }));
    setErrors(prev => ({
      ...prev,
      newPassword: undefined,
      confirmPassword: undefined,
    }));
  }, []);

  const handleSave = useCallback(async (): Promise<boolean> => {
    const next = validatePasswordChange(values);
    setErrors(next);
    if (hasPasswordErrors(next)) {
      const first = Object.values(next).find(Boolean);
      if (first) showToast('Error', first, 'error');
      return false;
    }
    try {
      setIsSaving(true);
      await settingsService.changePassword({
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toastOk('Password changed successfully');
      setValues(EMPTY_PASSWORD);
      setErrors({});
      setIsSaving(false);
      return true;
    } catch (error) {
      toastError(error, 'Failed to change password');
      setIsSaving(false);
      return false;
    }
  }, [values]);

  return {
    values,
    errors,
    isSaving,
    setCurrentPassword: setField('currentPassword'),
    setNewPassword: setField('newPassword'),
    setConfirmPassword: setField('confirmPassword'),
    handleGenerate,
    handleSave,
  };
};

interface UseNotificationSettingsReturn {
  notificationAlerts: boolean;
  blackoutEnabled: boolean;
  isSaving: boolean;
  toggleNotificationAlerts: () => Promise<void>;
  toggleBlackout: () => void;
  handleSave: () => Promise<void>;
}

export const useNotificationSettings = (): UseNotificationSettingsReturn => {
  const { isEnabled, toggleNotifications } = useNotificationContext();
  const [blackoutEnabled, setBlackoutEnabled] = useState(
    () => settingsService.getNotificationSettings()?.blackoutEnabled ?? false
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      await settingsService.saveNotificationSettings({
        notificationAlerts: isEnabled,
        blackoutEnabled,
      });
      toastOk('Notification settings saved successfully');
    } catch (error) {
      toastError(error, 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [isEnabled, blackoutEnabled]);

  return {
    notificationAlerts: isEnabled,
    blackoutEnabled,
    isSaving,
    toggleNotificationAlerts: toggleNotifications,
    toggleBlackout: () => setBlackoutEnabled(prev => !prev),
    handleSave,
  };
};

interface UseLanguageSettingsReturn {
  language: string;
  isUpdating: boolean;
  setLanguage: (code: string, label?: string) => void;
  handleReset: () => Promise<void>;
  handleUpdateProtocols: (p: ProtocolUpdatePayload) => Promise<void>;
}

export const useLanguageSettings = (): UseLanguageSettingsReturn => {
  const [language, setLanguageState] = useState(
    settingsService.getAppLanguage()
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const setLanguage = useCallback(async (code: string, label?: string) => {
    try {
      await settingsService.updateAppLanguage(code);
      await changeLanguage(code);
      setLanguageState(code);
      toastOk(
        `Language successfully changed to ${label ?? code}!`,
        SETTINGS_TOAST
      );
    } catch (error) {
      toastError(error, 'Failed to update language');
    }
  }, []);

  const handleReset = useCallback(async () => {
    try {
      const code = await settingsService.resetAppLanguage();
      await changeLanguage(code);
      setLanguageState(code);
      toastOk('Language successfully changed to English!', SETTINGS_TOAST);
    } catch (error) {
      toastError(error, 'Failed to reset language');
    }
  }, []);

  const handleUpdateProtocols = useCallback(
    async (payload: ProtocolUpdatePayload) => {
      try {
        setIsUpdating(true);
        await settingsService.updateProtocols(payload);
        toastOk('Protocols have been successfully changed!', SETTINGS_TOAST);
      } catch (error) {
        toastError(error, 'Failed to update protocols');
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  return {
    language,
    isUpdating,
    setLanguage,
    handleReset,
    handleUpdateProtocols,
  };
};
