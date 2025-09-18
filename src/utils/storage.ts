// Simple storage utility for auth tokens
export const storage = {
  // Auth token management
  getAuthToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  setAuthToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  clearAuthToken: (): void => {
    localStorage.removeItem('auth_token');
  },

  // User management
  getUser: (): string | null => {
    return localStorage.getItem('user');
  },

  setUser: (user: string): void => {
    localStorage.setItem('user', user);
  },

  clearUser: (): void => {
    localStorage.removeItem('user');
  },

  // Generic storage helpers
  get: (key: string): string | null => {
    return localStorage.getItem(key);
  },

  set: (key: string, value: string): void => {
    localStorage.setItem(key, value);
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  },
};
