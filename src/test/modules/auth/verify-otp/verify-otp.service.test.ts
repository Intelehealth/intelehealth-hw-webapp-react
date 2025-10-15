import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the MindmapPortalApi before importing the service
vi.mock('../../../../services/mindmap', () => ({
  MindmapPortalApi: {
    post: vi.fn(),
  },
}));

import { API_ENDPOINTS, verifyOtpService } from '../../../../modules/auth/verify-otp/verify-otp.service';
import { MindmapPortalApi } from '../../../../services/mindmap';

const mockPost = vi.mocked(MindmapPortalApi.post);

describe('verifyOtpService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API_ENDPOINTS', () => {
    it('should have correct endpoint constants', () => {
      expect(API_ENDPOINTS.REQUEST_OTP).toBe('/auth/requestOtp');
      expect(API_ENDPOINTS.VERIFY_OTP).toBe('/auth/verifyOtp');
    });

    it('should be a frozen object', () => {
      expect(Object.isFrozen(API_ENDPOINTS)).toBe(true);
    });
  });

  describe('requestOtp', () => {
    it('should call MindmapPortalApi.post with correct parameters', () => {
      const payload = {
        email: 'test@example.com',
        otpFor: 'reset-password',
      };

      verifyOtpService.requestOtp(payload);

      expect(mockPost).toHaveBeenCalledWith('/auth/requestOtp', payload);
    });

    it('should handle phone number request', () => {
      const payload = {
        phoneNumber: '1234567890',
        countryCode: '+1',
        otpFor: 'reset-password',
      };

      verifyOtpService.requestOtp(payload);

      expect(mockPost).toHaveBeenCalledWith('/auth/requestOtp', payload);
    });

    it('should handle username request', () => {
      const payload = {
        username: 'testuser',
        otpFor: 'reset-password',
      };

      verifyOtpService.requestOtp(payload);

      expect(mockPost).toHaveBeenCalledWith('/auth/requestOtp', payload);
    });

    it('should return the promise from MindmapPortalApi.post', async () => {
      const mockResponse = {
        success: true,
        message: 'OTP sent successfully',
        data: { userUuid: 'test-uuid' },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = verifyOtpService.requestOtp({
        email: 'test@example.com',
        otpFor: 'reset-password',
      });

      await expect(result).resolves.toEqual(mockResponse);
    });
  });

  describe('verifyOtp', () => {
    it('should call MindmapPortalApi.post with correct parameters', () => {
      const payload = {
        otp: '123456',
        username: 'test@example.com',
        verifyFor: 'reset-password',
      };

      verifyOtpService.verifyOtp(payload);

      expect(mockPost).toHaveBeenCalledWith('/auth/verifyOtp', payload);
    });

    it('should handle email verification', () => {
      const payload = {
        email: 'test@example.com',
        otp: '123456',
        verifyFor: 'reset-password',
      };

      verifyOtpService.verifyOtp(payload);

      expect(mockPost).toHaveBeenCalledWith('/auth/verifyOtp', payload);
    });

    it('should handle phone number verification', () => {
      const payload = {
        phoneNumber: '1234567890',
        countryCode: '+1',
        otp: '123456',
        verifyFor: 'reset-password',
      };

      verifyOtpService.verifyOtp(payload);

      expect(mockPost).toHaveBeenCalledWith('/auth/verifyOtp', payload);
    });

    it('should return the promise from MindmapPortalApi.post', async () => {
      const mockResponse = {
        success: true,
        message: 'OTP verified successfully',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = verifyOtpService.verifyOtp({
        otp: '123456',
        username: 'test@example.com',
        verifyFor: 'reset-password',
      });

      await expect(result).resolves.toEqual(mockResponse);
    });
  });

  describe('Service Integration', () => {
    it('should handle successful request OTP', async () => {
      const mockResponse = {
        success: true,
        message: 'OTP sent successfully',
        data: { userUuid: 'test-uuid-123' },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await verifyOtpService.requestOtp({
        email: 'test@example.com',
        otpFor: 'reset-password',
      });

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('should handle successful verify OTP', async () => {
      const mockResponse = {
        success: true,
        message: 'OTP verified successfully',
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await verifyOtpService.verifyOtp({
        otp: '123456',
        username: 'test@example.com',
        verifyFor: 'reset-password',
      });

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(
        verifyOtpService.requestOtp({
          email: 'test@example.com',
          otpFor: 'reset-password',
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle concurrent requests', async () => {
      const mockResponse1 = {
        success: true,
        message: 'OTP sent successfully',
        data: { userUuid: 'test-uuid-1' },
      };
      const mockResponse2 = {
        success: true,
        message: 'OTP verified successfully',
      };

      mockPost
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const [requestResult, verifyResult] = await Promise.all([
        verifyOtpService.requestOtp({
          email: 'test@example.com',
          otpFor: 'reset-password',
        }),
        verifyOtpService.verifyOtp({
          otp: '123456',
          username: 'test@example.com',
          verifyFor: 'reset-password',
        }),
      ]);

      expect(requestResult).toEqual(mockResponse1);
      expect(verifyResult).toEqual(mockResponse2);
      expect(mockPost).toHaveBeenCalledTimes(2);
    });
  });

  describe('Service Exports', () => {
    it('should export verifyOtpService as default', () => {
      expect(verifyOtpService).toBeDefined();
      expect(typeof verifyOtpService.requestOtp).toBe('function');
      expect(typeof verifyOtpService.verifyOtp).toBe('function');
    });

    it('should export API_ENDPOINTS', () => {
      expect(API_ENDPOINTS).toBeDefined();
      expect(API_ENDPOINTS.REQUEST_OTP).toBe('/auth/requestOtp');
      expect(API_ENDPOINTS.VERIFY_OTP).toBe('/auth/verifyOtp');
    });
  });
});
