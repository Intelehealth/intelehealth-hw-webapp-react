import { MindmapPortalApi } from '../../../services/mindmap';
import type { ResetPasswordModel } from '../auth.types';

// Basic API endpoints
export const API_ENDPOINTS = {
  RESET_PASSWORD: '/auth/reset-password',
} as const;

// Basic API functions
export const resetPasswordService = {
  resetPassword: async (userUuid: string, payload: ResetPasswordModel) => {
    return await MindmapPortalApi.post(API_ENDPOINTS.RESET_PASSWORD, {
      userUuid,
      ...payload,
    });
  },
};

export default resetPasswordService;
