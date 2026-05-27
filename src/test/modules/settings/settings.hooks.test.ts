import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useChangePassword,
  useLanguageSettings,
  useNotificationSettings,
} from '../../../modules/settings/settings.hooks';
import settingsService from '../../../modules/settings/settings.service';
import { showToast } from '../../../services/toast';

/* ---------------- Mocks ---------------- */

const mockedChangeLanguage = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../i18n', () => ({
  changeLanguage: (...args: unknown[]) => mockedChangeLanguage(...args),
}));

vi.mock('../../../services/toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../../../modules/settings/settings.service', () => ({
  default: {
    changePassword: vi.fn(),
    saveNotificationSettings: vi.fn(),
    getNotificationSettings: vi.fn(() => null),
    updateAppLanguage: vi.fn(),
    getAppLanguage: vi.fn(() => 'en'),
    resetAppLanguage: vi.fn(),
    updateProtocols: vi.fn(),
  },
}));

const mockedIsEnabled = { value: true };
const mockedToggleNotifications = vi.fn();
vi.mock('../../../context/NotificationContext', () => ({
  useNotificationContext: () => ({
    isEnabled: mockedIsEnabled.value,
    toggleNotifications: mockedToggleNotifications,
  }),
}));

// Keep randomString deterministic so assertions are stable.
vi.mock('../../../modules/settings/settings.helpers', async orig => {
  const actual = await orig<
    typeof import('../../../modules/settings/settings.helpers')
  >();
  return {
    ...actual,
    randomString: vi.fn(() => 'Genr8ted1'),
  };
});

const mockedService = vi.mocked(settingsService);
const mockedToast = vi.mocked(showToast);

beforeEach(() => {
  vi.clearAllMocks();
  mockedIsEnabled.value = true;
  mockedService.getAppLanguage.mockReturnValue('en');
  mockedService.getNotificationSettings.mockReturnValue(null);
});

/* ---------------- useChangePassword ---------------- */

