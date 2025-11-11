import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_ENDPOINTS,
  profileService,
} from '../../../modules/profile/profile.service';
import { MindmapAuthGatewayApi } from '../../../services/mindmap';
import type {
  PasswordChangeRequest,
  Profile,
  ProfileUpdateRequest,
} from '../../../types/profile.types';

// Mock the MindmapAuthGatewayApi
vi.mock('../../../services/mindmap', () => ({
  MindmapAuthGatewayApi: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe('profileService', () => {
  const mockGet = vi.mocked(MindmapAuthGatewayApi.get);
  const mockPut = vi.mocked(MindmapAuthGatewayApi.put);
  const mockPost = vi.mocked(MindmapAuthGatewayApi.post);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API_ENDPOINTS', () => {
    it('should have correct endpoint constants', () => {
      expect(API_ENDPOINTS.PROFILE).toBe('/profile');
      expect(API_ENDPOINTS.CHANGE_PASSWORD).toBe('/profile/change-password');
      expect(API_ENDPOINTS.UPLOAD_PHOTO).toBe('/profile/upload-photo');
    });
  });

  describe('getProfile', () => {
    it('should call MindmapAuthGatewayApi.get with correct URL', async () => {
      const userId = 'test-uuid-123';
      const mockProfile: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
        id: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        role: '',
        department: '',
        employeeId: '',
        joinDate: '',
        lastLogin: '',
        isActive: false,
        username: '',
        preferences: {
          language: '',
          timezone: '',
          notifications: {
            email: false,
            sms: false,
            push: false
          }
        }
      };

      mockGet.mockResolvedValue(mockProfile);

      const result = await profileService.getProfile(userId);

      expect(mockGet).toHaveBeenCalledWith('/profile/test-uuid-123');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('getProfileStatus', () => {
    it('should return complete: true when all required fields are present', async () => {
      const completeProfile: Profile = {
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
          country: 'USA',
          zipCode: '94102',
        },
        role: 'Doctor',
        department: 'Cardiology',
        employeeId: 'EMP001',
        id: '',
        joinDate: '',
        lastLogin: '',
        isActive: false,
        username: '',
        preferences: {
          language: '',
          timezone: '',
          notifications: {
            email: false,
            sms: false,
            push: false
          }
        }
      };

      mockGet.mockResolvedValue(completeProfile);

      const result = await profileService.getProfileStatus();

      expect(mockGet).toHaveBeenCalledWith('/profile');
      expect(result).toEqual({ complete: true });
    });

    it('should return complete: false when required fields are missing', async () => {
      const incompleteProfile: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        // Missing email, phone, etc.
      } as Profile;

      mockGet.mockResolvedValue(incompleteProfile);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });

    it('should return complete: false when nested address fields are missing', async () => {
      const profileWithIncompleteAddress: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
        address: {
          street: '123 Main St',
          // Missing city, state, country, zipCode
        },
      } as Profile;

      mockGet.mockResolvedValue(profileWithIncompleteAddress);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });

    it('should return complete: false when nested address field is empty string', async () => {
      const profileWithEmptyAddressField: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
        address: {
          street: '123 Main St',
          city: '',
          state: 'CA',
          country: 'USA',
          zipCode: '94102',
        },
        role: 'Doctor',
        department: 'Cardiology',
        employeeId: 'EMP001',
      } as Profile;

      mockGet.mockResolvedValue(profileWithEmptyAddressField);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });

    it('should return complete: false when nested address field is null', async () => {
      const profileWithNullAddressField: Profile = {
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
          state: null as any,
          country: 'USA',
          zipCode: '94102',
        },
        role: 'Doctor',
        department: 'Cardiology',
        employeeId: 'EMP001',
      } as Profile;

      mockGet.mockResolvedValue(profileWithNullAddressField);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });

    it('should return complete: false when address parent field is null', async () => {
      const profileWithNullAddress: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
        address: null as any,
        role: 'Doctor',
        department: 'Cardiology',
        employeeId: 'EMP001',
      } as Profile;

      mockGet.mockResolvedValue(profileWithNullAddress);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });

    it('should return complete: false when address parent field is not an object', async () => {
      const profileWithInvalidAddress: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
        address: 'invalid' as any,
        role: 'Doctor',
        department: 'Cardiology',
        employeeId: 'EMP001',
      } as Profile;

      mockGet.mockResolvedValue(profileWithInvalidAddress);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });

    it('should return complete: false when required field is empty string', async () => {
      const profileWithEmptyField: Profile = {
        firstName: 'John',
        lastName: '',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
      } as Profile;

      mockGet.mockResolvedValue(profileWithEmptyField);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });

    it('should return complete: false when required field is null', async () => {
      const profileWithNullField: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: null as any,
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
      } as Profile;

      mockGet.mockResolvedValue(profileWithNullField);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });

    it('should return complete: false when required field is undefined', async () => {
      const profileWithUndefinedField: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: undefined as any,
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
      } as Profile;

      mockGet.mockResolvedValue(profileWithUndefinedField);

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });

    it('should handle API errors and return complete: false', async () => {
      mockGet.mockRejectedValue(new Error('API Error'));

      const result = await profileService.getProfileStatus();

      expect(result).toEqual({ complete: false });
    });
  });

  describe('updateProfile', () => {
    it('should call MindmapAuthGatewayApi.put with correct parameters', async () => {
      const updateData: ProfileUpdateRequest = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const mockUpdatedProfile: Profile = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'female',
        setupLocation: 'sf-clinic',
        id: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        role: '',
        department: '',
        employeeId: '',
        joinDate: '',
        lastLogin: '',
        isActive: false,
        username: '',
        preferences: {
          language: '',
          timezone: '',
          notifications: {
            email: false,
            sms: false,
            push: false
          }
        }
      };

      mockPut.mockResolvedValue(mockUpdatedProfile);

      const result = await profileService.updateProfile(updateData);

      expect(mockPut).toHaveBeenCalledWith('/profile', updateData);
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should handle API errors', async () => {
      const updateData: ProfileUpdateRequest = {
        firstName: 'Jane',
      };

      const mockError = new Error('Update failed');
      mockPut.mockRejectedValue(mockError);

      await expect(profileService.updateProfile(updateData)).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('changePassword', () => {
    it('should call MindmapAuthGatewayApi.post with correct parameters', async () => {
      const passwordData: PasswordChangeRequest = {
        currentPassword: 'oldpass',
        newPassword: 'newpass',
        confirmPassword: 'newpass',
      };

      mockPost.mockResolvedValue(undefined);

      const result = await profileService.changePassword(passwordData);

      expect(mockPost).toHaveBeenCalledWith(
        '/profile/change-password',
        passwordData
      );
      expect(result).toBeUndefined();
    });

    it('should handle API errors', async () => {
      const passwordData: PasswordChangeRequest = {
        currentPassword: 'oldpass',
        newPassword: 'newpass',
        confirmPassword: 'newpass',
      };

      const mockError = new Error('Password change failed');
      mockPost.mockRejectedValue(mockError);

      await expect(
        profileService.changePassword(passwordData)
      ).rejects.toThrow('Password change failed');
    });
  });

  describe('uploadPhoto', () => {
    it('should call MindmapAuthGatewayApi.post with FormData and correct headers', async () => {
      const formData = new FormData();
      formData.append('photo', new File(['photo'], 'photo.jpg'));

      const mockUpdatedProfile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
        photoUrl: 'http://example.com/photo.jpg',
      } as Profile & { photoUrl?: string };

      mockPost.mockResolvedValue(mockUpdatedProfile);

      const result = await profileService.uploadPhoto(formData);

      expect(mockPost).toHaveBeenCalledWith(
        '/profile/upload-photo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should handle API errors', async () => {
      const formData = new FormData();
      formData.append('photo', new File(['photo'], 'photo.jpg'));

      const mockError = new Error('Upload failed');
      mockPost.mockRejectedValue(mockError);

      await expect(profileService.uploadPhoto(formData)).rejects.toThrow(
        'Upload failed'
      );
    });
  });
});

