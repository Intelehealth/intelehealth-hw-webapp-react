import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResetPasswordModel } from '../../../../types/auth/auth.types';
import { API_ENDPOINTS, resetPasswordService } from '../../../../modules/auth/reset-password/reset-password.service';
import { MindmapPortalApi } from '../../../../services/mindmap';

// Mock the MindmapPortalApi
vi.mock('../../../../services/mindmap', () => ({
  MindmapPortalApi: {
    post: vi.fn(),
  },
}));

describe('resetPasswordService', () => {
  const mockPost = vi.mocked(MindmapPortalApi.post);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API_ENDPOINTS', () => {
    it('should have correct endpoint for reset password', () => {
      expect(API_ENDPOINTS.RESET_PASSWORD).toBe('/auth/resetPassword');
    });
  });

  describe('resetPassword', () => {
    it('should call MindmapPortalApi.post with correct parameters', async () => {
      const userUuid = 'test-uuid-123';
      const payload = {
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const mockResponse = {
        success: true,
        message: 'Password reset successfully',
        data: { userId: userUuid },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await resetPasswordService.resetPassword(userUuid, {
        newPassword: payload.password,
      });

      expect(mockPost).toHaveBeenCalledWith('/auth/resetPassword/test-uuid-123', {
        newPassword: 'newPassword123',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const userUuid = 'test-uuid-123';
      const payload = {
        password: 'newPassword123',
      };

      const mockError = new Error('API Error');
      mockPost.mockRejectedValue(mockError);

      await expect(
        resetPasswordService.resetPassword(userUuid, {
          newPassword: payload.password,
        })
      ).rejects.toThrow('API Error');
    });

    it('should handle empty payload', async () => {
      const userUuid = 'test-uuid-789';
      const payload = {} as Record<string, unknown>;

      const mockResponse = {
        success: false,
        message: 'Invalid payload',
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await resetPasswordService.resetPassword(userUuid, payload as unknown as ResetPasswordModel);

      expect(mockPost).toHaveBeenCalledWith('/auth/resetPassword/test-uuid-789', {
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle network timeout', async () => {
      const userUuid = 'test-uuid-timeout';
      const payload = {
        password: 'timeoutPassword',
        confirmPassword: 'timeoutPassword',
      };

      const timeoutError = new Error('Network timeout');
      mockPost.mockRejectedValue(timeoutError);

      // Ensure payload is in the correct format and matches ResetPasswordModel
      const resetPayload = {
        newPassword: payload.password,
      };

      await expect(resetPasswordService.resetPassword(userUuid, resetPayload)).rejects.toThrow('Network timeout');
    });

    it('should handle API response with error status', async () => {
      const userUuid = 'test-uuid-error';
      const payload = {
        password: 'errorPassword',
        confirmPassword: 'errorPassword',
      };

      const mockErrorResponse = {
        success: false,
        message: 'Password does not meet requirements',
        errors: ['Password must be at least 8 characters'],
      };

      mockPost.mockResolvedValue(mockErrorResponse);

      // Fix: Ensure payload matches ResetPasswordModel type
      const resetPayload = {
        newPassword: payload.password,
      };

      const result = await resetPasswordService.resetPassword(userUuid, resetPayload);

      expect(result).toEqual(mockErrorResponse);
      expect((result as typeof mockErrorResponse).success).toBe(false);
    });

    it('should handle successful response with additional data', async () => {
      const userUuid = 'test-uuid-success';
      const payload = {
        password: 'successPassword123',
      };

      const mockSuccessResponse = {
        success: true,
        message: 'Password reset successfully',
        data: {
          userId: userUuid,
          resetAt: '2023-01-01T00:00:00Z',
          expiresAt: '2023-01-01T01:00:00Z',
        },
      };

      mockPost.mockResolvedValue(mockSuccessResponse);

      // Fix: ensure payload matches ResetPasswordModel type (must have newPassword)
      const resetPayload = {
        newPassword: payload.password,
      };

      const result = await resetPasswordService.resetPassword(userUuid, resetPayload);

      expect(result).toEqual(mockSuccessResponse);
      expect((result as typeof mockSuccessResponse).success).toBe(true);
      expect((result as typeof mockSuccessResponse).data).toHaveProperty('userId', userUuid);
      expect((result as typeof mockSuccessResponse).data).toHaveProperty('resetAt');
      expect((result as typeof mockSuccessResponse).data).toHaveProperty('expiresAt');
    });

    it('should handle different userUuid formats', async () => {
      const userUuids = [
        'simple-uuid',
        'uuid-with-dashes-123',
        'uuid_with_underscores',
        'uuid.with.dots',
        '1234567890',
      ];

      for (const userUuid of userUuids) {
        const payload = {
          password: 'testPassword',
        };

        const mockResponse = {
          success: true,
          message: 'Password reset successfully',
          data: { userId: userUuid },
        };

        mockPost.mockResolvedValue(mockResponse);

        // Ensure payload matches ResetPasswordModel type (must have newPassword field)
        const resetPayload = {
          newPassword: payload.password,
        };

        const result = await resetPasswordService.resetPassword(userUuid, resetPayload);

        expect(mockPost).toHaveBeenCalledWith(`/auth/resetPassword/${userUuid}`, {
          newPassword: 'testPassword',
        });

        expect(result).toEqual(mockResponse);
      }
    });

    it('should handle concurrent requests', async () => {
      const userUuid1 = 'user-1';
      const userUuid2 = 'user-2';
      const payload1 = { password: 'password1' };
      const payload2 = { password: 'password2' };

      const mockResponse1 = { success: true, message: 'Reset 1', data: { userId: userUuid1 } };
      const mockResponse2 = { success: true, message: 'Reset 2', data: { userId: userUuid2 } };

      mockPost
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // Adapt payload to match ResetPasswordModel (must have newPassword field)
      const resetPayload1 = { newPassword: payload1.password, };
      const resetPayload2 = { newPassword: payload2.password, };

      const [result1, result2] = await Promise.all([
        resetPasswordService.resetPassword(userUuid1, resetPayload1),
        resetPasswordService.resetPassword(userUuid2, resetPayload2),
      ]);

      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(mockResponse1);
      expect(result2).toEqual(mockResponse2);
    });
  });

  describe('service export', () => {
    it('should export resetPasswordService as default', () => {
      expect(resetPasswordService).toBeDefined();
      expect(typeof resetPasswordService.resetPassword).toBe('function');
    });

    it('should have correct service structure', () => {
      expect(resetPasswordService).toHaveProperty('resetPassword');
      expect(typeof resetPasswordService.resetPassword).toBe('function');
    });
  });
});