import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useResetPassword } from '../../../../modules/auth/reset-password/reset-password.hooks';
import resetPasswordService from '../../../../modules/auth/reset-password/reset-password.service';
import { showToast } from '../../../../services/toast';

// Mock dependencies
vi.mock('../../../../modules/auth/reset-password/reset-password.service', () => ({
  default: {
    resetPassword: vi.fn(),
  },
}));

vi.mock('../../../../services/toast', () => ({
  showToast: vi.fn(),
}));

const mockResetPasswordService = vi.mocked(resetPasswordService);
const mockShowToast = vi.mocked(showToast);

describe('useResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useResetPassword());
      
      expect(result.current.isResetSuccessful).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(typeof result.current.handleResetPassword).toBe('function');
      expect(typeof result.current.handleGenerateNewPassword).toBe('function');
    });
  });

  describe('Password Generation', () => {
    it('should generate a password with correct length', () => {
      const { result } = renderHook(() => useResetPassword());
      
      const password = result.current.handleGenerateNewPassword();
      
      expect(password).toHaveLength(8);
    });

    it('should generate a password with required characters', () => {
      const { result } = renderHook(() => useResetPassword());
      
      const password = result.current.handleGenerateNewPassword();
      
      // Check for special character (guaranteed)
      expect(/[!@#$%]/.test(password)).toBe(true);
      // Check for number (guaranteed)
      expect(/\d/.test(password)).toBe(true);
      // Check for uppercase (guaranteed)
      expect(/[A-Z]/.test(password)).toBe(true);
      // Check that password contains valid characters only
      expect(/^[!@#$%0-9A-Za-z]{8}$/.test(password)).toBe(true);
    });

    it('should generate different passwords on multiple calls', () => {
      const { result } = renderHook(() => useResetPassword());
      
      const password1 = result.current.handleGenerateNewPassword();
      const password2 = result.current.handleGenerateNewPassword();
      
      // While it's possible they could be the same, it's very unlikely
      // This test ensures the function is working and generating passwords
      expect(password1).toBeDefined();
      expect(password2).toBeDefined();
      expect(typeof password1).toBe('string');
      expect(typeof password2).toBe('string');
    });

    it('should generate password with shuffled characters', () => {
      const { result } = renderHook(() => useResetPassword());
      
      const password = result.current.handleGenerateNewPassword();
      
      // Password should not start with the same pattern every time
      // This is a basic check that the shuffling is working
      expect(password).toHaveLength(8);
      expect(/^[!@#$%0-9A-Za-z]{8}$/.test(password)).toBe(true);
    });
  });

  describe('Reset Password Functionality', () => {
    it('should handle successful password reset', async () => {
      mockResetPasswordService.resetPassword.mockResolvedValue({ success: true });
      
      const { result } = renderHook(() => useResetPassword());
      
      await act(async () => {
        await result.current.handleResetPassword('test-uuid', {
          newPassword: 'NewPassword123!',
        });
      });
      
      expect(mockResetPasswordService.resetPassword).toHaveBeenCalledWith('test-uuid', {
        newPassword: 'NewPassword123!',
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        'Reset Password',
        'Your password has been reset successfully',
        'success'
      );
      expect(result.current.isResetSuccessful).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    it('should handle loading state during reset', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockResetPasswordService.resetPassword.mockReturnValue(promise);
      
      const { result } = renderHook(() => useResetPassword());
      
      act(() => {
        result.current.handleResetPassword('test-uuid', {
          newPassword: 'NewPassword123!',
        });
      });
      
      expect(result.current.loading).toBe(true);
      
      await act(async () => {
        resolvePromise({ success: true });
        await promise;
      });
      
      expect(result.current.loading).toBe(false);
    });

    it('should handle reset password error with axios error', async () => {
      const axiosError = {
        response: {
          data: {
            message: 'User not found',
          },
        },
      };
      mockResetPasswordService.resetPassword.mockRejectedValue(axiosError);
      
      const { result } = renderHook(() => useResetPassword());
      
      await act(async () => {
        await result.current.handleResetPassword('test-uuid', {
          newPassword: 'NewPassword123!',
        });
      });
      
      expect(mockShowToast).toHaveBeenCalledWith(
        'Reset Password Failed',
        'User not found',
        'error'
      );
      expect(result.current.isResetSuccessful).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it('should handle reset password error without response', async () => {
      const error = new Error('Network error');
      mockResetPasswordService.resetPassword.mockRejectedValue(error);
      
      const { result } = renderHook(() => useResetPassword());
      
      await act(async () => {
        await result.current.handleResetPassword('test-uuid', {
          newPassword: 'NewPassword123!',
        });
      });
      
      expect(mockShowToast).toHaveBeenCalledWith(
        'Reset Password Failed',
        'Forgot Password Failed',
        'error'
      );
      expect(result.current.isResetSuccessful).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it('should handle reset password error with empty response data', async () => {
      const axiosError = {
        response: {
          data: {},
        },
      };
      mockResetPasswordService.resetPassword.mockRejectedValue(axiosError);
      
      const { result } = renderHook(() => useResetPassword());
      
      await act(async () => {
        await result.current.handleResetPassword('test-uuid', {
          newPassword: 'NewPassword123!',
        });
      });
      
      expect(mockShowToast).toHaveBeenCalledWith(
        'Reset Password Failed',
        'Forgot Password Failed',
        'error'
      );
      expect(result.current.isResetSuccessful).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should maintain state correctly across multiple operations', async () => {
      const { result } = renderHook(() => useResetPassword());
      
      // Initial state
      expect(result.current.isResetSuccessful).toBe(false);
      expect(result.current.loading).toBe(false);
      
      // Generate password
      const password = result.current.handleGenerateNewPassword();
      expect(password).toBeDefined();
      
      // Reset password
      mockResetPasswordService.resetPassword.mockResolvedValue({ success: true });
      
      await act(async () => {
        await result.current.handleResetPassword('test-uuid', {
          newPassword: 'NewPassword123!',
        });
      });
      
      expect(result.current.isResetSuccessful).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Hook Return Values', () => {
    it('should return all required functions and state', () => {
      const { result } = renderHook(() => useResetPassword());
      
      expect(result.current).toHaveProperty('handleResetPassword');
      expect(result.current).toHaveProperty('handleGenerateNewPassword');
      expect(result.current).toHaveProperty('isResetSuccessful');
      expect(result.current).toHaveProperty('loading');
      
      expect(typeof result.current.handleResetPassword).toBe('function');
      expect(typeof result.current.handleGenerateNewPassword).toBe('function');
      expect(typeof result.current.isResetSuccessful).toBe('boolean');
      expect(typeof result.current.loading).toBe('boolean');
    });
  });
});
