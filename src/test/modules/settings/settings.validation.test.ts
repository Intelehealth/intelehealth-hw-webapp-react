import { describe, expect, it } from 'vitest';
import {
  hasPasswordErrors,
  validatePasswordChange,
} from '../../../modules/settings/settings.validation';

const valid = {
  currentPassword: 'OldPass1',
  newPassword: 'NewPass1',
  confirmPassword: 'NewPass1',
};

describe('validatePasswordChange', () => {
  it('returns no errors for a valid payload', () => {
    expect(validatePasswordChange(valid)).toEqual({});
  });

  it('flags missing current password first', () => {
    const errors = validatePasswordChange({
      ...valid,
      currentPassword: '',
    });
    expect(errors.currentPassword).toBe('Enter current password');
    // Stops at first failure — other fields not populated.
    expect(errors.newPassword).toBeUndefined();
    expect(errors.confirmPassword).toBeUndefined();
  });

  it('flags missing new password', () => {
    const errors = validatePasswordChange({
      ...valid,
      newPassword: '',
    });
    expect(errors.newPassword).toBe('Enter new password');
  });

  it('flags missing confirm password', () => {
    const errors = validatePasswordChange({
      ...valid,
      confirmPassword: '',
    });
    expect(errors.confirmPassword).toBe('Confirm new password');
  });

  it('flags a weak new password', () => {
    const errors = validatePasswordChange({
      ...valid,
      newPassword: 'weak',
      confirmPassword: 'weak',
    });
    expect(errors.newPassword).toMatch(/Password must be at least 8 characters/);
  });

  it('flags mismatched new/confirm', () => {
    const errors = validatePasswordChange({
      ...valid,
      confirmPassword: 'Different1',
    });
    expect(errors.confirmPassword).toBe('Passwords do not match');
  });

  it('flags when new password equals current password', () => {
    const errors = validatePasswordChange({
      currentPassword: 'SamePass1',
      newPassword: 'SamePass1',
      confirmPassword: 'SamePass1',
    });
    expect(errors.newPassword).toBe('Old password and new password cannot be same');
    expect(errors.confirmPassword).toBe('Old password and new password cannot be same');
  });

  it('treats whitespace-only fields as empty', () => {
    const errors = validatePasswordChange({
      currentPassword: '   ',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    });
    expect(errors.currentPassword).toBe('Enter current password');
  });
});

describe('hasPasswordErrors', () => {
  it('returns false for empty error object', () => {
    expect(hasPasswordErrors({})).toBe(false);
  });

  it('returns false when all values are undefined', () => {
    expect(
      hasPasswordErrors({
        currentPassword: undefined,
        newPassword: undefined,
        confirmPassword: undefined,
      })
    ).toBe(false);
  });

  it('returns true when any field has a message', () => {
    expect(hasPasswordErrors({ currentPassword: 'required' })).toBe(true);
    expect(hasPasswordErrors({ newPassword: 'weak' })).toBe(true);
  });
});
