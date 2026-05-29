import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock MindmapPortalApi ──────────────────────────────────────────────────

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();

vi.mock('../../../../services/mindmap', () => ({
  MindmapPortalApi: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

import {
  upsertResource,
  upsertAssetResource,
  getResource,
  getChildResources,
  getPendingResources,
  bulkMarkSynced,
  TEMP_STORAGE_ENDPOINTS,
} from '../../../../modules/ayu/services/temp-storage.service';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('temp-storage.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TEMP_STORAGE_ENDPOINTS', () => {
    it('should have correct static paths', () => {
      expect(TEMP_STORAGE_ENDPOINTS.ROOT).toBe('/temp-storage');
      expect(TEMP_STORAGE_ENDPOINTS.UPLOAD).toBe('/temp-storage/upload');
      expect(TEMP_STORAGE_ENDPOINTS.PENDING).toBe('/temp-storage/pending');
      expect(TEMP_STORAGE_ENDPOINTS.SYNC).toBe('/temp-storage/sync');
    });

    it('should generate correct byResource path', () => {
      expect(TEMP_STORAGE_ENDPOINTS.byResource('visit', 'abc')).toBe('/temp-storage/visit/abc');
      expect(TEMP_STORAGE_ENDPOINTS.byResource('patient', 'xyz')).toBe('/temp-storage/patient/xyz');
    });

    it('should generate correct children path', () => {
      expect(TEMP_STORAGE_ENDPOINTS.children('visit', 'abc')).toBe('/temp-storage/visit/abc/children');
    });
  });

  describe('upsertResource', () => {
    it('should POST to /temp-storage with payload', async () => {
      const mockResponse = { success: true, data: { id: 1 } };
      mockPost.mockResolvedValue(mockResponse);

      const payload = {
        resource_type: 'visit' as const,
        resource_id: 'visit-123',
        data: { vitals: { height: 170 } },
        created_by: 'user-uuid',
      };

      const result = await upsertResource(payload);

      expect(mockPost).toHaveBeenCalledWith('/temp-storage', payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('upsertAssetResource', () => {
    it('should POST multipart FormData to /temp-storage/upload', async () => {
      const mockResponse = { success: true, data: { id: 2, file_path: 'https://s3.example.com/img.jpg' } };
      mockPost.mockResolvedValue(mockResponse);

      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      const meta = {
        resource_id: 'asset-1',
        parent_type: 'visit' as const,
        parent_id: 'visit-123',
        created_by: 'user-uuid',
        data: { questionId: 'q1' },
      };

      const result = await upsertAssetResource(file, meta);

      expect(mockPost).toHaveBeenCalledWith(
        '/temp-storage/upload',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockResponse);

      // Verify FormData contents
      const formData = mockPost.mock.calls[0][1] as FormData;
      expect(formData.get('file')).toBe(file);
      expect(formData.get('resource_type')).toBe('asset');
      expect(formData.get('resource_id')).toBe('asset-1');
      expect(formData.get('parent_type')).toBe('visit');
      expect(formData.get('parent_id')).toBe('visit-123');
      expect(formData.get('created_by')).toBe('user-uuid');
      expect(formData.get('data')).toBe(JSON.stringify({ questionId: 'q1' }));
    });

    it('should omit optional fields when not provided', async () => {
      mockPost.mockResolvedValue({ success: true, data: { id: 3 } });

      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      const meta = {
        resource_id: 'asset-2',
        created_by: 'user-uuid',
      };

      await upsertAssetResource(file, meta);

      const formData = mockPost.mock.calls[0][1] as FormData;
      expect(formData.get('parent_type')).toBeNull();
      expect(formData.get('parent_id')).toBeNull();
      expect(formData.get('data')).toBeNull();
    });
  });

  describe('getResource', () => {
    it('should GET /temp-storage/:type/:id', async () => {
      const mockResponse = { success: true, data: { id: 1, data: { vitals: {} } } };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getResource('visit', 'visit-123');

      expect(mockGet).toHaveBeenCalledWith('/temp-storage/visit/visit-123');
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback response on 404 error', async () => {
      const axiosError = { response: { status: 404 } };
      mockGet.mockRejectedValue(axiosError);

      const result = await getResource('patient', 'non-existent-id');

      expect(mockGet).toHaveBeenCalledWith('/temp-storage/patient/non-existent-id');
      expect(result).toEqual({
        success: false,
        message: 'Not found',
        data: null,
      });
    });

    it('should re-throw non-404 errors', async () => {
      const axiosError = { response: { status: 500 } };
      mockGet.mockRejectedValue(axiosError);

      await expect(getResource('visit', 'visit-123')).rejects.toEqual(axiosError);
    });

    it('should re-throw errors without response property', async () => {
      const networkError = new Error('Network Error');
      mockGet.mockRejectedValue(networkError);

      await expect(getResource('visit', 'visit-123')).rejects.toThrow('Network Error');
    });

    it('should re-throw when error is null', async () => {
      mockGet.mockRejectedValue(null);

      await expect(getResource('visit', 'visit-123')).rejects.toBeNull();
    });
  });

  describe('getChildResources', () => {
    it('should GET children without type filter', async () => {
      const mockResponse = { success: true, data: [] };
      mockGet.mockResolvedValue(mockResponse);

      await getChildResources('visit', 'visit-123');

      expect(mockGet).toHaveBeenCalledWith(
        '/temp-storage/visit/visit-123/children',
        { params: undefined }
      );
    });

    it('should GET children with type filter', async () => {
      const mockResponse = { success: true, data: [{ id: 1 }] };
      mockGet.mockResolvedValue(mockResponse);

      await getChildResources('visit', 'visit-123', 'asset');

      expect(mockGet).toHaveBeenCalledWith(
        '/temp-storage/visit/visit-123/children',
        { params: { type: 'asset' } }
      );
    });
  });

  describe('getPendingResources', () => {
    it('should GET /temp-storage/pending with query params', async () => {
      const mockResponse = { success: true, data: [] };
      mockGet.mockResolvedValue(mockResponse);

      await getPendingResources({ resourceType: 'visit', createdBy: 'user-1' });

      expect(mockGet).toHaveBeenCalledWith(
        '/temp-storage/pending',
        { params: { resourceType: 'visit', createdBy: 'user-1' } }
      );
    });

    it('should GET /temp-storage/pending with empty query', async () => {
      mockGet.mockResolvedValue({ success: true, data: [] });

      await getPendingResources();

      expect(mockGet).toHaveBeenCalledWith(
        '/temp-storage/pending',
        { params: {} }
      );
    });
  });

  describe('bulkMarkSynced', () => {
    it('should PATCH /temp-storage/sync with ids', async () => {
      const mockResponse = { success: true, data: { updatedCount: 2 } };
      mockPatch.mockResolvedValue(mockResponse);

      const result = await bulkMarkSynced([1, 2]);

      expect(mockPatch).toHaveBeenCalledWith('/temp-storage/sync', { ids: [1, 2] });
      expect(result).toEqual(mockResponse);
    });
  });
});
