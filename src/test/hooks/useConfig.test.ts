import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useConfig } from '../../hooks/useConfig';
import type { AppConfig } from '../../types/config.types';
import type { RootState } from '../../reducers';

// Mock useSelector
const mockUseSelector = vi.fn();
vi.mock('react-redux', () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
}));

describe('useConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should return null config when no config is loaded', () => {
      const mockState: Partial<RootState> = {
        config: {
          data: null,
          error: null,
          lastFetched: null,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.lastFetched).toBeNull();
    });

    it('should return config data when config is loaded', () => {
      const mockConfig: AppConfig = {
        version: '1.0.0',
        apiEndpoint: 'https://api.example.com',
        specialization: [{ id: '1', name: 'Cardiology' }],
        language: [{ code: 'en', name: 'English' }],
      };

      const mockState: Partial<RootState> = {
        config: {
          data: mockConfig,
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config).toEqual(mockConfig);
      expect(result.current.error).toBeNull();
      expect(result.current.lastFetched).toBeGreaterThan(0);
    });

    it('should return error when config fetch fails', () => {
      const errorMessage = 'Failed to fetch configuration';
      const mockState: Partial<RootState> = {
        config: {
          data: null,
          error: errorMessage,
          lastFetched: null,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.lastFetched).toBeNull();
    });
  });

  describe('Config Data Access', () => {
    it('should return config with all properties', () => {
      const fullConfig: AppConfig = {
        version: '1.0.0',
        apiEndpoint: 'https://api.example.com',
        specialization: [{ id: '1', name: 'Cardiology' }],
        language: [{ code: 'en', name: 'English' }],
        patient_registration: { field: 'value' },
        theme_config: [{ key: 'theme', value: 'light' }],
        patient_vitals: [{ name: 'Blood Pressure', key: 'bp', uuid: 'uuid-bp', is_mandatory: false, lang: null, is_enabled: true }],
        patient_diagnostics: [{ type: 'xray' }],
        webrtc_section: true,
        webrtc: { enabled: true },
        patient_visit_summary: { showDetails: true },
        patient_vitals_section: true,
        patient_reg_other: false,
        patient_reg_address: true,
        abha_section: false,
        sidebar_menus: { dashboard: true, patients: true },
        patient_visit_sections: [{ id: '1', name: 'Vital Signs' }],
        dropdown_values: [{ key: 'gender', values: ['Male', 'Female'] }],
        patient_diagnostics_section: true,
        ai_llm_section: false,
        ai_llm_recording_section: false,
      };

      const mockState: Partial<RootState> = {
        config: {
          data: fullConfig,
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config).toEqual(fullConfig);
      expect(result.current.config?.version).toBe('1.0.0');
      expect(result.current.config?.apiEndpoint).toBe('https://api.example.com');
      expect(result.current.config?.webrtc_section).toBe(true);
    });

    it('should return empty config object', () => {
      const emptyConfig: AppConfig = {};

      const mockState: Partial<RootState> = {
        config: {
          data: emptyConfig,
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config).toEqual({});
    });

    it('should access nested config properties', () => {
      const configWithNested: AppConfig = {
        webrtc: {
          enabled: true,
          stunServers: ['stun:stun.example.com:19302'],
        },
        patient_visit_summary: {
          showDetails: true,
          sections: ['vitals', 'history'],
        },
        sidebar_menus: {
          dashboard: true,
          patients: true,
          appointments: false,
        },
      };

      const mockState: Partial<RootState> = {
        config: {
          data: configWithNested,
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config?.webrtc).toBeDefined();
      expect(result.current.config?.patient_visit_summary).toBeDefined();
      expect(result.current.config?.sidebar_menus).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return error message on fetch failure', () => {
      const mockState: Partial<RootState> = {
        config: {
          data: null,
          error: 'Network error',
          lastFetched: null,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.error).toBe('Network error');
    });

    it('should return error with existing config', () => {
      const mockConfig: AppConfig = { version: '1.0.0' };
      const mockState: Partial<RootState> = {
        config: {
          data: mockConfig,
          error: 'Refresh failed',
          lastFetched: Date.now() - 10000,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config).toEqual(mockConfig);
      expect(result.current.error).toBe('Refresh failed');
    });

    it('should handle different error messages', () => {
      const errors = [
        'Network error',
        'Timeout error',
        '404 Not Found',
        '500 Internal Server Error',
      ];

      errors.forEach((errorMessage) => {
        const mockState: Partial<RootState> = {
          config: {
            data: null,
            error: errorMessage,
            lastFetched: null,
          },
        };

        mockUseSelector.mockImplementation((selector) => selector(mockState));

        const { result } = renderHook(() => useConfig());

        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('LastFetched Timestamp', () => {
    it('should return lastFetched timestamp', () => {
      const timestamp = Date.now();
      const mockConfig: AppConfig = { version: '1.0.0' };

      const mockState: Partial<RootState> = {
        config: {
          data: mockConfig,
          error: null,
          lastFetched: timestamp,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.lastFetched).toBe(timestamp);
    });

    it('should return null lastFetched when no config loaded', () => {
      const mockState: Partial<RootState> = {
        config: {
          data: null,
          error: null,
          lastFetched: null,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.lastFetched).toBeNull();
    });

    it('should track different fetch timestamps', () => {
      const timestamp1 = Date.now();
      const mockState1: Partial<RootState> = {
        config: {
          data: { version: '1.0.0' },
          error: null,
          lastFetched: timestamp1,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState1));
      const { result: result1 } = renderHook(() => useConfig());
      expect(result1.current.lastFetched).toBe(timestamp1);

      const timestamp2 = Date.now() + 1000;
      const mockState2: Partial<RootState> = {
        config: {
          data: { version: '2.0.0' },
          error: null,
          lastFetched: timestamp2,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState2));
      const { result: result2 } = renderHook(() => useConfig());
      expect(result2.current.lastFetched).toBe(timestamp2);
      expect(result2.current.lastFetched).toBeGreaterThan(timestamp1);
    });
  });

  describe('Config State Transitions', () => {
    it('should handle transition from null to loaded config', () => {
      // Initial state - no config
      const initialState: Partial<RootState> = {
        config: {
          data: null,
          error: null,
          lastFetched: null,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(initialState));
      const { result: initialResult } = renderHook(() => useConfig());

      expect(initialResult.current.config).toBeNull();

      // After fetch - config loaded
      const loadedState: Partial<RootState> = {
        config: {
          data: { version: '1.0.0' },
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(loadedState));
      const { result: loadedResult } = renderHook(() => useConfig());

      expect(loadedResult.current.config).not.toBeNull();
      expect(loadedResult.current.config?.version).toBe('1.0.0');
    });

    it('should handle transition from error to success', () => {
      // Initial state - error
      const errorState: Partial<RootState> = {
        config: {
          data: null,
          error: 'Failed to fetch',
          lastFetched: null,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(errorState));
      const { result: errorResult } = renderHook(() => useConfig());

      expect(errorResult.current.error).toBe('Failed to fetch');

      // After retry - success
      const successState: Partial<RootState> = {
        config: {
          data: { version: '1.0.0' },
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(successState));
      const { result: successResult } = renderHook(() => useConfig());

      expect(successResult.current.error).toBeNull();
      expect(successResult.current.config).not.toBeNull();
    });

    it('should handle config update', () => {
      // Old config
      const oldState: Partial<RootState> = {
        config: {
          data: { version: '1.0.0' },
          error: null,
          lastFetched: Date.now() - 10000,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(oldState));
      const { result: oldResult } = renderHook(() => useConfig());

      expect(oldResult.current.config?.version).toBe('1.0.0');

      // New config
      const newState: Partial<RootState> = {
        config: {
          data: { version: '2.0.0', apiEndpoint: 'https://new-api.example.com' },
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(newState));
      const { result: newResult } = renderHook(() => useConfig());

      expect(newResult.current.config?.version).toBe('2.0.0');
      expect(newResult.current.config?.apiEndpoint).toBe('https://new-api.example.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle config with null values', () => {
      const configWithNulls: AppConfig = {
        version: '1.0.0',
        apiEndpoint: null as any,
        specialization: null as any,
      };

      const mockState: Partial<RootState> = {
        config: {
          data: configWithNulls,
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config).toEqual(configWithNulls);
    });

    it('should handle config with undefined values', () => {
      const configWithUndefined: AppConfig = {
        version: '1.0.0',
        apiEndpoint: undefined,
        specialization: undefined,
      };

      const mockState: Partial<RootState> = {
        config: {
          data: configWithUndefined,
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config?.version).toBe('1.0.0');
      expect(result.current.config?.apiEndpoint).toBeUndefined();
    });

    it('should handle very large config objects', () => {
      const largeConfig: AppConfig = {
        version: '1.0.0',
        specialization: Array(1000)
          .fill(null)
          .map((_, i) => ({ id: `${i}`, name: `Spec ${i}` })),
      };

      const mockState: Partial<RootState> = {
        config: {
          data: largeConfig,
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config?.specialization).toHaveLength(1000);
    });

    it('should handle config with special characters', () => {
      const configWithSpecialChars: AppConfig = {
        version: '1.0.0',
        apiEndpoint: 'https://api.example.com?param=<test>&foo=bar',
      };

      const mockState: Partial<RootState> = {
        config: {
          data: configWithSpecialChars,
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current.config?.apiEndpoint).toBe(
        'https://api.example.com?param=<test>&foo=bar'
      );
    });
  });

  describe('Return Value Structure', () => {
    it('should always return an object with config, error, and lastFetched', () => {
      const mockState: Partial<RootState> = {
        config: {
          data: { version: '1.0.0' },
          error: null,
          lastFetched: Date.now(),
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(result.current).toHaveProperty('config');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('lastFetched');
    });

    it('should maintain consistent return structure', () => {
      const mockState: Partial<RootState> = {
        config: {
          data: null,
          error: null,
          lastFetched: null,
        },
      };

      mockUseSelector.mockImplementation((selector) => selector(mockState));

      const { result } = renderHook(() => useConfig());

      expect(Object.keys(result.current)).toEqual(['config', 'error', 'lastFetched']);
    });
  });
});
