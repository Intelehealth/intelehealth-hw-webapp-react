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

  // Location management
  getLocationUuid: (): string | null => {
    return localStorage.getItem('locationUuid');
  },

  setLocationUuid: (uuid: string): void => {
    localStorage.setItem('locationUuid', uuid);
  },

  getLocationName: (): string | null => {
    return localStorage.getItem('locationName');
  },

  setLocationName: (name: string): void => {
    localStorage.setItem('locationName', name);
  },

  // Basic Auth header management (for EMR Middleware API)
  getBasicAuthHeader: (): string | null => {
    return localStorage.getItem('ui_pref_hdr');
  },

  setBasicAuthHeader: (header: string): void => {
    localStorage.setItem('ui_pref_hdr', header);
  },

  clearBasicAuthHeader: (): void => {
    localStorage.removeItem('ui_pref_hdr');
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
