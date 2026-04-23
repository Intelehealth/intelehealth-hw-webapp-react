import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock the service layer ─────────────────────────────────────────────────

const mockUpsertResource = vi.fn();
const mockUpsertAssetResource = vi.fn();
const mockGetResource = vi.fn();
const mockGetChildResources = vi.fn();
const mockGetPendingResources = vi.fn();
const mockBulkMarkSynced = vi.fn();

vi.mock('../../../../modules/ayu/services/temp-storage.service', () => ({
  upsertResource: (...args: unknown[]) => mockUpsertResource(...args),
  upsertAssetResource: (...args: unknown[]) => mockUpsertAssetResource(...args),
  getResource: (...args: unknown[]) => mockGetResource(...args),
  getChildResources: (...args: unknown[]) => mockGetChildResources(...args),
  getPendingResources: (...args: unknown[]) => mockGetPendingResources(...args),
  bulkMarkSynced: (...args: unknown[]) => mockBulkMarkSynced(...args),
}));

import {
  useTempStorage,
  useTempResource,
  useTempChildren,
  usePendingResources,
  useMarkSynced,
} from '../../../../modules/ayu/hooks/useTempStorage.hook';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('useTempStorage.hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── useTempStorage ─────────────────────────────────────────────────────

  describe('useTempStorage', () => {
    it('should return initial state (no data, not loading, no error)', () => {
      const { result } = renderHook(() => useTempStorage());
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('upsert: should set loading + resolve with record on success', async () => {
      const record = { id: 1, resource_type: 'visit', data: { foo: 'bar' } };
      mockUpsertResource.mockResolvedValue({ success: true, data: record });

      const { result } = renderHook(() => useTempStorage());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.upsert({
          resource_type: 'visit',
          resource_id: 'v1',
          data: { foo: 'bar' },
          created_by: 'user',
        });
      });

      expect(returned).toEqual(record);
      expect(result.current.data).toEqual(record);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('upsert: should capture Error instance on failure and rethrow', async () => {
      const err = new Error('upsert failed');
      mockUpsertResource.mockRejectedValue(err);

      const { result } = renderHook(() => useTempStorage());

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.upsert({
            resource_type: 'visit',
            resource_id: 'v1',
            data: {},
            created_by: 'u',
          });
        } catch (e) {
          caught = e;
        }
      });

      expect(caught).toBe(err);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe(err);
    });

    it('upsert: should wrap non-Error rejections into Error', async () => {
      mockUpsertResource.mockRejectedValue('string rejection');

      const { result } = renderHook(() => useTempStorage());

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.upsert({
            resource_type: 'visit',
            resource_id: 'v1',
            data: {},
            created_by: 'u',
          });
        } catch (e) {
          caught = e;
        }
      });

      expect(caught).toBeInstanceOf(Error);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string rejection');
    });

    it('upsertAsset: should upload file and set record on success', async () => {
      const record = { id: 7, file_path: 'https://s3/img.jpg' };
      mockUpsertAssetResource.mockResolvedValue({ success: true, data: record });

      const { result } = renderHook(() => useTempStorage());
      const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' });

      let returned: unknown;
      await act(async () => {
        returned = await result.current.upsertAsset(file, {
          resource_id: 'a1',
          created_by: 'u',
        });
      });

      expect(mockUpsertAssetResource).toHaveBeenCalledWith(file, {
        resource_id: 'a1',
        created_by: 'u',
      });
      expect(returned).toEqual(record);
      expect(result.current.data).toEqual(record);
    });

    it('upsertAsset: should capture Error instance and rethrow', async () => {
      const err = new Error('upload failed');
      mockUpsertAssetResource.mockRejectedValue(err);

      const { result } = renderHook(() => useTempStorage());
      const file = new File(['x'], 'x.jpg');

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.upsertAsset(file, {
            resource_id: 'a1',
            created_by: 'u',
          });
        } catch (e) {
          caught = e;
        }
      });

      expect(caught).toBe(err);
      expect(result.current.error).toBe(err);
    });

    it('upsertAsset: should wrap non-Error rejections into Error', async () => {
      mockUpsertAssetResource.mockRejectedValue({ foo: 'bar' });

      const { result } = renderHook(() => useTempStorage());
      const file = new File(['x'], 'x.jpg');

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.upsertAsset(file, {
            resource_id: 'a1',
            created_by: 'u',
          });
        } catch (e) {
          caught = e;
        }
      });

      expect(caught).toBeInstanceOf(Error);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  // ── useTempResource ────────────────────────────────────────────────────

  describe('useTempResource', () => {
    it('should return initial state when type or id is null (no fetch)', () => {
      const { result } = renderHook(() => useTempResource(null, null));
      expect(mockGetResource).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should skip fetch when only type is null', () => {
      renderHook(() => useTempResource(null, 'id-1'));
      expect(mockGetResource).not.toHaveBeenCalled();
    });

    it('should skip fetch when only id is null', () => {
      renderHook(() => useTempResource('visit', null));
      expect(mockGetResource).not.toHaveBeenCalled();
    });

    it('should auto-fetch and populate data when type+id are set', async () => {
      const record = { id: 10, resource_type: 'visit', data: {} };
      mockGetResource.mockResolvedValue({ success: true, data: record });

      const { result } = renderHook(() => useTempResource('visit', 'v1'));

      await waitFor(() => {
        expect(result.current.data).toEqual(record);
      });
      expect(mockGetResource).toHaveBeenCalledWith('visit', 'v1');
      expect(result.current.loading).toBe(false);
    });

    it('should capture Error instance on fetch failure', async () => {
      const err = new Error('fetch failed');
      mockGetResource.mockRejectedValue(err);

      const { result } = renderHook(() => useTempResource('visit', 'v1'));

      await waitFor(() => {
        expect(result.current.error).toBe(err);
      });
      expect(result.current.data).toBeNull();
    });

    it('should wrap non-Error rejections into Error', async () => {
      mockGetResource.mockRejectedValue('timeout');

      const { result } = renderHook(() => useTempResource('visit', 'v1'));

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });
      expect(result.current.error?.message).toBe('timeout');
    });

    it('refetch: should re-fetch on demand', async () => {
      const record = { id: 11, resource_type: 'visit', data: {} };
      mockGetResource.mockResolvedValue({ success: true, data: record });

      const { result } = renderHook(() => useTempResource('visit', 'v1'));
      await waitFor(() => expect(result.current.data).toEqual(record));

      mockGetResource.mockClear();
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetResource).toHaveBeenCalledTimes(1);
    });

    it('refetch: should do nothing when type is null', async () => {
      const { result } = renderHook(() => useTempResource(null, 'v1'));
      await act(async () => {
        await result.current.refetch();
      });
      expect(mockGetResource).not.toHaveBeenCalled();
    });
  });

  // ── useTempChildren ────────────────────────────────────────────────────

  describe('useTempChildren', () => {
    it('should return initial state when type or id is null', () => {
      const { result } = renderHook(() => useTempChildren(null, null));
      expect(mockGetChildResources).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
    });

    it('should skip when type is null', () => {
      renderHook(() => useTempChildren(null, 'v1'));
      expect(mockGetChildResources).not.toHaveBeenCalled();
    });

    it('should skip when id is null', () => {
      renderHook(() => useTempChildren('visit', null));
      expect(mockGetChildResources).not.toHaveBeenCalled();
    });

    it('should auto-fetch children when type+id set', async () => {
      const records = [{ id: 1 }, { id: 2 }];
      mockGetChildResources.mockResolvedValue({ success: true, data: records });

      const { result } = renderHook(() => useTempChildren('visit', 'v1'));
      await waitFor(() => expect(result.current.data).toEqual(records));
      expect(mockGetChildResources).toHaveBeenCalledWith('visit', 'v1', undefined);
    });

    it('should pass childType filter through', async () => {
      mockGetChildResources.mockResolvedValue({ success: true, data: [] });
      renderHook(() => useTempChildren('visit', 'v1', 'asset'));
      await waitFor(() =>
        expect(mockGetChildResources).toHaveBeenCalledWith('visit', 'v1', 'asset')
      );
    });

    it('should capture Error on failure', async () => {
      const err = new Error('children fetch failed');
      mockGetChildResources.mockRejectedValue(err);

      const { result } = renderHook(() => useTempChildren('visit', 'v1'));
      await waitFor(() => expect(result.current.error).toBe(err));
      expect(result.current.data).toBeNull();
    });

    it('should wrap non-Error rejections', async () => {
      mockGetChildResources.mockRejectedValue(42);
      const { result } = renderHook(() => useTempChildren('visit', 'v1'));
      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
      expect(result.current.error?.message).toBe('42');
    });

    it('refetch: should skip when type is null', async () => {
      const { result } = renderHook(() => useTempChildren(null, 'v1'));
      await act(async () => {
        await result.current.refetch();
      });
      expect(mockGetChildResources).not.toHaveBeenCalled();
    });
  });

  // ── usePendingResources ────────────────────────────────────────────────

  describe('usePendingResources', () => {
    it('should return initial state (does not auto-fetch)', () => {
      const { result } = renderHook(() => usePendingResources());
      expect(mockGetPendingResources).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
    });

    it('fetch: should populate data on success and return it', async () => {
      const records = [{ id: 1 }, { id: 2 }];
      mockGetPendingResources.mockResolvedValue({ success: true, data: records });

      const { result } = renderHook(() =>
        usePendingResources({ resourceType: 'visit' })
      );

      let returned: unknown;
      await act(async () => {
        returned = await result.current.fetch();
      });

      expect(returned).toEqual(records);
      expect(result.current.data).toEqual(records);
      expect(mockGetPendingResources).toHaveBeenCalledWith({
        resourceType: 'visit',
      });
    });

    it('fetch: should use default empty query when none provided', async () => {
      mockGetPendingResources.mockResolvedValue({ success: true, data: [] });
      const { result } = renderHook(() => usePendingResources());

      await act(async () => {
        await result.current.fetch();
      });

      expect(mockGetPendingResources).toHaveBeenCalledWith({});
    });

    it('fetch: should capture Error on failure and rethrow', async () => {
      const err = new Error('pending failed');
      mockGetPendingResources.mockRejectedValue(err);

      const { result } = renderHook(() => usePendingResources());

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.fetch();
        } catch (e) {
          caught = e;
        }
      });
      expect(caught).toBe(err);
      expect(result.current.error).toBe(err);
    });

    it('fetch: should wrap non-Error rejections', async () => {
      mockGetPendingResources.mockRejectedValue(null);
      const { result } = renderHook(() => usePendingResources());

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.fetch();
        } catch (e) {
          caught = e;
        }
      });
      expect(caught).toBeInstanceOf(Error);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  // ── useMarkSynced ──────────────────────────────────────────────────────

  describe('useMarkSynced', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useMarkSynced());
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should return zero count for empty array (no API call)', async () => {
      const { result } = renderHook(() => useMarkSynced());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.markSynced([]);
      });

      expect(returned).toEqual({ updatedCount: 0 });
      expect(mockBulkMarkSynced).not.toHaveBeenCalled();
    });

    it('should accept single id (non-array) and wrap in array', async () => {
      mockBulkMarkSynced.mockResolvedValue({
        success: true,
        data: { updatedCount: 1 },
      });

      const { result } = renderHook(() => useMarkSynced());

      let returned: unknown;
      await act(async () => {
        returned = await result.current.markSynced(42);
      });

      expect(mockBulkMarkSynced).toHaveBeenCalledWith([42]);
      expect(returned).toEqual({ updatedCount: 1 });
      expect(result.current.data).toEqual({ updatedCount: 1 });
    });

    it('should accept array of ids', async () => {
      mockBulkMarkSynced.mockResolvedValue({
        success: true,
        data: { updatedCount: 2 },
      });

      const { result } = renderHook(() => useMarkSynced());

      await act(async () => {
        await result.current.markSynced([1, 2]);
      });

      expect(mockBulkMarkSynced).toHaveBeenCalledWith([1, 2]);
    });

    it('should capture Error on failure and rethrow', async () => {
      const err = new Error('sync failed');
      mockBulkMarkSynced.mockRejectedValue(err);

      const { result } = renderHook(() => useMarkSynced());

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.markSynced([1]);
        } catch (e) {
          caught = e;
        }
      });
      expect(caught).toBe(err);
      expect(result.current.error).toBe(err);
    });

    it('should wrap non-Error rejections', async () => {
      mockBulkMarkSynced.mockRejectedValue('bad');

      const { result } = renderHook(() => useMarkSynced());

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.markSynced([1]);
        } catch (e) {
          caught = e;
        }
      });
      expect(caught).toBeInstanceOf(Error);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('bad');
    });
  });
});
