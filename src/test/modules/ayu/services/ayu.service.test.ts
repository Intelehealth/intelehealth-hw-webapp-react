import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchAyuJsonList, API_ENDPOINTS } from '../../../../modules/ayu/services/ayu.service';
import type { AyuApiResponse } from '../../../../modules/ayu/types/ayu-json.types';

// Mock the MindmapPortalApi
vi.mock('../../../../services/mindmap', () => ({
  MindmapPortalApi: {
    get: vi.fn(),
  },
}));

import { MindmapPortalApi } from '../../../../services/mindmap';

describe('ayu.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API_ENDPOINTS', () => {
    it('should have correct MINDMAP_JSON_BY_KEY endpoint', () => {
      expect(API_ENDPOINTS.MINDMAP_JSON_BY_KEY).toBe('/mindmap/details/');
    });

    it('should be a readonly constant', () => {
      expect(Object.isFrozen(API_ENDPOINTS)).toBe(true);
    });
  });

  describe('fetchAyuJsonList', () => {
    const mockResponse: AyuApiResponse = {
      data: [
        {
          id: 1,
          name: 'Fever.json',
          json: '{"question": "Do you have fever?"}',
          keyName: 'test_Protocols',
          isActive: true,
        },
        {
          id: 2,
          name: 'Cough.json',
          json: '{"question": "Do you have cough?"}',
          keyName: 'test_Protocols',
          isActive: true,
        },
      ],
    };

    describe('Successful Requests', () => {
      it('should fetch ayu json list with correct endpoint', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('test_Protocols');

        expect(MindmapPortalApi.get).toHaveBeenCalledWith(
          '/mindmap/details/test_Protocols'
        );
      });

      it('should return api response', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        const result = await fetchAyuJsonList('test_Protocols');

        expect(result).toEqual(mockResponse);
      });

      it('should handle different key names', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('vitals_config');

        expect(MindmapPortalApi.get).toHaveBeenCalledWith(
          '/mindmap/details/vitals_config'
        );
      });

      it('should handle empty key name', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue({ data: [] });

        await fetchAyuJsonList('');

        expect(MindmapPortalApi.get).toHaveBeenCalledWith('/mindmap/details/');
      });

      it('should handle key name with special characters', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('test-protocols_v2');

        expect(MindmapPortalApi.get).toHaveBeenCalledWith(
          '/mindmap/details/test-protocols_v2'
        );
      });
    });

    describe('Response Data Structure', () => {
      it('should return response with data array', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        const result = await fetchAyuJsonList('test_Protocols');

        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
      });

      it('should handle empty data array', async () => {
        const emptyResponse: AyuApiResponse = { data: [] };
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(emptyResponse);

        const result = await fetchAyuJsonList('empty_key');

        expect(result.data).toEqual([]);
        expect(result.data).toHaveLength(0);
      });

      it('should handle single item in data array', async () => {
        const singleItemResponse: AyuApiResponse = {
          data: [mockResponse.data[0]],
        };
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(singleItemResponse);

        const result = await fetchAyuJsonList('test_Protocols');

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toEqual(mockResponse.data[0]);
      });

      it('should handle multiple items in data array', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        const result = await fetchAyuJsonList('test_Protocols');

        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toHaveProperty('id');
        expect(result.data[1]).toHaveProperty('id');
      });

      it('should preserve item structure', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        const result = await fetchAyuJsonList('test_Protocols');

        const firstItem = result.data[0];
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('name');
        expect(firstItem).toHaveProperty('json');
        expect(firstItem).toHaveProperty('keyName');
        expect(firstItem).toHaveProperty('isActive');
      });
    });

    describe('Error Handling', () => {
      it('should throw error when API call fails', async () => {
        const error = new Error('Network error');
        vi.mocked(MindmapPortalApi.get).mockRejectedValue(error);

        await expect(fetchAyuJsonList('test_Protocols')).rejects.toThrow('Network error');
      });

      it('should throw error for 404 response', async () => {
        const error = new Error('Not Found');
        vi.mocked(MindmapPortalApi.get).mockRejectedValue(error);

        await expect(fetchAyuJsonList('non_existent')).rejects.toThrow();
      });

      it('should throw error for 500 response', async () => {
        const error = new Error('Internal Server Error');
        vi.mocked(MindmapPortalApi.get).mockRejectedValue(error);

        await expect(fetchAyuJsonList('test_Protocols')).rejects.toThrow();
      });

      it('should throw error for timeout', async () => {
        const error = new Error('Request timeout');
        vi.mocked(MindmapPortalApi.get).mockRejectedValue(error);

        await expect(fetchAyuJsonList('test_Protocols')).rejects.toThrow('Request timeout');
      });
    });

    describe('API Call Configuration', () => {
      it('should call API only once per request', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('test_Protocols');

        expect(MindmapPortalApi.get).toHaveBeenCalledTimes(1);
      });

      it('should use GET method', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('test_Protocols');

        expect(MindmapPortalApi.get).toHaveBeenCalled();
      });

      it('should handle generic type correctly', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        const result = await fetchAyuJsonList('test_Protocols');

        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle key name with spaces', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('test protocols');

        expect(MindmapPortalApi.get).toHaveBeenCalledWith(
          '/mindmap/details/test protocols'
        );
      });

      it('should handle very long key name', async () => {
        const longKey = 'a'.repeat(1000);
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList(longKey);

        expect(MindmapPortalApi.get).toHaveBeenCalledWith(
          `/mindmap/details/${longKey}`
        );
      });

      it('should handle key name with numbers', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('protocol_123');

        expect(MindmapPortalApi.get).toHaveBeenCalledWith(
          '/mindmap/details/protocol_123'
        );
      });

      it('should handle key name with uppercase', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('TEST_PROTOCOLS');

        expect(MindmapPortalApi.get).toHaveBeenCalledWith(
          '/mindmap/details/TEST_PROTOCOLS'
        );
      });
    });

    describe('Multiple Requests', () => {
      it('should handle consecutive requests', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('key1');
        await fetchAyuJsonList('key2');

        expect(MindmapPortalApi.get).toHaveBeenCalledTimes(2);
        expect(MindmapPortalApi.get).toHaveBeenNthCalledWith(1, '/mindmap/details/key1');
        expect(MindmapPortalApi.get).toHaveBeenNthCalledWith(2, '/mindmap/details/key2');
      });

      it('should handle parallel requests', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await Promise.all([
          fetchAyuJsonList('key1'),
          fetchAyuJsonList('key2'),
          fetchAyuJsonList('key3'),
        ]);

        expect(MindmapPortalApi.get).toHaveBeenCalledTimes(3);
      });

      it('should handle same key multiple times', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('test_Protocols');
        await fetchAyuJsonList('test_Protocols');

        expect(MindmapPortalApi.get).toHaveBeenCalledTimes(2);
      });
    });

    describe('Data Integrity', () => {
      it('should not modify response data', async () => {
        const originalResponse = JSON.parse(JSON.stringify(mockResponse));
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        await fetchAyuJsonList('test_Protocols');

        expect(mockResponse).toEqual(originalResponse);
      });

      it('should return exact API response', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        const result = await fetchAyuJsonList('test_Protocols');

        expect(result).toBe(mockResponse);
      });
    });

    describe('Type Safety', () => {
      it('should return AyuApiResponse type', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        const result: AyuApiResponse = await fetchAyuJsonList('test_Protocols');

        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
      });

      it('should handle items with all required properties', async () => {
        vi.mocked(MindmapPortalApi.get).mockResolvedValue(mockResponse);

        const result = await fetchAyuJsonList('test_Protocols');

        result.data.forEach(item => {
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('name');
          expect(item).toHaveProperty('json');
          expect(item).toHaveProperty('keyName');
          expect(item).toHaveProperty('isActive');
        });
      });
    });
  });
});
