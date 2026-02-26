import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from '../../utils/storage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('storage utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Auth token management', () => {
    it('gets auth token', () => {
      localStorageMock.getItem.mockReturnValue('token123');

      const result = storage.getAuthToken();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
      expect(result).toBe('token123');
    });

    it('returns null when auth token does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = storage.getAuthToken();

      expect(result).toBeNull();
    });

    it('sets auth token', () => {
      storage.setAuthToken('new-token');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
    });

    it('clears auth token', () => {
      storage.clearAuthToken();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('User management', () => {
    it('gets user', () => {
      localStorageMock.getItem.mockReturnValue('{"id":1,"name":"John"}');

      const result = storage.getUser();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('user');
      expect(result).toBe('{"id":1,"name":"John"}');
    });

    it('returns null when user does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = storage.getUser();

      expect(result).toBeNull();
    });

    it('sets user', () => {
      const userData = '{"id":1,"name":"John"}';
      storage.setUser(userData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', userData);
    });

    it('clears user', () => {
      storage.clearUser();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Location management', () => {
    it('gets location uuid', () => {
      localStorageMock.getItem.mockReturnValue('uuid-123');

      const result = storage.getLocationUuid();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('locationUuid');
      expect(result).toBe('uuid-123');
    });

    it('returns null when location uuid does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = storage.getLocationUuid();

      expect(result).toBeNull();
    });

    it('sets location uuid', () => {
      storage.setLocationUuid('uuid-456');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('locationUuid', 'uuid-456');
    });

    it('gets location name', () => {
      localStorageMock.getItem.mockReturnValue('Main Clinic');

      const result = storage.getLocationName();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('locationName');
      expect(result).toBe('Main Clinic');
    });

    it('returns null when location name does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = storage.getLocationName();

      expect(result).toBeNull();
    });

    it('sets location name', () => {
      storage.setLocationName('New Clinic');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('locationName', 'New Clinic');
    });
  });

  describe('Generic storage helpers', () => {
    it('gets generic value', () => {
      localStorageMock.getItem.mockReturnValue('generic-value');

      const result = storage.get('generic-key');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('generic-key');
      expect(result).toBe('generic-value');
    });

    it('returns null when generic value does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = storage.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('sets generic value', () => {
      storage.set('generic-key', 'generic-value');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('generic-key', 'generic-value');
    });

    it('removes generic value', () => {
      storage.remove('generic-key');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('generic-key');
    });

    it('clears all storage', () => {
      storage.clear();

      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('handles empty string values', () => {
      localStorageMock.getItem.mockReturnValue('');

      const result = storage.get('empty-key');

      expect(result).toBe('');
    });

    it('handles special characters in keys and values', () => {
      const specialKey = 'key-with-special-chars!@#$%';
      const specialValue = 'value-with-special-chars!@#$%';

      storage.set(specialKey, specialValue);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(specialKey, specialValue);
    });

    it('handles JSON strings in user storage', () => {
      const userObject = { id: 1, name: 'John', email: 'john@example.com' };
      const userString = JSON.stringify(userObject);

      storage.setUser(userString);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', userString);
    });

    it('handles long token values', () => {
      const longToken = 'a'.repeat(1000);
      storage.setAuthToken(longToken);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', longToken);
    });
  });

  describe('Integration scenarios', () => {
    it('handles complete auth flow', () => {
      const token = 'auth-token-123';
      const user = '{"id":1,"name":"John"}';

      // Set auth data
      storage.setAuthToken(token);
      storage.setUser(user);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', user);

      // Get auth data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return token;
        if (key === 'user') return user;
        return null;
      });

      const retrievedToken = storage.getAuthToken();
      const retrievedUser = storage.getUser();

      expect(retrievedToken).toBe(token);
      expect(retrievedUser).toBe(user);

      // Clear auth data
      storage.clearAuthToken();
      storage.clearUser();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('handles multiple generic storage operations', () => {
      const data = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' },
      ];

      // Set multiple values
      data.forEach(({ key, value }) => {
        storage.set(key, value);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3);

      // Get multiple values
      localStorageMock.getItem.mockImplementation((key) => {
        const item = data.find(d => d.key === key);
        return item ? item.value : null;
      });

      data.forEach(({ key, value }) => {
        const result = storage.get(key);
        expect(result).toBe(value);
      });

      // Remove multiple values
      data.forEach(({ key }) => {
        storage.remove(key);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(3);
    });
  });
});