describe('useChangePassword', () => {
  it('updates individual field values', () => {
    const { result } = renderHook(() => useChangePassword());
    act(() => result.current.setCurrentPassword('OldPass1'));
    expect(result.current.values.currentPassword).toBe('OldPass1');
  });

  it('clears a field-level error when that field is edited', () => {
    const { result } = renderHook(() => useChangePassword());
    act(() => {
      // Trigger validation so errors populate.
      result.current.handleSave();
    });
    expect(result.current.errors.currentPassword).toBeTruthy();

    act(() => result.current.setCurrentPassword('OldPass1'));
    expect(result.current.errors.currentPassword).toBeUndefined();
  });

  it('does not mutate errors object when editing a field that has no error', () => {
    const { result } = renderHook(() => useChangePassword());
    // Initially there are no errors, so editing any field should leave errors unchanged
    act(() => result.current.setNewPassword('SomePass'));
    expect(result.current.errors).toEqual({});
    act(() => result.current.setConfirmPassword('SomePass'));
    expect(result.current.errors).toEqual({});
  });

  it('handleGenerate fills newPassword and confirmPassword with the generated value', () => {
    const { result } = renderHook(() => useChangePassword());
    act(() => result.current.handleGenerate());
    expect(result.current.values.newPassword).toBe('Genr8ted1');
    expect(result.current.values.confirmPassword).toBe('Genr8ted1');
  });

  it('shows error toast and returns false when validation fails', async () => {
    const { result } = renderHook(() => useChangePassword());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.handleSave();
    });
    expect(ok).toBe(false);
    expect(mockedToast).toHaveBeenCalledWith(
      'Error',
      'Enter current password',
      'error'
    );
    expect(mockedService.changePassword).not.toHaveBeenCalled();
  });

  it('calls changePassword and shows success toast on valid submit', async () => {
    mockedService.changePassword.mockResolvedValue({});
    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setCurrentPassword('OldPass1');
      result.current.setNewPassword('NewPass1');
      result.current.setConfirmPassword('NewPass1');
    });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.handleSave();
    });

    expect(ok).toBe(true);
    expect(mockedService.changePassword).toHaveBeenCalledWith({
      oldPassword: 'OldPass1',
      newPassword: 'NewPass1',
    });
    expect(mockedToast).toHaveBeenCalledWith(
      'Success',
      'Password changed successfully',
      'success',
      undefined
    );
    // Form is reset on success.
    expect(result.current.values.currentPassword).toBe('');
    expect(result.current.values.newPassword).toBe('');
    expect(result.current.values.confirmPassword).toBe('');
  });

  it('shows error toast and returns false when API rejects', async () => {
    mockedService.changePassword.mockRejectedValue({
      response: { data: { error: { message: 'server boom' } } },
    });
    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setCurrentPassword('OldPass1');
      result.current.setNewPassword('NewPass1');
      result.current.setConfirmPassword('NewPass1');
    });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.handleSave();
    });

    expect(ok).toBe(false);
    expect(mockedToast).toHaveBeenCalledWith('Error', 'server boom', 'error');
  });

  it('returns false and uses fallback message when API rejects with non-Axios error', async () => {
    mockedService.changePassword.mockRejectedValue(new Error('network failure'));
    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setCurrentPassword('OldPass1');
      result.current.setNewPassword('NewPass1');
      result.current.setConfirmPassword('NewPass1');
    });

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.handleSave();
    });

    expect(ok).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(mockedToast).toHaveBeenCalledWith(
      'Error',
      'Failed to change password',
      'error'
    );
  });

  it('sets isSaving=true during API call and resets in finally block', async () => {
    let resolveSave: (v: unknown) => void = () => {};
    mockedService.changePassword.mockImplementation(
      () => new Promise(r => { resolveSave = r; })
    );
    const { result } = renderHook(() => useChangePassword());

    act(() => {
      result.current.setCurrentPassword('OldPass1');
      result.current.setNewPassword('NewPass1');
      result.current.setConfirmPassword('NewPass1');
    });

    // Start the save without awaiting
    let savePromise: Promise<boolean>;
    act(() => {
      savePromise = result.current.handleSave();
    });

    // isSaving should be true while waiting
    expect(result.current.isSaving).toBe(true);

    // Resolve the API call
    await act(async () => {
      resolveSave({});
      await savePromise!;
    });

    // Finally block resets isSaving
    expect(result.current.isSaving).toBe(false);
  });

});

/* ---------------- useNotificationSettings ---------------- */

describe('useNotificationSettings', () => {
  it('reflects NotificationContext isEnabled and initial blackout from storage', () => {
    mockedService.getNotificationSettings.mockReturnValue({
      notificationAlerts: true,
      blackoutEnabled: true,
    });
    const { result } = renderHook(() => useNotificationSettings());
    expect(result.current.notificationAlerts).toBe(true);
    expect(result.current.blackoutEnabled).toBe(true);
  });

  it('toggleBlackout flips local state', () => {
    const { result } = renderHook(() => useNotificationSettings());
    expect(result.current.blackoutEnabled).toBe(false);
    act(() => result.current.toggleBlackout());
    expect(result.current.blackoutEnabled).toBe(true);
  });

  it('toggleNotificationAlerts delegates to NotificationContext', () => {
    const { result } = renderHook(() => useNotificationSettings());
    act(() => {
      result.current.toggleNotificationAlerts();
    });
    expect(mockedToggleNotifications).toHaveBeenCalled();
  });

  it('handleSave persists settings and shows success toast', async () => {
    mockedService.saveNotificationSettings.mockResolvedValue({
      notificationAlerts: true,
      blackoutEnabled: false,
    });
    const { result } = renderHook(() => useNotificationSettings());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockedService.saveNotificationSettings).toHaveBeenCalledWith({
      notificationAlerts: true,
      blackoutEnabled: false,
    });
    expect(mockedToast).toHaveBeenCalledWith(
      'Success',
      'Notification settings saved successfully',
      'success',
      undefined
    );
  });

  it('shows error toast when saving fails', async () => {
    mockedService.saveNotificationSettings.mockRejectedValue({
      response: { data: { message: 'save failed' } },
    });
    const { result } = renderHook(() => useNotificationSettings());

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockedToast).toHaveBeenCalledWith('Error', 'save failed', 'error');
  });
});

