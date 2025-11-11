import { MindmapAuthGatewayApi } from '../../services/mindmap';
import type {
  PasswordChangeRequest,
  Profile,
  ProfileUpdateRequest,
} from '../../types/profile.types';

// API endpoints
export const API_ENDPOINTS = {
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/profile/change-password',
  UPLOAD_PHOTO: '/profile/upload-photo',
} as const;

// Profile API functions
export const profileService = {
  getProfile: (userId: string) =>
    MindmapAuthGatewayApi.get<Profile>(`${API_ENDPOINTS.PROFILE}/${userId}`),

  getProfileStatus: async () => {
    try {
      // Get current user profile and check completion
      const response = await MindmapAuthGatewayApi.get<Profile>(
        API_ENDPOINTS.PROFILE
      );
      const profile = response;

      const requiredFields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'dateOfBirth',
        'gender',
        'setupLocation',
        'address.street',
        'address.city',
        'address.state',
        'address.country',
        'address.zipCode',
        'role',
        'department',
        'employeeId',
      ];

      const isComplete = requiredFields.every(field => {
        if (field.includes('.')) {
          // Handle nested fields like address.street
          const [parent, child] = field.split('.');
          const parentValue = profile[parent as keyof Profile];
          if (
            parentValue &&
            typeof parentValue === 'object' &&
            parentValue !== null
          ) {
            const value = (parentValue as Record<string, unknown>)[child];
            return value !== null && value !== undefined && value !== '';
          }
          return false;
        } else {
          const value = profile[field as keyof Profile];
          return value !== null && value !== undefined && value !== '';
        }
      });

      return { complete: isComplete };
    } catch {
      return { complete: false };
    }
  },

  updateProfile: (data: ProfileUpdateRequest) => {
    return MindmapAuthGatewayApi.put<Profile>(API_ENDPOINTS.PROFILE, data);
  },

  changePassword: (data: PasswordChangeRequest) =>
    MindmapAuthGatewayApi.post<void>(API_ENDPOINTS.CHANGE_PASSWORD, data),

  uploadPhoto: (formData: FormData) =>
    MindmapAuthGatewayApi.post<Profile>(API_ENDPOINTS.UPLOAD_PHOTO, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export default profileService;
