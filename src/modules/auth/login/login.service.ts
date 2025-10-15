import type { AxiosRequestConfig } from 'axios';
import { MindmapAuthGatewayApi } from '../../../services/mindmap';
import { OpenMRSApi } from '../../../services/openmrs';
import type { OpenMRSLoginResponse } from '../../../types/auth/auth.types';
import type { LoginCredentials, LoginResponse } from '../../../types/auth/login.types';

// Basic API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  OPENMRSLOGIN: '/session',
} as const;

// Basic API functions
export const loginService = {
  login: (credentials: LoginCredentials) =>
    MindmapAuthGatewayApi.post<LoginResponse>(API_ENDPOINTS.LOGIN, credentials),

  openMRSLogin: (credentials: AxiosRequestConfig) =>
    OpenMRSApi.get<OpenMRSLoginResponse>(
      API_ENDPOINTS.OPENMRSLOGIN,
      credentials
    ),
};

export default loginService;