/* ---------------- useLanguageSettings ---------------- */

describe('useLanguageSettings', () => {
  it('initialises from settingsService.getAppLanguage', () => {
    mockedService.getAppLanguage.mockReturnValue('hi');
    const { result } = renderHook(() => useLanguageSettings());
    expect(result.current.language).toBe('hi');
  });

  it('setLanguage updates state and shows toast with language label', async () => {
    mockedService.updateAppLanguage.mockResolvedValue('hi');
    const { result } = renderHook(() => useLanguageSettings());

    await act(async () => {
      await result.current.setLanguage('hi', 'Hindi');
    });

    await waitFor(() => expect(result.current.language).toBe('hi'));
    expect(mockedService.updateAppLanguage).toHaveBeenCalledWith('hi');
    expect(mockedChangeLanguage).toHaveBeenCalledWith('hi');
    expect(mockedToast).toHaveBeenCalledWith(
      'Success',
      'Language successfully changed to Hindi!',
      'success',
      expect.objectContaining({ position: 'top-right', closeButton: false })
    );
  });

  it('setLanguage falls back to code when label not supplied', async () => {
    mockedService.updateAppLanguage.mockResolvedValue('ta');
    const { result } = renderHook(() => useLanguageSettings());

    await act(async () => {
      await result.current.setLanguage('ta');
    });

    expect(mockedToast).toHaveBeenCalledWith(
      'Success',
      'Language successfully changed to ta!',
      'success',
      expect.anything()
    );
  });

  it('setLanguage shows error toast on API failure', async () => {
    mockedService.updateAppLanguage.mockRejectedValue(new Error('api-err'));
    const { result } = renderHook(() => useLanguageSettings());

    await act(async () => {
      await result.current.setLanguage('hi', 'Hindi');
    });

    expect(mockedToast).toHaveBeenCalledWith(
      'Error',
      'Failed to update language',
      'error'
    );
  });

  it('handleReset persists "en" and shows success toast', async () => {
    mockedService.resetAppLanguage.mockResolvedValue('en');
    const { result } = renderHook(() => useLanguageSettings());

    await act(async () => {
      await result.current.handleReset();
    });

    expect(result.current.language).toBe('en');
    expect(mockedChangeLanguage).toHaveBeenCalledWith('en');
    expect(mockedToast).toHaveBeenCalledWith(
      'Success',
      'Language successfully changed to English!',
      'success',
      expect.anything()
    );
  });

  it('handleReset shows error toast on failure', async () => {
    mockedService.resetAppLanguage.mockRejectedValue(new Error('reset-err'));
    const { result } = renderHook(() => useLanguageSettings());

    await act(async () => {
      await result.current.handleReset();
    });

    expect(mockedToast).toHaveBeenCalledWith(
      'Error',
      'Failed to reset language',
      'error'
    );
  });

  it('handleUpdateProtocols toggles isUpdating and shows success toast', async () => {
    mockedService.updateProtocols.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useLanguageSettings());

    await act(async () => {
      await result.current.handleUpdateProtocols({
        serverUrl: 'https://x.y',
        licenseKey: 'KEY-1',
      });
    });

    expect(mockedService.updateProtocols).toHaveBeenCalledWith({
      serverUrl: 'https://x.y',
      licenseKey: 'KEY-1',
    });
    expect(mockedToast).toHaveBeenCalledWith(
      'Success',
      'Protocols have been successfully changed!',
      'success',
      expect.anything()
    );
    expect(result.current.isUpdating).toBe(false);
  });

  it('handleUpdateProtocols shows error toast on failure', async () => {
    mockedService.updateProtocols.mockRejectedValue(new Error('proto-err'));
    const { result } = renderHook(() => useLanguageSettings());

    await act(async () => {
      await result.current.handleUpdateProtocols({
        serverUrl: 'x',
        licenseKey: 'y',
      });
    });

    expect(mockedToast).toHaveBeenCalledWith(
      'Error',
      'Failed to update protocols',
      'error'
    );
    expect(result.current.isUpdating).toBe(false);
  });
});

