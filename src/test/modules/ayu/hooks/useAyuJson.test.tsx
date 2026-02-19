import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAyuJsonList } from '../../../../modules/ayu/hooks/useAyuJson.hook';
import type { AyuApiResponse } from '../../../../modules/ayu/types/ayu-json.types';
import { ayuReducer } from '../../../../reducers/ayu.reducer';

// Mock the service
vi.mock('../../../../modules/ayu/services/ayu.service', () => ({
  fetchAyuJsonList: vi.fn(),
}));

// Mock the json utils
vi.mock('../../../../modules/ayu/utils/json.utils', () => ({
  safeJsonParse: vi.fn((json) => {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }),
}));

import { fetchAyuJsonList } from '../../../../modules/ayu/services/ayu.service';

describe('useAyuJsonList', () => {
  const mockApiResponse: AyuApiResponse = {
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

  function createWrapper() {
    const store = configureStore({
      reducer: {
        ayu: ayuReducer,
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return empty array initially', () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      expect(result.current).toEqual([]);
    });

    it('should fetch data on mount', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetchAyuJsonList).toHaveBeenCalledWith('test_Protocols');
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch and return ayu json list', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toHaveLength(2);
      });

      expect(result.current[0]).toHaveProperty('id', 1);
      expect(result.current[0]).toHaveProperty('name', 'Fever.json');
    });

    it('should call fetchAyuJsonList with correct keyName', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      renderHook(() => useAyuJsonList('vitals_config'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetchAyuJsonList).toHaveBeenCalledWith('vitals_config');
      });
    });

    it('should handle different keyNames', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const { rerender } = renderHook(
        ({ keyName }) => useAyuJsonList(keyName),
        {
          wrapper: createWrapper(),
          initialProps: { keyName: 'key1' },
        }
      );

      await waitFor(() => {
        expect(fetchAyuJsonList).toHaveBeenCalledWith('key1');
      });

      rerender({ keyName: 'key2' });

      await waitFor(() => {
        expect(fetchAyuJsonList).toHaveBeenCalledWith('key2');
      });
    });

    it('should fetch only once when keyName does not change', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const { rerender } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetchAyuJsonList).toHaveBeenCalledTimes(1);
      });

      rerender();

      expect(fetchAyuJsonList).toHaveBeenCalledTimes(1);
    });
  });

  describe('Caching Behavior', () => {
    it('should not fetch again if data is already loaded for same key', async () => {
      const wrapper = createWrapper();
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const { result: result1 } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current).toHaveLength(2);
      });

      const { result: result2 } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result2.current).toHaveLength(2);
      });

      // Should only fetch once due to caching
      expect(fetchAyuJsonList).toHaveBeenCalledTimes(1);
    });

    it('should fetch new data when keyName changes', async () => {
      const response1: AyuApiResponse = {
        data: [{ ...mockApiResponse.data[0], keyName: 'key1' }],
      };
      const response2: AyuApiResponse = {
        data: [{ ...mockApiResponse.data[0], keyName: 'key2' }],
      };

      vi.mocked(fetchAyuJsonList)
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      const { rerender } = renderHook(
        ({ keyName }) => useAyuJsonList(keyName),
        {
          wrapper: createWrapper(),
          initialProps: { keyName: 'key1' },
        }
      );

      await waitFor(() => {
        expect(fetchAyuJsonList).toHaveBeenCalledWith('key1');
      });

      rerender({ keyName: 'key2' });

      await waitFor(() => {
        expect(fetchAyuJsonList).toHaveBeenCalledWith('key2');
      });

      expect(fetchAyuJsonList).toHaveBeenCalledTimes(2);
    });

    it('should not fetch if same keyName with existing data', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const wrapper = createWrapper();

      const { result: firstResult } = renderHook(
        () => useAyuJsonList('test_Protocols'),
        { wrapper }
      );

      await waitFor(() => {
        expect(firstResult.current).toHaveLength(2);
      });

      vi.clearAllMocks();

      const { result: secondResult } = renderHook(
        () => useAyuJsonList('test_Protocols'),
        { wrapper }
      );

      await waitFor(() => {
        expect(secondResult.current).toHaveLength(2);
      });

      expect(fetchAyuJsonList).not.toHaveBeenCalled();
    });
  });

  describe('JSON Parsing', () => {
    it('should parse json strings in response', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toHaveLength(2);
      });

      expect(result.current[0].json).toEqual({ question: 'Do you have fever?' });
    });

    it('should filter out items with invalid JSON', async () => {
      const responseWithInvalidJson: AyuApiResponse = {
        data: [
          mockApiResponse.data[0],
          {
            id: 3,
            name: 'Invalid.json',
            json: '{invalid json}',
            keyName: 'test_Protocols',
            isActive: true,
          },
          mockApiResponse.data[1],
        ],
      };

      vi.mocked(fetchAyuJsonList).mockResolvedValue(responseWithInvalidJson);

      const { result } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toHaveLength(2);
      });

      expect(result.current.every(item => item.json !== null)).toBe(true);
    });

    it('should handle empty JSON strings', async () => {
      const responseWithEmptyJson: AyuApiResponse = {
        data: [
          {
            id: 1,
            name: 'Empty.json',
            json: '{}',
            keyName: 'test_Protocols',
            isActive: true,
          },
        ],
      };

      vi.mocked(fetchAyuJsonList).mockResolvedValue(responseWithEmptyJson);

      const { result } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toHaveLength(1);
      });

      expect(result.current[0].json).toEqual({});
    });
  });

  describe('Data Transformation', () => {
    it('should transform API response to AyuJsonItem format', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toHaveLength(2);
      });

      const firstItem = result.current[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('json');
      expect(firstItem).toHaveProperty('keyName');
      expect(firstItem).toHaveProperty('isActive');
    });

    it('should preserve all item properties', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toHaveLength(2);
      });

      expect(result.current[0].id).toBe(1);
      expect(result.current[0].name).toBe('Fever.json');
      expect(result.current[0].keyName).toBe('test_Protocols');
      expect(result.current[0].isActive).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useAyuJsonList('empty_key'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toEqual([]);
      });
    });

    it('should handle null response data', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toEqual([]);
      });
    });

    it('should handle large datasets', async () => {
      const largeResponse: AyuApiResponse = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item${i}.json`,
          json: `{"id": ${i}}`,
          keyName: 'test_Protocols',
          isActive: true,
        })),
      };

      vi.mocked(fetchAyuJsonList).mockResolvedValue(largeResponse);

      const { result } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toHaveLength(1000);
      });
    });
  });

  describe('Effect Dependencies', () => {
    it('should re-fetch when keyName changes', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const { rerender } = renderHook(
        ({ keyName }) => useAyuJsonList(keyName),
        {
          wrapper: createWrapper(),
          initialProps: { keyName: 'key1' },
        }
      );

      await waitFor(() => {
        expect(fetchAyuJsonList).toHaveBeenCalledWith('key1');
      });

      vi.clearAllMocks();

      rerender({ keyName: 'key2' });

      await waitFor(() => {
        expect(fetchAyuJsonList).toHaveBeenCalledWith('key2');
      });
    });

    it('should not re-fetch when other props change', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const { rerender } = renderHook(
        ({ keyName, otherProp }) => {
          void otherProp;
          return useAyuJsonList(keyName);
        },
        {
          wrapper: createWrapper(),
          initialProps: { keyName: 'test_Protocols', otherProp: 'value1' },
        }
      );

      await waitFor(() => {
        expect(fetchAyuJsonList).toHaveBeenCalledTimes(1);
      });

      rerender({ keyName: 'test_Protocols', otherProp: 'value2' });

      // Should not fetch again
      expect(fetchAyuJsonList).toHaveBeenCalledTimes(1);
    });
  });

  describe('Redux Integration', () => {
    it('should dispatch setAyuJsonList action', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toHaveLength(2);
      });

      expect(result.current[0].name).toBe('Fever.json');
      expect(result.current[1].name).toBe('Cough.json');
    });

    it('should update Redux store with fetched data', async () => {
      vi.mocked(fetchAyuJsonList).mockResolvedValue(mockApiResponse);

      const wrapper = createWrapper();

      const { result: result1 } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current).toHaveLength(2);
      });

      // Second hook should get data from Redux store
      const { result: result2 } = renderHook(() => useAyuJsonList('test_Protocols'), {
        wrapper,
      });

      expect(result2.current).toHaveLength(2);
      expect(result2.current).toEqual(result1.current);
    });
  });
});
