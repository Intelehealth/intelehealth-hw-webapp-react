import type { AxiosRequestConfig } from 'axios';
import type { LoginResponse, OpenMRSLoginResponse } from '../types/auth.types';
import { MindmapPortalApi } from './mindmap';
import { OpenMRSApi } from './openmrs';

// Basic API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    OPENMRSLOGIN: '/session',
  },
} as const;

// Basic API functions
export const apiService = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    MindmapPortalApi.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials),

  openMRSLogin: (credentials: AxiosRequestConfig) =>
    OpenMRSApi.get<OpenMRSLoginResponse>(
      API_ENDPOINTS.AUTH.OPENMRSLOGIN,
      credentials
    ),
};

export default apiService;
