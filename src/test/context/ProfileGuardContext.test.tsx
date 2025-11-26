import { render, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  ProfileGuardProvider,
  useProfileGuard,
} from '../../context/ProfileGuardContext';
import { loaderReducer } from '../../reducers/loader.reducer';
import { storage } from '../../utils/storage';
import profileService from '../../modules/profile/profile.service';

// Mock storage
vi.mock('../../utils/storage', () => ({
  storage: {
    getUser: vi.fn(),
  },
}));

// Mock profileService
vi.mock('../../modules/profile/profile.service', () => ({
  default: {
    getPersonByUuid: vi.fn(),
    getProvider: vi.fn(),
    getProviderByUuid: vi.fn(),
  },
}));

// Set VITE_SKIP_TEST_MODE to bypass test mode check in ProfileGuardContext
Object.defineProperty(import.meta.env, 'VITE_SKIP_TEST_MODE', {
  value: 'true',
  writable: true,
  configurable: true,
  enumerable: true,
});

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      loader: loaderReducer,
    },
  });
};

// Wrapper component that provides Redux store
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = createTestStore();
  return (
    <Provider store={store}>
      <ProfileGuardProvider>{children}</ProfileGuardProvider>
    </Provider>
  );
};

// Test component that uses the hook
const TestComponent: React.FC = () => {
  const { isProfileComplete, profileState, refreshProfileStatus } = useProfileGuard();
  return (
    <div>
      <div data-testid="isProfileComplete">{String(isProfileComplete)}</div>
      <div data-testid="profileState">{profileState}</div>
      <button data-testid="refresh-button" onClick={() => refreshProfileStatus()}>
        Refresh
      </button>
    </div>
  );
};

