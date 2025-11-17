import { act, render, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ProfileGuardProvider,
  useProfileGuard,
} from '../../context/ProfileGuardContext';
import type { Profile } from '../../types/profile.types';

// Hoisted mocks to avoid Vitest hoisting issues
const h = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

// Mock MindmapAuthGatewayApi
vi.mock('../../services/mindmap', () => ({
  MindmapAuthGatewayApi: {
    get: (...args: any[]) => h.mockGet(...args),
  },
}));

// Set VITE_SKIP_TEST_MODE to bypass test mode check in tests
// This allows API calls to be made even when MODE is 'test'
Object.defineProperty(import.meta.env, 'VITE_SKIP_TEST_MODE', {
  value: 'true',
  writable: true,
  configurable: true,
  enumerable: true,
});

// Test component that uses the hook
const TestComponent: React.FC = () => {
  const { isProfileComplete, loading, profileState, refreshProfileStatus } =
    useProfileGuard();
  return (
    <div>
      <div data-testid="isProfileComplete">{String(isProfileComplete)}</div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="profileState">{profileState}</div>
      <button
        data-testid="refresh-button"
        onClick={() => refreshProfileStatus()}
      >
        Refresh
      </button>
    </div>
  );
};

describe('ProfileGuardContext', () => {
  const mockCompleteProfile: Profile = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    setupLocation: 'sf-clinic',
    id: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    role: '',
    department: '',
    employeeId: '',
    joinDate: '',
    lastLogin: '',
    isActive: false,
    username: '',
    preferences: {
      language: '',
      timezone: '',
      notifications: {
        email: false,
        sms: false,
        push: false
      }
    }
  };

  const mockIncompleteProfile: Profile = {
    firstName: 'John',
    lastName: 'Doe',
    // Missing email, phone, etc.
  } as Profile;

  const mockEmptyProfile: Profile = {} as Profile;

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure VITE_SKIP_TEST_MODE is set to bypass test mode check
    // This allows API calls to be made even when MODE is 'test'
    try {
      Object.defineProperty(import.meta.env, 'VITE_SKIP_TEST_MODE', {
        value: 'true',
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch (e) {
      (import.meta.env as any).VITE_SKIP_TEST_MODE = 'true';
    }
  });

  describe('ProfileGuardProvider - Initial State', () => {
    it('should provide initial state values', async () => {
      h.mockGet.mockResolvedValue(mockCompleteProfile);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      // Initially loading should be true
      expect(getByTestId('loading').textContent).toBe('true');

      // Wait for initial load to complete
      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should call refreshProfileStatus on mount', async () => {
      h.mockGet.mockResolvedValue(mockCompleteProfile);

      render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(h.mockGet).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('ProfileGuardProvider - Profile States', () => {
    it('should set profileState to "complete" when profile has all required fields', async () => {
      h.mockGet.mockResolvedValue(mockCompleteProfile);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('complete');
      expect(getByTestId('isProfileComplete').textContent).toBe('true');
    });

    it('should set profileState to "incomplete" when profile has some but not all required fields', async () => {
      h.mockGet.mockResolvedValue(mockIncompleteProfile);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('incomplete');
      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "not-started" when profile is null', async () => {
      h.mockGet.mockResolvedValue(null);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('not-started');
      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "not-started" when profile is empty object', async () => {
      h.mockGet.mockResolvedValue(mockEmptyProfile);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('not-started');
      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "not-started" when profile has no data fields', async () => {
      const profileWithNullFields: Profile = {
        firstName: null as any,
        lastName: null as any,
        email: null as any,
        phone: null as any,
        dateOfBirth: null as any,
        gender: null as any,
        setupLocation: null as any,
        username: null as any,
        middleName: null as any,
      } as Profile;

      h.mockGet.mockResolvedValue(profileWithNullFields);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('not-started');
      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "incomplete" when profile has some required fields missing', async () => {
      const profileMissingFields: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        // Missing phone, dateOfBirth, gender, setupLocation
      } as Profile;

      h.mockGet.mockResolvedValue(profileMissingFields);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('incomplete');
      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "incomplete" when required field is empty string', async () => {
      const profileWithEmptyField: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
      } as Profile;

      h.mockGet.mockResolvedValue(profileWithEmptyField);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('incomplete');
      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "incomplete" when required field is null', async () => {
      const profileWithNullField: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: null as any,
        gender: 'male',
        setupLocation: 'sf-clinic',
      } as Profile;

      h.mockGet.mockResolvedValue(profileWithNullField);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('incomplete');
      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "incomplete" when required field is undefined', async () => {
      const profileWithUndefinedField: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: undefined as any,
        setupLocation: 'sf-clinic',
      } as Profile;

      h.mockGet.mockResolvedValue(profileWithUndefinedField);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('incomplete');
      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });
  });

  describe('ProfileGuardProvider - refreshProfileStatus', () => {
    it('should refresh profile status when called', async () => {
      h.mockGet.mockResolvedValue(mockCompleteProfile);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      h.mockGet.mockClear();
      h.mockGet.mockResolvedValue(mockIncompleteProfile);

      const refreshButton = getByTestId('refresh-button');
      await act(async () => {
        refreshButton.click();
      });

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
        expect(h.mockGet).toHaveBeenCalledWith('/profile');
      });

      expect(getByTestId('profileState').textContent).toBe('incomplete');
    });

    it('should handle API errors and set state to not-started', async () => {
      h.mockGet.mockRejectedValue(new Error('API Error'));

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('not-started');
      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set loading to false in finally block after error', async () => {
      h.mockGet.mockRejectedValue(new Error('API Error'));

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should set loading to false in finally block after success', async () => {
      h.mockGet.mockResolvedValue(mockCompleteProfile);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });
    });
  });

  describe('ProfileGuardProvider - Test Mode', () => {
    it('should return early in test mode without making API call', async () => {
      // Clear any previous calls
      h.mockGet.mockClear();
      
      // Remove VITE_SKIP_TEST_MODE to enable test mode check
      // Note: beforeEach sets it to 'true', so we need to override it here
      // The component checks: !import.meta.env.VITE_SKIP_TEST_MODE
      // So if VITE_SKIP_TEST_MODE is falsy, the test mode check will pass
      try {
        Object.defineProperty(import.meta.env, 'VITE_SKIP_TEST_MODE', {
          value: '',
          writable: true,
          configurable: true,
          enumerable: false,
        });
      } catch (e) {
        (import.meta.env as any).VITE_SKIP_TEST_MODE = '';
      }

      // Verify the property is falsy before rendering
      expect(import.meta.env.VITE_SKIP_TEST_MODE).toBeFalsy();

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      // Should not call API in test mode
      expect(h.mockGet).not.toHaveBeenCalled();
      expect(getByTestId('profileState').textContent).toBe('not-started');
      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set loading to true then false in test mode', async () => {
      // Remove VITE_SKIP_TEST_MODE to enable test mode check
      // Note: beforeEach sets it to 'true', so we need to override it here
      try {
        Object.defineProperty(import.meta.env, 'VITE_SKIP_TEST_MODE', {
          value: '',
          writable: true,
          configurable: true,
          enumerable: false,
        });
      } catch (e) {
        (import.meta.env as any).VITE_SKIP_TEST_MODE = '';
      }

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      // In test mode, loading is set to true, then immediately set to false
      // So we need to check quickly or wait for the effect
      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      }, { timeout: 100 });
    });
  });

  describe('useProfileGuard Hook', () => {
    it('should return context when used within ProfileGuardProvider', async () => {
      h.mockGet.mockResolvedValue(mockCompleteProfile);

      const { result } = renderHook(() => useProfileGuard(), {
        wrapper: ({ children }) => (
          <ProfileGuardProvider>{children}</ProfileGuardProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('isProfileComplete');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('profileState');
      expect(result.current).toHaveProperty('refreshProfileStatus');
      expect(typeof result.current.refreshProfileStatus).toBe('function');
    });

    it('should throw error when used outside ProfileGuardProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useProfileGuard());
      }).toThrow('useProfileGuard must be used within ProfileGuardProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should provide correct context values', async () => {
      h.mockGet.mockResolvedValue(mockCompleteProfile);

      const { result } = renderHook(() => useProfileGuard(), {
        wrapper: ({ children }) => (
          <ProfileGuardProvider>{children}</ProfileGuardProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isProfileComplete).toBe(true);
      expect(result.current.profileState).toBe('complete');
      expect(result.current.loading).toBe(false);
    });

    it('should allow calling refreshProfileStatus from hook', async () => {
      h.mockGet.mockResolvedValue(mockCompleteProfile);

      const { result } = renderHook(() => useProfileGuard(), {
        wrapper: ({ children }) => (
          <ProfileGuardProvider>{children}</ProfileGuardProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      h.mockGet.mockClear();
      h.mockGet.mockResolvedValue(mockIncompleteProfile);

      await act(async () => {
        await result.current.refreshProfileStatus();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profileState).toBe('incomplete');
      expect(result.current.isProfileComplete).toBe(false);
    });
  });

  describe('ProfileGuardProvider - Edge Cases', () => {
    it('should handle profile with only optional fields filled', async () => {
      const profileWithOnlyOptional: Profile = {
        username: 'testuser',
        middleName: 'M',
        // No required fields
      } as Profile;

      h.mockGet.mockResolvedValue(profileWithOnlyOptional);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      // Should be incomplete since required fields are missing
      expect(getByTestId('profileState').textContent).toBe('incomplete');
    });

    it('should handle profile with all fields including optional ones', async () => {
      const profileWithAllFields: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
        username: 'johndoe',
        middleName: 'M',
      } as Profile;

      h.mockGet.mockResolvedValue(profileWithAllFields);

      const { getByTestId } = render(
        <ProfileGuardProvider>
          <TestComponent />
        </ProfileGuardProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading').textContent).toBe('false');
      });

      expect(getByTestId('profileState').textContent).toBe('complete');
      expect(getByTestId('isProfileComplete').textContent).toBe('true');
    });
  });
});

