import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileService } from '../../../modules/profile/profile.service';

// Mock the MindmapAuthGatewayApi
vi.mock('../../../services/mindmap', () => ({
  MindmapAuthGatewayApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock the storage utility
vi.mock('../../../utils/storage', () => ({
  storage: {
    getAuthToken: vi.fn(() => 'mock-token'),
  },
}));

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch profile data successfully', async () => {
      const mockProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const { MindmapAuthGatewayApi } = await import('../../../services/mindmap');
      vi.mocked(MindmapAuthGatewayApi.get).mockResolvedValue(mockProfile);

      const result = await profileService.getProfile('1');

      expect(MindmapAuthGatewayApi.get).toHaveBeenCalledWith('/profile/1');
      expect(result).toEqual(mockProfile);
    });

    it('should handle errors when fetching profile', async () => {
      const { MindmapAuthGatewayApi } = await import('../../../services/mindmap');
      vi.mocked(MindmapAuthGatewayApi.get).mockRejectedValue(new Error('Network error'));

      await expect(profileService.getProfile('1')).rejects.toThrow('Network error');
    });
  });

  describe('updateProfile', () => {
    it('should update profile data successfully', async () => {
      const mockProfileData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };

      const mockResponse = { success: true, data: mockProfileData };

      const { MindmapAuthGatewayApi } = await import('../../../services/mindmap');
      vi.mocked(MindmapAuthGatewayApi.put).mockResolvedValue(mockResponse);

      const result = await profileService.updateProfile(mockProfileData);

      expect(MindmapAuthGatewayApi.put).toHaveBeenCalledWith('/profile', mockProfileData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when updating profile', async () => {
      const mockProfileData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const { MindmapAuthGatewayApi } = await import('../../../services/mindmap');
      vi.mocked(MindmapAuthGatewayApi.put).mockRejectedValue(new Error('Update failed'));

      await expect(profileService.updateProfile(mockProfileData)).rejects.toThrow('Update failed');
    });
  });

  describe('uploadPhoto', () => {
    it('should upload photo successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse = { success: true, photoUrl: 'https://example.com/photo.jpg' };

      const { MindmapAuthGatewayApi } = await import('../../../services/mindmap');
      vi.mocked(MindmapAuthGatewayApi.post).mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('photo', mockFile);
      const result = await profileService.uploadPhoto(formData);

      expect(MindmapAuthGatewayApi.post).toHaveBeenCalledWith('/profile/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when uploading photo', async () => {
      const formData = new FormData();
      formData.append('photo', new File(['test'], 'test.jpg', { type: 'image/jpeg' }));

      const { MindmapAuthGatewayApi } = await import('../../../services/mindmap');
      vi.mocked(MindmapAuthGatewayApi.post).mockRejectedValue(new Error('Upload failed'));

      await expect(profileService.uploadPhoto(formData)).rejects.toThrow('Upload failed');
    });
  });


  describe('getProfileStatus', () => {
    it('should return complete status for complete profile', async () => {
      const mockProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
          zipCode: '94102',
        },
        role: 'Doctor',
        department: 'Cardiology',
        employeeId: 'EMP001',
      };

      const { MindmapAuthGatewayApi } = await import('../../../services/mindmap');
      vi.mocked(MindmapAuthGatewayApi.get).mockResolvedValue(mockProfile);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: true });
    });

    it('should return incomplete status for incomplete profile', async () => {
      const mockProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        // Missing required fields
      };

      const { MindmapAuthGatewayApi } = await import('../../../services/mindmap');
      vi.mocked(MindmapAuthGatewayApi.get).mockResolvedValue(mockProfile);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });

    it('should handle errors when checking profile status', async () => {
      const { MindmapAuthGatewayApi } = await import('../../../services/mindmap');
      vi.mocked(MindmapAuthGatewayApi.get).mockRejectedValue(new Error('Profile check failed'));

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });
  });
});