describe('ProfileGuardContext', () => {
  const mockUser = {
    uuid: 'user-123',
    person: { uuid: 'person-123' },
  };

  const mockPersonComplete = {
    uuid: 'person-123',
    preferredName: {
      givenName: 'John',
      middleName: 'Michael',
      familyName: 'Doe',
    },
    gender: 'M',
    birthdate: '1990-01-01',
  };

  const mockProviderComplete = {
    uuid: 'provider-123',
    attributes: [
      {
        attributeType: { display: 'emailId', name: 'emailId' },
        value: 'john@example.com',
      },
      {
        attributeType: { display: 'phoneNumber', name: 'phoneNumber' },
        value: '1234567890',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (storage.getUser as any).mockReturnValue(JSON.stringify(mockUser));

    // Mock console methods to suppress test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('ProfileGuardProvider - Complete Profile', () => {
    it('should set profileState to "complete" when all required fields are present', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue(mockPersonComplete);
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue(mockProviderComplete);

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('complete');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('true');
    });

    it('should call OpenMRS APIs on mount', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue(mockPersonComplete);
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue(mockProviderComplete);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(profileService.getPersonByUuid).toHaveBeenCalledWith('person-123');
      });

      expect(profileService.getProvider).toHaveBeenCalledWith('user-123');
    });
  });

  describe('ProfileGuardProvider - Incomplete Profile', () => {
    it('should set profileState to "incomplete" when email is missing', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue(mockPersonComplete);
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue({
        attributes: [
          {
            attributeType: { display: 'phoneNumber', name: 'phoneNumber' },
            value: '1234567890',
          },
        ],
      });

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('incomplete');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "incomplete" when phone is missing', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue(mockPersonComplete);
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue({
        attributes: [
          {
            attributeType: { display: 'emailId', name: 'emailId' },
            value: 'john@example.com',
          },
        ],
      });

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('incomplete');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "incomplete" when firstName is missing', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue({
        uuid: 'person-123',
        preferredName: {
          familyName: 'Doe',
        },
        gender: 'M',
        birthdate: '1990-01-01',
      });
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue(mockProviderComplete);

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('incomplete');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "incomplete" when lastName is missing', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue({
        uuid: 'person-123',
        preferredName: {
          givenName: 'John',
        },
        gender: 'M',
        birthdate: '1990-01-01',
      });
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue(mockProviderComplete);

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('incomplete');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "incomplete" when gender is missing', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue({
        uuid: 'person-123',
        preferredName: {
          givenName: 'John',
          familyName: 'Doe',
        },
        birthdate: '1990-01-01',
      });
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue(mockProviderComplete);

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('incomplete');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "incomplete" when birthdate is missing', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue({
        uuid: 'person-123',
        preferredName: {
          givenName: 'John',
          familyName: 'Doe',
        },
        gender: 'M',
      });
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue(mockProviderComplete);

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('incomplete');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "incomplete" when field is empty string', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue({
        uuid: 'person-123',
        preferredName: {
          givenName: 'John',
          familyName: '',
        },
        gender: 'M',
        birthdate: '1990-01-01',
      });
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue(mockProviderComplete);

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('incomplete');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });
  });

  describe('ProfileGuardProvider - Not Started', () => {
    it('should set profileState to "not-started" when person is null', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue(null);

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('not-started');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "not-started" when all fields are empty', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue({
        uuid: 'person-123',
      });
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue({
        attributes: [],
      });

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('not-started');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });

    it('should set profileState to "not-started" when user data is not found', async () => {
      (storage.getUser as any).mockReturnValue(null);

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('not-started');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
    });
  });

  describe('ProfileGuardProvider - Error Handling', () => {
    it('should handle API errors and set state to not-started', async () => {
      (profileService.getPersonByUuid as any).mockRejectedValue(
        new Error('API Error')
      );

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('not-started');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('false');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle provider fetch error gracefully', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue(mockPersonComplete);
      (profileService.getProvider as any).mockRejectedValue(new Error('Provider error'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('incomplete');
      });

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle missing provider results', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue(mockPersonComplete);
      (profileService.getProvider as any).mockResolvedValue({ results: [] });

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('incomplete');
      });
    });
  });

  describe('refreshProfileStatus', () => {
    it('should refresh profile status when called', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue({
        uuid: 'person-123',
        preferredName: {
          givenName: 'John',
          familyName: 'Doe',
        },
        gender: 'M',
        birthdate: '1990-01-01',
      });
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue({
        attributes: [
          {
            attributeType: { display: 'phoneNumber', name: 'phoneNumber' },
            value: '1234567890',
          },
        ],
      });

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('incomplete');
      });

      // Update mock to return complete profile
      (profileService.getPersonByUuid as any).mockResolvedValue(mockPersonComplete);
      (profileService.getProviderByUuid as any).mockResolvedValue(mockProviderComplete);

      // Click refresh button
      const refreshButton = getByTestId('refresh-button');
      refreshButton.click();

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('complete');
      });

      expect(getByTestId('isProfileComplete').textContent).toBe('true');
    });
  });

  describe('useProfileGuard Hook', () => {
    it('should return context when used within ProfileGuardProvider', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue(mockPersonComplete);
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue(mockProviderComplete);

      const { result } = renderHook(() => useProfileGuard(), {
        wrapper: ({ children }) => {
          const store = createTestStore();
          return (
            <Provider store={store}>
              <ProfileGuardProvider>{children}</ProfileGuardProvider>
            </Provider>
          );
        },
      });

      await waitFor(() => {
        expect(result.current.profileState).toBe('complete');
      });

      expect(result.current).toHaveProperty('isProfileComplete');
      expect(result.current).toHaveProperty('profileState');
      expect(result.current).toHaveProperty('refreshProfileStatus');
      expect(typeof result.current.refreshProfileStatus).toBe('function');
    });

    it('should throw error when used outside ProfileGuardProvider', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useProfileGuard());
      }).toThrow('useProfileGuard must be used within ProfileGuardProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should provide correct context values', async () => {
      (profileService.getPersonByUuid as any).mockResolvedValue(mockPersonComplete);
      (profileService.getProvider as any).mockResolvedValue({
        results: [{ uuid: 'provider-123' }],
      });
      (profileService.getProviderByUuid as any).mockResolvedValue(mockProviderComplete);

      const { result } = renderHook(() => useProfileGuard(), {
        wrapper: ({ children }) => {
          const store = createTestStore();
          return (
            <Provider store={store}>
              <ProfileGuardProvider>{children}</ProfileGuardProvider>
            </Provider>
          );
        },
      });

      await waitFor(() => {
        expect(result.current.profileState).toBe('complete');
      });

      expect(result.current.isProfileComplete).toBe(true);
      expect(result.current.profileState).toBe('complete');
    });
  });

  describe('ProfileGuardProvider - Test Mode Coverage', () => {
    it('covers lines 130-133: should set not-started when in test mode without VITE_SKIP_TEST_MODE', async () => {
      // Remove VITE_SKIP_TEST_MODE to test the early return in test mode
      delete (import.meta.env as any).VITE_SKIP_TEST_MODE;

      const TestComponent = () => {
        const { profileState, isProfileComplete } = useProfileGuard();
        return (
          <div>
            <span data-testid="profileState">{profileState}</span>
            <span data-testid="isComplete">{String(isProfileComplete)}</span>
          </div>
        );
      };

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should get early return with not-started
      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('not-started');
        expect(getByTestId('isComplete').textContent).toBe('false');
      });

      // Restore VITE_SKIP_TEST_MODE for other tests
      Object.defineProperty(import.meta.env, 'VITE_SKIP_TEST_MODE', {
        value: 'true',
        writable: true,
        configurable: true,
        enumerable: true,
      });
    });

    it('covers lines 147-150: should set not-started when personUuid is not found', async () => {
      // Mock user without person.uuid
      (storage.getUser as any).mockReturnValue(
        JSON.stringify({
          uuid: 'user-123',
          // person is missing or doesn't have uuid
        })
      );

      const TestComponent = () => {
        const { profileState, isProfileComplete } = useProfileGuard();
        return (
          <div>
            <span data-testid="profileState">{profileState}</span>
            <span data-testid="isComplete">{String(isProfileComplete)}</span>
          </div>
        );
      };

      const { getByTestId } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('profileState').textContent).toBe('not-started');
        expect(getByTestId('isComplete').textContent).toBe('false');
      });

      // Restore mock
      (storage.getUser as any).mockReturnValue(JSON.stringify(mockUser));
    });
  });
});
