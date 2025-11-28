import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { fetchConfig, clearConfigError, resetConfig } from '../../actions/config.actions';
import { configService } from '../../services/config.service';
import {
  fetchConfigSuccess,
  fetchConfigFailure,
} from '../../reducers/config.reducer';
import type { AppConfig } from '../../types/config.types';

// Mock the config service
vi.mock('../../services/config.service', () => ({
  configService: {
    getPublishedConfig: vi.fn(),
  },
}));

describe('Config Actions', () => {
  let mockDispatch: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch = vi.fn();
  });

  describe('fetchConfig', () => {
    it('should dispatch fetchConfigSuccess on successful API call', async () => {
      const mockConfig: AppConfig = {
        version: '1.0.0',
        apiEndpoint: 'https://api.example.com',
        specialization: [{ id: '1', name: 'Cardiology' }],
        language: [{ code: 'en', name: 'English' }],
      };

      vi.mocked(configService.getPublishedConfig).mockResolvedValue(mockConfig);

      const thunk = fetchConfig();
      const result = await thunk(mockDispatch);

      expect(configService.getPublishedConfig).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigSuccess(mockConfig));
      expect(result).toEqual(mockConfig);
    });

    it('should call configService.getPublishedConfig', async () => {
      const mockConfig: AppConfig = { version: '1.0.0' };
      vi.mocked(configService.getPublishedConfig).mockResolvedValue(mockConfig);

      const thunk = fetchConfig();
      await thunk(mockDispatch);

      expect(configService.getPublishedConfig).toHaveBeenCalledTimes(1);
      expect(configService.getPublishedConfig).toHaveBeenCalledWith();
    });

    it('should dispatch fetchConfigFailure on API error', async () => {
      const errorMessage = 'Network error';
      const error = new Error(errorMessage);

      vi.mocked(configService.getPublishedConfig).mockRejectedValue(error);

      const thunk = fetchConfig();

      await expect(thunk(mockDispatch)).rejects.toThrow(errorMessage);

      expect(configService.getPublishedConfig).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigFailure(errorMessage));
    });

    it('should handle non-Error objects thrown by service', async () => {
      const errorObject = { message: 'Custom error' };
      vi.mocked(configService.getPublishedConfig).mockRejectedValue(errorObject);

      const thunk = fetchConfig();

      await expect(thunk(mockDispatch)).rejects.toEqual(errorObject);

      expect(mockDispatch).toHaveBeenCalledWith(
        fetchConfigFailure('Failed to fetch configuration')
      );
    });

    it('should handle empty config response', async () => {
      const emptyConfig: AppConfig = {};
      vi.mocked(configService.getPublishedConfig).mockResolvedValue(emptyConfig);

      const thunk = fetchConfig();
      const result = await thunk(mockDispatch);

      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigSuccess(emptyConfig));
      expect(result).toEqual(emptyConfig);
    });

    it('should handle config with all properties', async () => {
      const fullConfig: AppConfig = {
        version: '1.0.0',
        apiEndpoint: 'https://api.example.com',
        specialization: [{ id: '1' }],
        language: [{ code: 'en' }],
        patient_registration: { field: 'value' },
        theme_config: [{ key: 'theme' }],
        patient_vitals: [{ type: 'bp' }],
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

      vi.mocked(configService.getPublishedConfig).mockResolvedValue(fullConfig);

      const thunk = fetchConfig();
      const result = await thunk(mockDispatch);

      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigSuccess(fullConfig));
      expect(result).toEqual(fullConfig);
    });

    it('should return the config data', async () => {
      const mockConfig: AppConfig = {
        version: '2.0.0',
        apiEndpoint: 'https://dev.example.com',
      };

      vi.mocked(configService.getPublishedConfig).mockResolvedValue(mockConfig);

      const thunk = fetchConfig();
      const result = await thunk(mockDispatch);

      expect(result).toEqual(mockConfig);
    });

    it('should throw error on failure', async () => {
      const error = new Error('Timeout error');
      vi.mocked(configService.getPublishedConfig).mockRejectedValue(error);

      const thunk = fetchConfig();

      await expect(thunk(mockDispatch)).rejects.toThrow('Timeout error');
    });

    it('should handle 404 error', async () => {
      const error = new Error('Not Found');
      vi.mocked(configService.getPublishedConfig).mockRejectedValue(error);

      const thunk = fetchConfig();

      await expect(thunk(mockDispatch)).rejects.toThrow('Not Found');
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigFailure('Not Found'));
    });

    it('should handle 500 error', async () => {
      const error = new Error('Internal Server Error');
      vi.mocked(configService.getPublishedConfig).mockRejectedValue(error);

      const thunk = fetchConfig();

      await expect(thunk(mockDispatch)).rejects.toThrow('Internal Server Error');
      expect(mockDispatch).toHaveBeenCalledWith(
        fetchConfigFailure('Internal Server Error')
      );
    });

    it('should handle network timeout error', async () => {
      const error = new Error('Request timeout');
      vi.mocked(configService.getPublishedConfig).mockRejectedValue(error);

      const thunk = fetchConfig();

      await expect(thunk(mockDispatch)).rejects.toThrow('Request timeout');
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigFailure('Request timeout'));
    });

    it('should dispatch actions in correct order on success', async () => {
      const mockConfig: AppConfig = { version: '1.0.0' };
      vi.mocked(configService.getPublishedConfig).mockResolvedValue(mockConfig);

      const thunk = fetchConfig();
      await thunk(mockDispatch);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigSuccess(mockConfig));
    });

    it('should dispatch actions in correct order on failure', async () => {
      const error = new Error('API Error');
      vi.mocked(configService.getPublishedConfig).mockRejectedValue(error);

      const thunk = fetchConfig();

      try {
        await thunk(mockDispatch);
      } catch (e) {
        // Expected to throw
      }

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigFailure('API Error'));
    });

    it('should handle string errors', async () => {
      vi.mocked(configService.getPublishedConfig).mockRejectedValue('String error');

      const thunk = fetchConfig();

      await expect(thunk(mockDispatch)).rejects.toBe('String error');
      expect(mockDispatch).toHaveBeenCalledWith(
        fetchConfigFailure('Failed to fetch configuration')
      );
    });

    it('should handle null error', async () => {
      vi.mocked(configService.getPublishedConfig).mockRejectedValue(null);

      const thunk = fetchConfig();

      await expect(thunk(mockDispatch)).rejects.toBeNull();
      expect(mockDispatch).toHaveBeenCalledWith(
        fetchConfigFailure('Failed to fetch configuration')
      );
    });

    it('should handle undefined error', async () => {
      vi.mocked(configService.getPublishedConfig).mockRejectedValue(undefined);

      const thunk = fetchConfig();

      await expect(thunk(mockDispatch)).rejects.toBeUndefined();
      expect(mockDispatch).toHaveBeenCalledWith(
        fetchConfigFailure('Failed to fetch configuration')
      );
    });
  });

  describe('clearConfigError', () => {
    it('should be exported from actions', () => {
      expect(clearConfigError).toBeDefined();
      expect(typeof clearConfigError).toBe('function');
    });

    it('should create correct action', () => {
      const action = clearConfigError();
      expect(action).toHaveProperty('type');
      expect(action.type).toContain('clearConfigError');
    });
  });

  describe('resetConfig', () => {
    it('should be exported from actions', () => {
      expect(resetConfig).toBeDefined();
      expect(typeof resetConfig).toBe('function');
    });

    it('should create correct action', () => {
      const action = resetConfig();
      expect(action).toHaveProperty('type');
      expect(action.type).toContain('resetConfig');
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple sequential fetches', async () => {
      const config1: AppConfig = { version: '1.0.0' };
      const config2: AppConfig = { version: '2.0.0' };

      vi.mocked(configService.getPublishedConfig)
        .mockResolvedValueOnce(config1)
        .mockResolvedValueOnce(config2);

      const thunk1 = fetchConfig();
      await thunk1(mockDispatch);

      const thunk2 = fetchConfig();
      await thunk2(mockDispatch);

      expect(configService.getPublishedConfig).toHaveBeenCalledTimes(2);
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigSuccess(config1));
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigSuccess(config2));
    });

    it('should handle fetch after failure', async () => {
      const error = new Error('First error');
      const mockConfig: AppConfig = { version: '1.0.0' };

      vi.mocked(configService.getPublishedConfig)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockConfig);

      const thunk1 = fetchConfig();
      try {
        await thunk1(mockDispatch);
      } catch (e) {
        // Expected to throw
      }

      const thunk2 = fetchConfig();
      await thunk2(mockDispatch);

      expect(configService.getPublishedConfig).toHaveBeenCalledTimes(2);
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigFailure('First error'));
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigSuccess(mockConfig));
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large config objects', async () => {
      const largeConfig: AppConfig = {
        version: '1.0.0',
        specialization: Array(1000)
          .fill(null)
          .map((_, i) => ({ id: `${i}`, name: `Spec ${i}` })),
      };

      vi.mocked(configService.getPublishedConfig).mockResolvedValue(largeConfig);

      const thunk = fetchConfig();
      const result = await thunk(mockDispatch);

      expect(result).toEqual(largeConfig);
      expect(mockDispatch).toHaveBeenCalledWith(fetchConfigSuccess(largeConfig));
    });

    it('should handle config with special characters', async () => {
      const configWithSpecialChars: AppConfig = {
        version: '1.0.0',
        apiEndpoint: 'https://api.example.com?param=<script>alert("xss")</script>&foo=bar',
      };

      vi.mocked(configService.getPublishedConfig).mockResolvedValue(
        configWithSpecialChars
      );

      const thunk = fetchConfig();
      const result = await thunk(mockDispatch);

      expect(result).toEqual(configWithSpecialChars);
    });

    it('should handle config with null values', async () => {
      const configWithNulls: AppConfig = {
        version: '1.0.0',
        apiEndpoint: null as any,
        specialization: null as any,
      };

      vi.mocked(configService.getPublishedConfig).mockResolvedValue(configWithNulls);

      const thunk = fetchConfig();
      const result = await thunk(mockDispatch);

      expect(result).toEqual(configWithNulls);
    });
  });
});
