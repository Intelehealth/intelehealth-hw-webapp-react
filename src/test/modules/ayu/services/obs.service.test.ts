import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  addPendingImage,
  removePendingImage,
  clearPendingImages,
  getPendingImages,
  uploadAllPhysicalExamImages,
  getObsByPatientAndConcept,
} from '../../../../modules/ayu/services/obs.service';
import { OBS_CONCEPTS } from '../../../../modules/ayu/types/obs.types';

vi.mock('../../../../services/openmrs', () => ({
  OpenMRSApi: {
    post: vi.fn().mockResolvedValue({ data: {} }),
    get: vi.fn().mockResolvedValue({ results: [] }),
  },
}));

import { OpenMRSApi } from '../../../../services/openmrs';

const mockPost = vi.mocked(OpenMRSApi.post);
const mockGet = vi.mocked(OpenMRSApi.get);

const createMockFile = (name: string) =>
  new File(['test-content'], name, { type: 'image/png' });

describe('obs.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPendingImages();
  });

  // ── Pending images helpers ───────────────────────────────────────────

  describe('addPendingImage', () => {
    it('should add an image to the pending array', () => {
      const file = createMockFile('img1.png');
      addPendingImage(file, 'General exams');

      const pending = getPendingImages();
      expect(pending).toHaveLength(1);
      expect(pending[0]).toEqual({ file, comment: 'General exams' });
    });

    it('should add multiple images', () => {
      addPendingImage(createMockFile('a.png'), 'Hands');
      addPendingImage(createMockFile('b.png'), 'Throat');

      expect(getPendingImages()).toHaveLength(2);
    });
  });

  describe('removePendingImage', () => {
    it('should remove image at given index', () => {
      addPendingImage(createMockFile('a.png'), 'Hands');
      addPendingImage(createMockFile('b.png'), 'Throat');
      addPendingImage(createMockFile('c.png'), 'Eyes');

      removePendingImage(1);

      const pending = getPendingImages();
      expect(pending).toHaveLength(2);
      expect(pending[0].comment).toBe('Hands');
      expect(pending[1].comment).toBe('Eyes');
    });
  });

  describe('clearPendingImages', () => {
    it('should clear all pending images', () => {
      addPendingImage(createMockFile('a.png'), 'Hands');
      addPendingImage(createMockFile('b.png'), 'Throat');

      clearPendingImages();

      expect(getPendingImages()).toHaveLength(0);
    });
  });

  describe('getPendingImages', () => {
    it('should return empty array initially', () => {
      expect(getPendingImages()).toEqual([]);
    });
  });

  // ── uploadAllPhysicalExamImages ──────────────────────────────────────

  describe('uploadAllPhysicalExamImages', () => {
    it('should not call API when no pending images', async () => {
      await uploadAllPhysicalExamImages('enc-uuid', 'pat-uuid');

      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should upload all pending images via Promise.all', async () => {
      const file1 = createMockFile('img1.png');
      const file2 = createMockFile('img2.png');
      addPendingImage(file1, 'Hands');
      addPendingImage(file2, 'Throat');

      await uploadAllPhysicalExamImages('enc-123', 'pat-456');

      expect(mockPost).toHaveBeenCalledTimes(2);

      // Verify first call
      const [endpoint1, formData1, config1] = mockPost.mock.calls[0];
      expect(endpoint1).toBe('/obs');
      expect(formData1).toBeInstanceOf(FormData);
      expect((formData1 as FormData).get('file')).toBe(file1);
      const json1 = JSON.parse((formData1 as FormData).get('json') as string);
      expect(json1.concept).toBe(OBS_CONCEPTS.PHYSICAL_EXAMINATION);
      expect(json1.encounter).toBe('enc-123');
      expect(json1.person).toBe('pat-456');
      expect(json1.comment).toBe('Hands');
      expect(json1.obsDatetime).toBeDefined();
      expect(config1).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });

      // Verify second call
      const json2 = JSON.parse((mockPost.mock.calls[1][1] as FormData).get('json') as string);
      expect(json2.comment).toBe('Throat');
    });

    it('should clear pending images after successful upload', async () => {
      addPendingImage(createMockFile('img.png'), 'Eyes');

      await uploadAllPhysicalExamImages('enc-uuid', 'pat-uuid');

      expect(getPendingImages()).toHaveLength(0);
    });
  });

  // ── getObsByPatientAndConcept ────────────────────────────────────────

  describe('getObsByPatientAndConcept', () => {
    it('should call OpenMRSApi.get with correct URL', async () => {
      await getObsByPatientAndConcept('pat-uuid', 'concept-uuid');

      expect(mockGet).toHaveBeenCalledWith(
        '/obs?patient=pat-uuid&v=custom:(uuid,comment,value,encounter:(visit:(uuid)))&concept=concept-uuid'
      );
    });

    it('should return the API response', async () => {
      const mockResponse = { results: [{ uuid: 'obs-1' }] };
      mockGet.mockResolvedValueOnce(mockResponse as never);

      const result = await getObsByPatientAndConcept('pat-uuid', 'concept-uuid');

      expect(result).toEqual(mockResponse);
    });
  });
});
