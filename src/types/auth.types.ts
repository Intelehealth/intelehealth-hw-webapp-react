// Common auth types
export interface User {
  id: string;
  username: string;
  uuid: string;
  name: string;
  email: string;
  role: string;
  person: {
    uuid: string;
    display: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
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
