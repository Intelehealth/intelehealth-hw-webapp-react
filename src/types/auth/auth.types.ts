export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ResetPasswordModel {
  newPassword: string;
}

export interface ResetPasswordResponseModel {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface RoleModel {
  display: string;
  uuid: string;
  name: string;
}

export interface User {
  username: string;
  uuid: string;
  person: {
    uuid: string;
    display: string;
  };
  id: string;
  name: string;
  email: string;
  roles: RoleModel[];
}

export interface OpenMRSLoginResponse {
  authenticated: boolean;
  user: User;
  sessionId: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
