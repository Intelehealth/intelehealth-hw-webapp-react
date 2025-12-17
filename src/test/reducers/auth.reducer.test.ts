import { describe, expect, it } from 'vitest';
import { authReducer, type AuthAction } from '../../reducers/auth.reducer';
import type { AuthState, User } from '../../types/auth/auth.types';

describe('authReducer', () => {
  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    roles: [{
      display: 'user',
      uuid: '',
      name: 'user'
    }],
    name: '',
    uuid: '',
    person: {
      uuid: '',
      display: ''
    }
  };

  const mockToken = 'mock-jwt-token';

  const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  describe('Initial State', () => {
    it('should return initial state when no action is provided', () => {
      const result = authReducer(undefined, {} as AuthAction);
      expect(result).toEqual(initialState);
    });

    it('should return initial state for unknown action', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION' } as unknown as AuthAction;
      const result = authReducer(initialState, unknownAction);
      expect(result).toEqual(initialState);
    });
  });

  describe('LOGIN_START', () => {
    it('should set loading to true and clear error', () => {
      const stateWithError: AuthState = {
        ...initialState,
        error: 'Previous error',
      };

      const action: AuthAction = { type: 'LOGIN_START' };
      const result = authReducer(stateWithError, action);

      expect(result).toEqual({
        ...stateWithError,
        loading: true,
        error: null,
      });
    });

    it('should preserve other state properties', () => {
      const customState: AuthState = {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

      const action: AuthAction = { type: 'LOGIN_START' };
      const result = authReducer(customState, action);

      expect(result).toEqual({
        ...customState,
        loading: true,
        error: null,
      });
    });
  });

  describe('LOGIN_SUCCESS', () => {
    it('should set user, token, isAuthenticated to true, and clear loading and error', () => {
      const loadingState: AuthState = {
        ...initialState,
        loading: true,
        error: 'Previous error',
      };

      const action: AuthAction = {
        type: 'LOGIN_SUCCESS',
        payload: { user: mockUser, token: mockToken },
      };
      const result = authReducer(loadingState, action);

      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
    });

    it('should handle different user data', () => {
      const differentUser: User = {
        ...mockUser,
        id: '2',
        username: 'differentuser',
        email: 'different@example.com',
      };

      const action: AuthAction = {
        type: 'LOGIN_SUCCESS',
        payload: { user: differentUser, token: 'different-token' },
      };
      const result = authReducer(initialState, action);

      expect(result.user).toEqual(differentUser);
      expect(result.token).toBe('different-token');
      expect(result.isAuthenticated).toBe(true);
      expect(result.loading).toBe(false);
      expect(result.error).toBe(null);
    });
  });

  describe('LOGIN_FAILURE', () => {
    it('should set error message and clear loading', () => {
      const loadingState: AuthState = {
        ...initialState,
        loading: true,
      };

      const action: AuthAction = {
        type: 'LOGIN_FAILURE',
        payload: 'Invalid credentials',
      };
      const result = authReducer(loadingState, action);

      expect(result).toEqual({
        ...loadingState,
        loading: false,
        error: 'Invalid credentials',
      });
    });

    it('should handle different error messages', () => {
      const errorMessages = [
        'Network error',
        'Server unavailable',
        'Invalid username or password',
        'Account locked',
      ];

      errorMessages.forEach((errorMessage) => {
        const action: AuthAction = {
          type: 'LOGIN_FAILURE',
          payload: errorMessage,
        };
        const result = authReducer(initialState, action);

        expect(result.error).toBe(errorMessage);
        expect(result.loading).toBe(false);
      });
    });

    it('should preserve other state properties', () => {
      const stateWithUser: AuthState = {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        loading: true,
        error: null,
      };

      const action: AuthAction = {
        type: 'LOGIN_FAILURE',
        payload: 'Login failed',
      };
      const result = authReducer(stateWithUser, action);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(mockToken);
      expect(result.isAuthenticated).toBe(true);
      expect(result.loading).toBe(false);
      expect(result.error).toBe('Login failed');
    });
  });

  describe('LOGOUT', () => {
    it('should reset state to initial state', () => {
      const authenticatedState: AuthState = {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

      const action: AuthAction = { type: 'LOGOUT' };
      const result = authReducer(authenticatedState, action);

      expect(result).toEqual(initialState);
    });

    it('should reset state even when there are errors', () => {
      const errorState: AuthState = {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        loading: false,
        error: 'Some error',
      };

      const action: AuthAction = { type: 'LOGOUT' };
      const result = authReducer(errorState, action);

      expect(result).toEqual(initialState);
    });

    it('should reset state even when loading', () => {
      const loadingState: AuthState = {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        loading: true,
        error: null,
      };

      const action: AuthAction = { type: 'LOGOUT' };
      const result = authReducer(loadingState, action);

      expect(result).toEqual(initialState);
    });
  });

  describe('CLEAR_ERROR', () => {
    it('should clear error while preserving other state', () => {
      const stateWithError: AuthState = {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        loading: false,
        error: 'Some error message',
      };

      const action: AuthAction = { type: 'CLEAR_ERROR' };
      const result = authReducer(stateWithError, action);

      expect(result).toEqual({
        ...stateWithError,
        error: null,
      });
    });

    it('should handle clearing error when no error exists', () => {
      const stateWithoutError: AuthState = {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

      const action: AuthAction = { type: 'CLEAR_ERROR' };
      const result = authReducer(stateWithoutError, action);

      expect(result).toEqual(stateWithoutError);
    });
  });

  describe('State Transitions', () => {
    it('should handle complete login flow', () => {
      let state = authReducer(initialState, { type: 'LOGIN_START' });
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);

      state = authReducer(state, {
        type: 'LOGIN_SUCCESS',
        payload: { user: mockUser, token: mockToken },
      });
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle login failure flow', () => {
      let state = authReducer(initialState, { type: 'LOGIN_START' });
      expect(state.loading).toBe(true);

      state = authReducer(state, {
        type: 'LOGIN_FAILURE',
        payload: 'Login failed',
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Login failed');
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle logout after successful login', () => {
      let state = authReducer(initialState, { type: 'LOGIN_START' });
      state = authReducer(state, {
        type: 'LOGIN_SUCCESS',
        payload: { user: mockUser, token: mockToken },
      });

      state = authReducer(state, { type: 'LOGOUT' });
      expect(state).toEqual(initialState);
    });

    it('should handle error clearing after failure', () => {
      let state = authReducer(initialState, { type: 'LOGIN_START' });
      state = authReducer(state, {
        type: 'LOGIN_FAILURE',
        payload: 'Login failed',
      });

      state = authReducer(state, { type: 'CLEAR_ERROR' });
      expect(state.error).toBe(null);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string error messages', () => {
      const action: AuthAction = {
        type: 'LOGIN_FAILURE',
        payload: '',
      };
      const result = authReducer(initialState, action);

      expect(result.error).toBe('');
      expect(result.loading).toBe(false);
    });

    it('should handle null user in LOGIN_SUCCESS', () => {
      const action: AuthAction = {
        type: 'LOGIN_SUCCESS',
        payload: { user: null as unknown as User, token: mockToken },
      };
      const result = authReducer(initialState, action);

      expect(result.user).toBe(null);
      expect(result.token).toBe(mockToken);
      expect(result.isAuthenticated).toBe(true);
    });

    it('should handle empty token in LOGIN_SUCCESS', () => {
      const action: AuthAction = {
        type: 'LOGIN_SUCCESS',
        payload: { user: mockUser, token: '' },
      };
      const result = authReducer(initialState, action);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe('');
      expect(result.isAuthenticated).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for all action types', () => {
      const actions: AuthAction[] = [
        { type: 'LOGIN_START' },
        { type: 'LOGIN_SUCCESS', payload: { user: mockUser, token: mockToken } },
        { type: 'LOGIN_FAILURE', payload: 'Error message' },
        { type: 'LOGOUT' },
        { type: 'CLEAR_ERROR' },
      ];

      actions.forEach((action) => {
        const result = authReducer(initialState, action);
        expect(result).toBeDefined();
        expect(typeof result.loading).toBe('boolean');
        expect(typeof result.isAuthenticated).toBe('boolean');
        expect(result.error === null || typeof result.error === 'string').toBe(true);
      });
    });
  });
});
