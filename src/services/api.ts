import type { AxiosRequestConfig } from 'axios';
import type {
  LoginResponse,
  OpenMRSLoginResponse,
  User,
} from '../types/auth.types';
import type { Patient } from '../types/patient.types';
import { MindmapPortalApi } from './mindmap';
import { OpenMRSApi } from './openmrs';

// Basic API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    OPENMRSLOGIN: 'openmrs/ws/rest/v1/session',
  },
  PATIENTS: {
    LIST: '/patients',
    CREATE: '/patients',
    UPDATE: (id: string) => `/patients/${id}`,
    DELETE: (id: string) => `/patients/${id}`,
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
  },
} as const;

// API Service interface
export interface ApiService {
  // Auth
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  getProfile: () => Promise<User>;
  openMRSLogin: (
    credentials: AxiosRequestConfig
  ) => Promise<OpenMRSLoginResponse>;

  // Patients
  getPatients: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => Promise<{ patients: Patient[]; total: number }>;
  createPatient: (patient: Omit<Patient, 'id'>) => Promise<Patient>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;

  // Users
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => Promise<{ users: User[]; total: number }>;
  createUser: (user: Omit<User, 'id' | 'uuid' | 'person'>) => Promise<User>;
}

// Basic API functions
export const apiService: ApiService = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    MindmapPortalApi.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials),

  logout: () => MindmapPortalApi.post(API_ENDPOINTS.AUTH.LOGOUT),

  getProfile: () => MindmapPortalApi.get<User>(API_ENDPOINTS.AUTH.PROFILE),

  openMRSLogin: (credentials: AxiosRequestConfig) =>
    OpenMRSApi.get<OpenMRSLoginResponse>(
      API_ENDPOINTS.AUTH.OPENMRSLOGIN,
      credentials
    ),

  // Patients
  getPatients: (params?: { page?: number; limit?: number; search?: string }) =>
    MindmapPortalApi.get<{ patients: Patient[]; total: number }>(
      API_ENDPOINTS.PATIENTS.LIST,
      { params }
    ),

  createPatient: (patient: Omit<Patient, 'id'>) =>
    MindmapPortalApi.post<Patient>(API_ENDPOINTS.PATIENTS.CREATE, patient),

  updatePatient: (id: string, patient: Partial<Patient>) =>
    MindmapPortalApi.put<Patient>(API_ENDPOINTS.PATIENTS.UPDATE(id), patient),

  deletePatient: (id: string) =>
    MindmapPortalApi.delete(API_ENDPOINTS.PATIENTS.DELETE(id)),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    MindmapPortalApi.get<{ users: User[]; total: number }>(
      API_ENDPOINTS.USERS.LIST,
      { params }
    ),

  createUser: (user: Omit<User, 'id' | 'uuid' | 'person'>) =>
    MindmapPortalApi.post<User>(API_ENDPOINTS.USERS.CREATE, user),
};

export default apiService;
