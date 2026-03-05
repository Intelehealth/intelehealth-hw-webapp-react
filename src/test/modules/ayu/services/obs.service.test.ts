import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../services/openmrs', () => ({
  OpenMRSApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { OpenMRSApi } from '../../../../services/openmrs';
import {
  addPendingImage,
  clearPendingImages,
  getPendingImages,
  getObsByPatientAndConcept,
  removePendingImage,
  uploadAllPhysicalExamImages,
} from '../../../../modules/ayu/services/obs.service';
import { OBS_CONCEPTS } from '../../../../modules/ayu/types/obs.types';

const mockPost = vi.mocked(OpenMRSApi.post);
const mockGet = vi.mocked(OpenMRSApi.get);

describe('obs.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPendingImages();
  });

  // ── Pending image queue ─────────────────────────────────────────────────

  describe('pending image queue', () => {
    it('should start with empty queue', () => {
      expect(getPendingImages()).toHaveLength(0);
    });

    it('should add images to queue', () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      addPendingImage(file, 'General exams');

      expect(getPendingImages()).toHaveLength(1);
      expect(getPendingImages()[0].file).toBe(file);
      expect(getPendingImages()[0].comment).toBe('General exams');
    });

    it('should add multiple images to queue', () => {
      const file1 = new File(['test1'], 'photo1.png', { type: 'image/png' });
      const file2 = new File(['test2'], 'photo2.png', { type: 'image/png' });

      addPendingImage(file1, 'General exams');
      addPendingImage(file2, 'Head');

      expect(getPendingImages()).toHaveLength(2);
    });

    it('should remove image at given index', () => {
      const file1 = new File(['test1'], 'photo1.png', { type: 'image/png' });
      const file2 = new File(['test2'], 'photo2.png', { type: 'image/png' });

      addPendingImage(file1, 'General exams');
      addPendingImage(file2, 'Head');

      removePendingImage(0);

      expect(getPendingImages()).toHaveLength(1);
      expect(getPendingImages()[0].comment).toBe('Head');
    });

    it('should clear all pending images', () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      addPendingImage(file, 'General exams');
      addPendingImage(file, 'Head');

      clearPendingImages();

      expect(getPendingImages()).toHaveLength(0);
    });
  });

  // ── uploadAllPhysicalExamImages ────────────────────────────────────────

  describe('uploadAllPhysicalExamImages', () => {
    it('should do nothing when no pending images', async () => {
      await uploadAllPhysicalExamImages('enc-uuid', 'patient-uuid');
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should upload each pending image via POST /obs with FormData', async () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      addPendingImage(file, 'General exams');

      mockPost.mockResolvedValue({});

      await uploadAllPhysicalExamImages('enc-uuid', 'patient-uuid');

      expect(mockPost).toHaveBeenCalledTimes(1);
      const [endpoint, formData, config] = mockPost.mock.calls[0];
      expect(endpoint).toBe('/obs');
      expect(formData).toBeInstanceOf(FormData);
      expect(config).toEqual({
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    it('should include correct JSON metadata in FormData', async () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      addPendingImage(file, 'General exams');

      mockPost.mockResolvedValue({});

      await uploadAllPhysicalExamImages('enc-uuid', 'patient-uuid');

      const formData = mockPost.mock.calls[0][1] as FormData;
      const jsonString = formData.get('json') as string;
      const json = JSON.parse(jsonString);

      expect(json.concept).toBe(OBS_CONCEPTS.PHYSICAL_EXAMINATION);
      expect(json.encounter).toBe('enc-uuid');
      expect(json.person).toBe('patient-uuid');
      expect(json.comment).toBe('General exams');
      expect(json.obsDatetime).toBeDefined();
    });

    it('should include file in FormData', async () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      addPendingImage(file, 'General exams');

      mockPost.mockResolvedValue({});

      await uploadAllPhysicalExamImages('enc-uuid', 'patient-uuid');

      const formData = mockPost.mock.calls[0][1] as FormData;
      expect(formData.get('file')).toBe(file);
    });

    it('should upload multiple images in parallel', async () => {
      const file1 = new File(['test1'], 'photo1.png', { type: 'image/png' });
      const file2 = new File(['test2'], 'photo2.png', { type: 'image/png' });

      addPendingImage(file1, 'General exams');
      addPendingImage(file2, 'Head');

      mockPost.mockResolvedValue({});

      await uploadAllPhysicalExamImages('enc-uuid', 'patient-uuid');

      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it('should clear pending images after successful upload', async () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      addPendingImage(file, 'General exams');

      mockPost.mockResolvedValue({});

      await uploadAllPhysicalExamImages('enc-uuid', 'patient-uuid');

      expect(getPendingImages()).toHaveLength(0);
    });

    it('should reject when an upload fails', async () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      addPendingImage(file, 'General exams');

      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(
        uploadAllPhysicalExamImages('enc-uuid', 'patient-uuid')
      ).rejects.toThrow('Network error');
    });
  });

  // ── getObsByPatientAndConcept ──────────────────────────────────────────

  describe('getObsByPatientAndConcept', () => {
    it('should call GET /obs with correct query params', async () => {
      const mockResponse = { results: [] };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getObsByPatientAndConcept(
        'patient-uuid',
        'concept-uuid'
      );

      expect(mockGet).toHaveBeenCalledWith(
        '/obs?patient=patient-uuid&v=custom:(uuid,comment,value,encounter:(visit:(uuid)))&concept=concept-uuid'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      await expect(
        getObsByPatientAndConcept('patient-uuid', 'concept-uuid')
      ).rejects.toThrow('Not found');
    });
  });
});
