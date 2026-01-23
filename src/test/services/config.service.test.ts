import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configService } from '../../services/config.service';
import { MindmapConfigApi } from '../../services/mindmap';
import type { AppConfig } from '../../types/config.types';

// Mock MindmapConfigApi
vi.mock('../../services/mindmap', () => ({
  MindmapConfigApi: {
    get: vi.fn(),
  },
}));

describe('ConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPublishedConfig', () => {
    it('should fetch configuration successfully', async () => {
      const mockConfig: AppConfig = {
        version: '1.0.0',
        apiEndpoint: 'https://api.example.com',
        specialization: [{ id: '1', name: 'Cardiology' }],
        language: [{ code: 'en', name: 'English' }],
        patient_registration: { field1: 'value1' },
        theme_config: [{ key: 'theme', value: 'light' }],
        patient_vitals: [
          {
            name: 'Blood Pressure',
            key: 'blood_pressure',
            uuid: 'test-uuid',
            is_mandatory: false,
            lang: null,
            is_enabled: true,
          },
        ],
        patient_diagnostics: [{ type: 'xray' }],
        webrtc_section: true,
        webrtc: { enabled: true },
        patient_visit_summary: { showDetails: true },
        patient_vitals_section: true,
        patient_reg_other: false,
        patient_reg_address: true,
        abha_section: false,
        sidebar_menus: { dashboard: true, patients: true },
        patient_visit_sections: [],
        dropdown_values: [{ key: 'value' }],
        patient_diagnostics_section: true,
        ai_llm_section: false,
        ai_llm_recording_section: false,
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(MindmapConfigApi.get).toHaveBeenCalledWith(
        '/config/getPublishedConfig?ngsw-bypass=true'
      );
      expect(result).toEqual(mockConfig);
    });

    it('should call the correct API endpoint', async () => {
      const mockConfig: AppConfig = {
        version: '1.0.0',
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      await configService.getPublishedConfig();

      expect(MindmapConfigApi.get).toHaveBeenCalledTimes(1);
      expect(MindmapConfigApi.get).toHaveBeenCalledWith(
        '/config/getPublishedConfig?ngsw-bypass=true'
      );
    });

    it('should return configuration with all expected properties', async () => {
      const mockConfig: AppConfig = {
        version: '2.0.0',
        apiEndpoint: 'https://dev.example.com',
        specialization: [],
        language: [],
        patient_vitals_section: false,
        patient_reg_other: true,
        patient_reg_address: false,
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(result).toHaveProperty('version', '2.0.0');
      expect(result).toHaveProperty('apiEndpoint', 'https://dev.example.com');
      expect(result.specialization).toEqual([]);
      expect(result.language).toEqual([]);
    });

    it('should handle empty configuration', async () => {
      const mockConfig: AppConfig = {};

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(result).toEqual({});
    });

    it('should handle configuration with patient_visit_sections', async () => {
      const mockConfig: AppConfig = {
        patient_visit_sections: [
          {
            id: '1',
            name: 'Vital Signs',
            lang: { en: 'Vital Signs', hi: 'महत्वपूर्ण संकेत' },
          },
          {
            id: '2',
            name: 'History',
            lang: { en: 'History', hi: 'इतिहास' },
          },
        ],
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(result.patient_visit_sections).toHaveLength(2);
      expect(result.patient_visit_sections?.[0]).toHaveProperty('id', '1');
      expect(result.patient_visit_sections?.[0]).toHaveProperty('name', 'Vital Signs');
    });

    it('should handle configuration with nested objects', async () => {
      const mockConfig: AppConfig = {
        webrtc: {
          enabled: true,
          stunServers: ['stun:stun.example.com:19302'],
          turnServers: ['turn:turn.example.com:3478'],
        },
        patient_visit_summary: {
          showDetails: true,
          sections: ['vitals', 'history', 'diagnosis'],
        },
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(result.webrtc).toBeDefined();
      expect(result.patient_visit_summary).toBeDefined();
    });

    it('should throw error when API call fails', async () => {
      const mockError = new Error('Network error');
      vi.mocked(MindmapConfigApi.get).mockRejectedValue(mockError);

      await expect(configService.getPublishedConfig()).rejects.toThrow('Network error');

      expect(MindmapConfigApi.get).toHaveBeenCalledWith(
        '/config/getPublishedConfig?ngsw-bypass=true'
      );
    });

    it('should throw error when API returns 404', async () => {
      const mockError = new Error('Not Found');
      vi.mocked(MindmapConfigApi.get).mockRejectedValue(mockError);

      await expect(configService.getPublishedConfig()).rejects.toThrow('Not Found');
    });

    it('should throw error when API returns 500', async () => {
      const mockError = new Error('Internal Server Error');
      vi.mocked(MindmapConfigApi.get).mockRejectedValue(mockError);

      await expect(configService.getPublishedConfig()).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('should handle timeout error', async () => {
      const mockError = new Error('Request timeout');
      vi.mocked(MindmapConfigApi.get).mockRejectedValue(mockError);

      await expect(configService.getPublishedConfig()).rejects.toThrow('Request timeout');
    });

    it('should handle configuration with boolean flags', async () => {
      const mockConfig: AppConfig = {
        webrtc_section: true,
        patient_vitals_section: false,
        patient_reg_other: true,
        patient_reg_address: false,
        abha_section: true,
        patient_diagnostics_section: false,
        ai_llm_section: true,
        ai_llm_recording_section: false,
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(result.webrtc_section).toBe(true);
      expect(result.patient_vitals_section).toBe(false);
      expect(result.patient_reg_other).toBe(true);
      expect(result.patient_reg_address).toBe(false);
      expect(result.abha_section).toBe(true);
      expect(result.patient_diagnostics_section).toBe(false);
      expect(result.ai_llm_section).toBe(true);
      expect(result.ai_llm_recording_section).toBe(false);
    });

    it('should handle configuration with sidebar menus', async () => {
      const mockConfig: AppConfig = {
        sidebar_menus: {
          dashboard: true,
          patients: true,
          appointments: false,
          reports: true,
          settings: false,
        },
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(result.sidebar_menus).toBeDefined();
      expect(result.sidebar_menus?.dashboard).toBe(true);
      expect(result.sidebar_menus?.patients).toBe(true);
      expect(result.sidebar_menus?.appointments).toBe(false);
      expect(result.sidebar_menus?.reports).toBe(true);
      expect(result.sidebar_menus?.settings).toBe(false);
    });

    it('should handle configuration with arrays', async () => {
      const mockConfig: AppConfig = {
        specialization: [
          { id: '1', name: 'Cardiology' },
          { id: '2', name: 'Neurology' },
          { id: '3', name: 'Orthopedics' },
        ],
        language: [
          { code: 'en', name: 'English' },
          { code: 'hi', name: 'Hindi' },
          { code: 'mr', name: 'Marathi' },
        ],
        patient_vitals: [
          {
            name: 'Blood Pressure',
            key: 'blood_pressure',
            uuid: 'test-uuid-1',
            is_mandatory: false,
            lang: null,
            is_enabled: true,
          },
          {
            name: 'Temperature',
            key: 'temperature',
            uuid: 'test-uuid-2',
            is_mandatory: false,
            lang: null,
            is_enabled: true,
          },
          {
            name: 'Pulse',
            key: 'pulse',
            uuid: 'test-uuid-3',
            is_mandatory: false,
            lang: null,
            is_enabled: true,
          },
        ],
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(result.specialization).toHaveLength(3);
      expect(result.language).toHaveLength(3);
      expect(result.patient_vitals).toHaveLength(3);
    });

    it('should handle configuration with theme config', async () => {
      const mockConfig: AppConfig = {
        theme_config: [
          { key: 'primary_color', value: '#1976d2' },
          { key: 'secondary_color', value: '#dc004e' },
          { key: 'font_family', value: 'Roboto' },
        ],
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(result.theme_config).toHaveLength(3);
      expect(result.theme_config?.[0]).toHaveProperty('key', 'primary_color');
      expect(result.theme_config?.[0]).toHaveProperty('value', '#1976d2');
    });

    it('should handle configuration with dropdown values', async () => {
      const mockConfig: AppConfig = {
        dropdown_values: [
          { key: 'gender', values: ['Male', 'Female', 'Other'] },
          { key: 'blood_group', values: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
        ],
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(result.dropdown_values).toHaveLength(2);
    });

    it('should handle null and undefined values in configuration', async () => {
      const mockConfig: AppConfig = {
        version: '1.0.0',
        apiEndpoint: undefined,
        specialization: undefined,
        language: null as any,
      };

      vi.mocked(MindmapConfigApi.get).mockResolvedValue(mockConfig);

      const result = await configService.getPublishedConfig();

      expect(result.version).toBe('1.0.0');
      expect(result.apiEndpoint).toBeUndefined();
      expect(result.specialization).toBeUndefined();
      expect(result.language).toBeNull();
    });
  });

  describe('configService object structure', () => {
    it('should have getPublishedConfig method', () => {
      expect(configService).toHaveProperty('getPublishedConfig');
      expect(typeof configService.getPublishedConfig).toBe('function');
    });

    it('should be an object with expected methods', () => {
      expect(configService).toBeDefined();
      expect(configService.getPublishedConfig).toBeDefined();
    });
  });
});
