import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchConceptAnswers } from '../../services/concept.service';

// Mock OpenMRSApi
vi.mock('../../services/openmrs', () => ({
  OpenMRSApi: { get: vi.fn() },
}));

import { OpenMRSApi } from '../../services/openmrs';
const mockGet = vi.mocked(OpenMRSApi.get);

describe('concept.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchConceptAnswers', () => {
    it('should fetch and map concept answers from OpenMRS', async () => {
      mockGet.mockResolvedValue({
        answers: [
          { uuid: 'uuid-a-pos', display: 'A POSITIVE' },
          { uuid: 'uuid-b-neg', display: 'B NEGATIVE' },
        ],
      });

      const result = await fetchConceptAnswers('concept-uuid-123');

      expect(mockGet).toHaveBeenCalledWith(
        '/concept/concept-uuid-123?v=custom:(answers:(uuid,display))',
        { headers: { loader: false } }
      );
      expect(result).toEqual([
        { uuid: 'uuid-a-pos', display: 'A POSITIVE' },
        { uuid: 'uuid-b-neg', display: 'B NEGATIVE' },
      ]);
    });

    it('should return empty array when answers is undefined', async () => {
      mockGet.mockResolvedValue({});

      const result = await fetchConceptAnswers('concept-uuid-123');

      expect(result).toEqual([]);
    });

    it('should return empty array when answers is empty', async () => {
      mockGet.mockResolvedValue({ answers: [] });

      const result = await fetchConceptAnswers('concept-uuid-123');

      expect(result).toEqual([]);
    });

    it('should propagate API errors', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(fetchConceptAnswers('concept-uuid-123')).rejects.toThrow(
        'Network error'
      );
    });
  });
});
