import { describe, expect, it } from 'vitest';
import { achievementReducer } from '../../reducers/achievement.reducer';
import { authReducer } from '../../reducers/auth.reducer';
import { rootReducer, type RootState } from '../../reducers/index';
import loaderReducer from '../../reducers/loader.reducer';

describe('rootReducer', () => {
  describe('Initial State', () => {
    it('should have correct initial state structure', () => {
      const state = rootReducer(undefined, { type: 'unknown' });

      expect(state).toHaveProperty('achievement');
      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('loader');

      expect(state.achievement).toBeDefined();
      expect(state.auth).toBeDefined();
      expect(state.loader).toBeDefined();
    });

    it('should initialize with correct default values', () => {
      const state = rootReducer(undefined, { type: 'unknown' });

      // Achievement state
      expect(state.achievement.rawData).toBeNull();
      expect(state.achievement.loading).toBe(false);
      expect(state.achievement.error).toBeNull();
      expect(state.achievement.localPatients).toEqual([]);

      // Auth state
      expect(state.auth.user).toBe(null);
      expect(state.auth.token).toBe(null);
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.loading).toBe(false);
      expect(state.auth.error).toBe(null);
      
      // Loader state
      expect(state.loader.globalLoading).toBe(false);
      expect(state.loader.globalCount).toBe(0);
      expect(state.loader.sections).toEqual({});
    });
  });

  describe('Reducer Integration', () => {
    it('should handle auth actions', () => {
      const state = rootReducer(undefined, { type: 'LOGIN_START' });
      
      expect(state.auth.loading).toBe(true);
      expect(state.auth.error).toBe(null);
      expect(state.loader).toBeDefined();
    });

    it('should handle loader actions', () => {
      const state = rootReducer(undefined, { type: 'loader/startLoading' });
      
      expect(state.loader.globalLoading).toBe(true);
      expect(state.loader.globalCount).toBe(1);
      expect(state.auth).toBeDefined();
    });
  });

  describe('State Isolation', () => {
    it('should not affect other reducers when updating auth', () => {
      const initialState = rootReducer(undefined, { type: 'unknown' });
      const loaderState = initialState.loader;
      
      const newState = rootReducer(initialState, { type: 'LOGIN_START' });
      
      expect(newState.loader).toEqual(loaderState);
      expect(newState.auth.loading).toBe(true);
    });

    it('should not affect other reducers when updating loader', () => {
      const initialState = rootReducer(undefined, { type: 'unknown' });
      const authState = initialState.auth;
      
      const newState = rootReducer(initialState, { type: 'loader/startLoading' });
      
      expect(newState.auth).toEqual(authState);
      expect(newState.loader.globalLoading).toBe(true);
    });
  });

  describe('Complex State Scenarios', () => {
    it('should handle multiple actions across different reducers', () => {
      let state = rootReducer(undefined, { type: 'LOGIN_START' });
      expect(state.auth.loading).toBe(true);
      
      state = rootReducer(state, { type: 'loader/startLoading' });
      expect(state.loader.globalLoading).toBe(true);
      
      state = rootReducer(state, { type: 'loader/stopLoading' });
      expect(state.loader.globalLoading).toBe(false);
      
      state = rootReducer(state, {
        type: 'LOGIN_SUCCESS',
        payload: {
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            roles: ['user'],
            permissions: ['read'],
            isActive: true,
            lastLogin: '2023-01-01T00:00:00Z',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          token: 'mock-token',
        },
      });
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.loading).toBe(false);
    });

    it('should handle concurrent auth and loader actions', () => {
      let state = rootReducer(undefined, { type: 'LOGIN_START' });
      state = rootReducer(state, { type: 'loader/startLoading' });
      
      expect(state.auth.loading).toBe(true);
      expect(state.loader.globalLoading).toBe(true);
      expect(state.loader.globalCount).toBe(1);
      
      state = rootReducer(state, { type: 'LOGIN_SUCCESS', payload: { user: null, token: 'token' } });
      state = rootReducer(state, { type: 'loader/stopLoading' });
      
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.loading).toBe(false);
      expect(state.loader.globalLoading).toBe(false);
      expect(state.loader.globalCount).toBe(0);
    });

    it('should handle error states across reducers', () => {
      let state = rootReducer(undefined, { type: 'LOGIN_START' });
      state = rootReducer(state, { type: 'loader/startLoading' });
      
      state = rootReducer(state, { 
        type: 'LOGIN_FAILURE', 
        payload: 'Authentication failed' 
      });
      
      expect(state.auth.loading).toBe(false);
      expect(state.auth.error).toBe('Authentication failed');
      expect(state.loader.globalLoading).toBe(true); // Loader should still be loading
    });
  });

  describe('Type Safety', () => {
    it('should have correct RootState type', () => {
      const state: RootState = rootReducer(undefined, { type: 'unknown' });

      // Achievement state type checking
      expect(state.achievement.rawData).toBeNull();
      expect(typeof state.achievement.loading).toBe('boolean');
      expect(state.achievement.error).toBeNull();
      expect(Array.isArray(state.achievement.localPatients)).toBe(true);

      // Auth state type checking
      expect(typeof state.auth.user).toBe('object');
      expect(typeof state.auth.token).toBe('object');
      expect(typeof state.auth.isAuthenticated).toBe('boolean');
      expect(typeof state.auth.loading).toBe('boolean');
      expect(typeof state.auth.error).toBe('object');
      
      // Loader state type checking
      expect(typeof state.loader.globalLoading).toBe('boolean');
      expect(typeof state.loader.globalCount).toBe('number');
      expect(typeof state.loader.sections).toBe('object');
    });

    it('should maintain type safety across all state properties', () => {
      const state = rootReducer(undefined, { type: 'unknown' });

      // Ensure all required properties exist
      expect(state).toHaveProperty('achievement');
      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('loader');
      
      // Ensure auth properties exist
      expect(state.auth).toHaveProperty('user');
      expect(state.auth).toHaveProperty('token');
      expect(state.auth).toHaveProperty('isAuthenticated');
      expect(state.auth).toHaveProperty('loading');
      expect(state.auth).toHaveProperty('error');
      
      // Ensure loader properties exist
      expect(state.loader).toHaveProperty('globalLoading');
      expect(state.loader).toHaveProperty('globalCount');
      expect(state.loader).toHaveProperty('sections');
    });

    it('should have immutable state structure', () => {
      const state1 = rootReducer(undefined, { type: 'unknown' });
      const state2 = rootReducer(state1, { type: 'LOGIN_START' });
      
      // Original state should not be mutated
      expect(state1.auth.loading).toBe(false);
      expect(state2.auth.loading).toBe(true);
      
      // State objects should be different references
      expect(state1).not.toBe(state2);
      expect(state1.auth).not.toBe(state2.auth);
    });
  });

  describe('Reducer Functionality', () => {
    it('should be a valid reducer function', () => {
      expect(typeof rootReducer).toBe('function');
    });

    it('should return a new state object', () => {
      const state1 = rootReducer(undefined, { type: 'unknown' });
      const state2 = rootReducer(state1, { type: 'LOGIN_START' });
      
      expect(state1).not.toBe(state2); // Different object references
      expect(state1).not.toEqual(state2); // Different content due to action
    });

    it('should handle unknown actions gracefully', () => {
      const initialState = rootReducer(undefined, { type: 'unknown' });
      const newState = rootReducer(initialState, { type: 'UNKNOWN_ACTION' });
      
      expect(newState).toEqual(initialState);
    });

    it('should handle null/undefined actions', () => {
      const state = rootReducer(undefined, { type: 'unknown' });
      const newState = rootReducer(state, { type: 'unknown' });
      
      expect(newState).toEqual(state);
    });
  });

  describe('Integration with Individual Reducers', () => {
    it('should use authReducer for auth state', () => {
      const rootState = rootReducer(undefined, { type: 'LOGIN_START' });
      const authState = authReducer(undefined, { type: 'LOGIN_START' });
      
      expect(rootState.auth).toEqual(authState);
    });

    it('should use loaderReducer for loader state', () => {
      const rootState = rootReducer(undefined, { type: 'loader/startLoading' });
      const loaderState = loaderReducer(undefined, { type: 'loader/startLoading' });

      expect(rootState.loader).toEqual(loaderState);
    });

    it('should use achievementReducer for achievement state', () => {
      const action = { type: 'achievement/fetchAchievementStart' };
      const rootState = rootReducer(undefined, action);
      const achievementState = achievementReducer(undefined, action);

      expect(rootState.achievement).toEqual(achievementState);
    });

    it('should maintain reducer independence', () => {
      const authAction = { type: 'LOGIN_START' };
      const loaderAction = { type: 'loader/startLoading' };
      
      const authOnlyState = rootReducer(undefined, authAction);
      const loaderOnlyState = rootReducer(undefined, loaderAction);
      const combinedState = rootReducer(
        rootReducer(undefined, authAction), 
        loaderAction
      );
      
      expect(combinedState.auth).toEqual(authOnlyState.auth);
      expect(combinedState.loader).toEqual(loaderOnlyState.loader);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty state object', () => {
      const state = rootReducer({} as RootState, { type: 'unknown' });
      
      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('loader');
    });

    it('should handle rapid successive actions', () => {
      let state = rootReducer(undefined, { type: 'unknown' });
      
      // Rapid auth actions
      state = rootReducer(state, { type: 'LOGIN_START' });
      state = rootReducer(state, { type: 'LOGIN_SUCCESS', payload: { user: null, token: 'token' } });
      state = rootReducer(state, { type: 'LOGOUT' });
      
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBe(null);
      expect(state.auth.token).toBe(null);
    });

    it('should handle loader count edge cases', () => {
      let state = rootReducer(undefined, { type: 'unknown' });
      
      // Multiple start loading
      state = rootReducer(state, { type: 'loader/startLoading' });
      state = rootReducer(state, { type: 'loader/startLoading' });
      state = rootReducer(state, { type: 'loader/startLoading' });
      
      expect(state.loader.globalCount).toBe(3);
      expect(state.loader.globalLoading).toBe(true);
      
      // Stop loading once
      state = rootReducer(state, { type: 'loader/stopLoading' });
      expect(state.loader.globalCount).toBe(2);
      expect(state.loader.globalLoading).toBe(true);
      
      // Stop all loading
      state = rootReducer(state, { type: 'loader/stopLoading' });
      state = rootReducer(state, { type: 'loader/stopLoading' });
      expect(state.loader.globalCount).toBe(0);
      expect(state.loader.globalLoading).toBe(false);
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state structure after multiple actions', () => {
      let state = rootReducer(undefined, { type: 'unknown' });
      
      // Perform various actions
      state = rootReducer(state, { type: 'LOGIN_START' });
      state = rootReducer(state, { type: 'loader/startLoading' });
      state = rootReducer(state, { type: 'LOGIN_SUCCESS', payload: { user: null, token: 'token' } });
      state = rootReducer(state, { type: 'loader/stopLoading' });
      
      // State should still have correct structure
      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('loader');
      expect(state.auth).toHaveProperty('user');
      expect(state.auth).toHaveProperty('token');
      expect(state.auth).toHaveProperty('isAuthenticated');
      expect(state.auth).toHaveProperty('loading');
      expect(state.auth).toHaveProperty('error');
      expect(state.loader).toHaveProperty('globalLoading');
      expect(state.loader).toHaveProperty('globalCount');
      expect(state.loader).toHaveProperty('sections');
    });

    it('should handle state transitions correctly', () => {
      let state = rootReducer(undefined, { type: 'unknown' });
      
      // Initial state
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.loading).toBe(false);
      expect(state.loader.globalLoading).toBe(false);
      
      // Login start
      state = rootReducer(state, { type: 'LOGIN_START' });
      expect(state.auth.loading).toBe(true);
      expect(state.auth.isAuthenticated).toBe(false);
      
      // Login success
      state = rootReducer(state, { 
        type: 'LOGIN_SUCCESS', 
        payload: { user: null, token: 'token' } 
      });
      expect(state.auth.loading).toBe(false);
      expect(state.auth.isAuthenticated).toBe(true);
      
      // Logout
      state = rootReducer(state, { type: 'LOGOUT' });
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBe(null);
      expect(state.auth.token).toBe(null);
    });
  });
});