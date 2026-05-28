import { describe, expect, it } from 'vitest';
import {
  configReducer,
  fetchConfigSuccess,
  fetchConfigFailure,
  clearConfigError,
  resetConfig,
} from '../../reducers/config.reducer';
import type { AppConfig } from '../../types/config.types';

describe('configReducer', () => {
  const initialState = {
    data: null,
    error: null,
    lastFetched: null,
  };

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = configReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });

    it('should return initial state for undefined action', () => {
      const state = configReducer(undefined, { type: '@@INIT' } as any);
      expect(state).toEqual(initialState);
    });
  });

  describe('fetchConfigSuccess', () => {
    it('should store config data on success', () => {
      const mockConfig: AppConfig = {
        version: '1.0.0',
        apiEndpoint: 'https://api.example.com',
        specialization: [{ id: '1', name: 'Cardiology' }],
        language: [{ code: 'en', name: 'English', en_name: 'English', is_default: true, platform: 'Both', is_enabled: true }],
      };

      const action = fetchConfigSuccess(mockConfig);
      const state = configReducer(initialState, action);

      expect(state.data).toEqual(mockConfig);
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeGreaterThan(0);
      expect(typeof state.lastFetched).toBe('number');
    });

    it('should update existing config with new data', () => {
      const existingState = {
        data: {
          version: '1.0.0',
          apiEndpoint: 'https://old-api.example.com',
        } as AppConfig,
        error: 'Some error',
        lastFetched: Date.now() - 10000,
      };

      const newConfig: AppConfig = {
        version: '2.0.0',
        apiEndpoint: 'https://new-api.example.com',
        specialization: [{ id: '1', name: 'Neurology' }],
      };

      const action = fetchConfigSuccess(newConfig);
      const state = configReducer(existingState, action);

      expect(state.data).toEqual(newConfig);
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeGreaterThan(existingState.lastFetched);
    });

    it('should clear previous error on success', () => {
      const stateWithError = {
        data: null,
        error: 'Previous error message',
        lastFetched: null,
      };

      const mockConfig: AppConfig = { version: '1.0.0' };
      const action = fetchConfigSuccess(mockConfig);
      const state = configReducer(stateWithError, action);

      expect(state.error).toBeNull();
      expect(state.data).toEqual(mockConfig);
    });

    it('should handle empty config object', () => {
      const emptyConfig: AppConfig = {};
      const action = fetchConfigSuccess(emptyConfig);
      const state = configReducer(initialState, action);

      expect(state.data).toEqual({});
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeGreaterThan(0);
    });

    it('should handle config with all properties', () => {
      const fullConfig: AppConfig = {
        version: '1.0.0',
        apiEndpoint: 'https://api.example.com',
        specialization: [{ id: '1' }],
        language: [{ code: 'en', name: 'English', en_name: 'English', is_default: true, platform: 'Both', is_enabled: true }],
        patient_registration: { field: 'value' },
        theme_config: [{ key: 'theme' }],
        patient_vitals: [{ name: 'Blood Pressure', key: 'bp', uuid: 'uuid-bp', is_mandatory: false, lang: null, is_enabled: true }],
        patient_diagnostics: [{ type: 'xray' }],
        webrtc_section: true,
        webrtc: { enabled: true },
        patient_visit_summary: { show: true },
        patient_vitals_section: true,
        patient_reg_other: false,
        patient_reg_address: true,
        abha_section: false,
        sidebar_menus: { dashboard: true },
        patient_visit_sections: [{ id: '1' }],
        dropdown_values: [{ key: 'val' }],
        patient_diagnostics_section: true,
        ai_llm_section: false,
        ai_llm_recording_section: false,
      };

      const action = fetchConfigSuccess(fullConfig);
      const state = configReducer(initialState, action);

      expect(state.data).toEqual(fullConfig);
      expect(state.error).toBeNull();
    });

    it('should set lastFetched timestamp correctly', () => {
      const beforeTimestamp = Date.now();
      const mockConfig: AppConfig = { version: '1.0.0' };
      const action = fetchConfigSuccess(mockConfig);
      const state = configReducer(initialState, action);
      const afterTimestamp = Date.now();

      expect(state.lastFetched).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(state.lastFetched).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe('fetchConfigFailure', () => {
    it('should store error message on failure', () => {
      const errorMessage = 'Failed to fetch configuration';
      const action = fetchConfigFailure(errorMessage);
      const state = configReducer(initialState, action);

      expect(state.error).toBe(errorMessage);
      expect(state.data).toBeNull();
      expect(state.lastFetched).toBeNull();
    });

    it('should update error while keeping existing data', () => {
      const existingState = {
        data: { version: '1.0.0' } as AppConfig,
        error: null,
        lastFetched: Date.now(),
      };

      const errorMessage = 'Network error';
      const action = fetchConfigFailure(errorMessage);
      const state = configReducer(existingState, action);

      expect(state.error).toBe(errorMessage);
      expect(state.data).toEqual(existingState.data);
      expect(state.lastFetched).toBe(existingState.lastFetched);
    });

    it('should handle empty error message', () => {
      const action = fetchConfigFailure('');
      const state = configReducer(initialState, action);

      expect(state.error).toBe('');
      expect(state.data).toBeNull();
    });

    it('should handle different error messages', () => {
      const errorMessages = [
        'Network error',
        'Timeout error',
        '404 Not Found',
        '500 Internal Server Error',
        'Failed to fetch configuration',
      ];

      errorMessages.forEach((errorMessage) => {
        const action = fetchConfigFailure(errorMessage);
        const state = configReducer(initialState, action);
        expect(state.error).toBe(errorMessage);
      });
    });

    it('should replace previous error with new error', () => {
      const stateWithError = {
        data: null,
        error: 'Old error',
        lastFetched: null,
      };

      const newError = 'New error';
      const action = fetchConfigFailure(newError);
      const state = configReducer(stateWithError, action);

      expect(state.error).toBe(newError);
    });
  });

  describe('clearConfigError', () => {
    it('should clear error while keeping data', () => {
      const stateWithError = {
        data: { version: '1.0.0' } as AppConfig,
        error: 'Some error',
        lastFetched: Date.now(),
      };

      const action = clearConfigError();
      const state = configReducer(stateWithError, action);

      expect(state.error).toBeNull();
      expect(state.data).toEqual(stateWithError.data);
      expect(state.lastFetched).toBe(stateWithError.lastFetched);
    });

    it('should work when error is already null', () => {
      const stateWithoutError = {
        data: { version: '1.0.0' } as AppConfig,
        error: null,
        lastFetched: Date.now(),
      };

      const action = clearConfigError();
      const state = configReducer(stateWithoutError, action);

      expect(state.error).toBeNull();
      expect(state).toEqual(stateWithoutError);
    });

    it('should clear error from initial state', () => {
      const action = clearConfigError();
      const state = configReducer(initialState, action);

      expect(state).toEqual(initialState);
    });
  });

  describe('resetConfig', () => {
    it('should reset to initial state', () => {
      const complexState = {
        data: {
          version: '1.0.0',
          apiEndpoint: 'https://api.example.com',
          specialization: [{ id: '1', name: 'Cardiology' }],
        } as AppConfig,
        error: 'Some error',
        lastFetched: Date.now(),
      };

      const action = resetConfig();
      const state = configReducer(complexState, action);

      expect(state).toEqual(initialState);
    });

    it('should reset when state is already initial', () => {
      const action = resetConfig();
      const state = configReducer(initialState, action);

      expect(state).toEqual(initialState);
    });

    it('should clear all data, error, and timestamp', () => {
      const stateWithData = {
        data: { version: '2.0.0' } as AppConfig,
        error: 'Error message',
        lastFetched: 1234567890,
      };

      const action = resetConfig();
      const state = configReducer(stateWithData, action);

      expect(state.data).toBeNull();
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeNull();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complete fetch cycle - success then failure', () => {
      const mockConfig: AppConfig = { version: '1.0.0' };

      let state = configReducer(initialState, fetchConfigSuccess(mockConfig));
      expect(state.data).toEqual(mockConfig);
      expect(state.error).toBeNull();

      state = configReducer(state, fetchConfigFailure('Network error'));
      expect(state.error).toBe('Network error');
      expect(state.data).toEqual(mockConfig);

      state = configReducer(state, clearConfigError());
      expect(state.error).toBeNull();
    });

    it('should handle multiple successful fetches', () => {
      const config1: AppConfig = { version: '1.0.0' };
      const config2: AppConfig = { version: '2.0.0' };
      const config3: AppConfig = { version: '3.0.0' };

      let state = configReducer(initialState, fetchConfigSuccess(config1));
      const timestamp1 = state.lastFetched;

      state = configReducer(state, fetchConfigSuccess(config2));
      const timestamp2 = state.lastFetched;

      state = configReducer(state, fetchConfigSuccess(config3));
      const timestamp3 = state.lastFetched;

      expect(state.data).toEqual(config3);
      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1!);
      expect(timestamp3).toBeGreaterThanOrEqual(timestamp2!);
    });

    it('should handle error then success', () => {
      let state = configReducer(initialState, fetchConfigFailure('Error'));
      expect(state.error).toBe('Error');

      const mockConfig: AppConfig = { version: '1.0.0' };
      state = configReducer(state, fetchConfigSuccess(mockConfig));
      expect(state.error).toBeNull();
      expect(state.data).toEqual(mockConfig);
    });

    it('should handle reset after multiple operations', () => {
      let state = configReducer(initialState, fetchConfigSuccess({ version: '1.0.0' }));
      state = configReducer(state, fetchConfigFailure('Error'));
      state = configReducer(state, clearConfigError());
      state = configReducer(state, resetConfig());

      expect(state).toEqual(initialState);
    });
  });

  describe('Edge Cases', () => {
    it('should handle config with null values', () => {
      const configWithNulls: AppConfig = {
        version: '1.0.0',
        apiEndpoint: null as any,
        specialization: null as any,
      };

      const action = fetchConfigSuccess(configWithNulls);
      const state = configReducer(initialState, action);

      expect(state.data).toEqual(configWithNulls);
    });

    it('should handle config with undefined values', () => {
      const configWithUndefined: AppConfig = {
        version: '1.0.0',
        apiEndpoint: undefined,
        specialization: undefined,
      };

      const action = fetchConfigSuccess(configWithUndefined);
      const state = configReducer(initialState, action);

      expect(state.data).toEqual(configWithUndefined);
    });

    it('should handle very long error messages', () => {
      const longError = 'Error: '.repeat(1000);
      const action = fetchConfigFailure(longError);
      const state = configReducer(initialState, action);

      expect(state.error).toBe(longError);
    });

    it('should handle special characters in error messages', () => {
      const specialError = 'Error: <script>alert("xss")</script> & symbols!@#$%^&*()';
      const action = fetchConfigFailure(specialError);
      const state = configReducer(initialState, action);

      expect(state.error).toBe(specialError);
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types for all state properties', () => {
      let state = configReducer(initialState, fetchConfigSuccess({ version: '1.0.0' }));

      expect(state.data).toBeDefined();
      expect(state.error).toBeNull();
      expect(typeof state.lastFetched).toBe('number');

      state = configReducer(state, fetchConfigFailure('Error'));
      expect(typeof state.error).toBe('string');
    });
  });
});
