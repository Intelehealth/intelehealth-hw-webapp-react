import { isValidPassword } from './settings.helpers';

export interface PasswordChangeValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordChangeErrors = Partial<
  Record<keyof PasswordChangeValues, string>
>;

// Error messages — kept in sync with Android strings.
const PASSWORD_ERRORS = {
  currentRequired: 'Enter current password',
  newRequired: 'Enter new password',
  confirmRequired: 'Confirm new password',
  invalidPassword:
    'Password must be at least 8 characters and include uppercase, lowercase, and a number (no spaces).',
  passwordMismatch: 'Passwords do not match',
  sameAsOld: 'Old password and new password cannot be same',
} as const;

/**
 * Validate password-change form. Order mirrors the Android
 * areInputFieldsValid() so the first-failing rule is returned.
 */
export const validatePasswordChange = (
  values: PasswordChangeValues
): PasswordChangeErrors => {
  const errors: PasswordChangeErrors = {};
  const current = values.currentPassword?.trim() ?? '';
  const next = values.newPassword?.trim() ?? '';
  const confirm = values.confirmPassword?.trim() ?? '';

  if (!current) {
    errors.currentPassword = PASSWORD_ERRORS.currentRequired;
    return errors;
  }
  if (!next) {
    errors.newPassword = PASSWORD_ERRORS.newRequired;
    return errors;
  }
  if (!confirm) {
    errors.confirmPassword = PASSWORD_ERRORS.confirmRequired;
    return errors;
  }
  if (!isValidPassword(next)) {
    errors.newPassword = PASSWORD_ERRORS.invalidPassword;
    return errors;
  }
  if (next !== confirm) {
    errors.confirmPassword = PASSWORD_ERRORS.passwordMismatch;
    return errors;
  }
  if (current === next) {
    errors.newPassword = PASSWORD_ERRORS.sameAsOld;
    errors.confirmPassword = PASSWORD_ERRORS.sameAsOld;
    return errors;
  }

  return errors;
};

export const hasPasswordErrors = (errors: PasswordChangeErrors): boolean =>
  Object.values(errors).some(Boolean);
