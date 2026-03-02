import { describe, expect, it, vi, beforeEach } from 'vitest';
import { visitSummaryService, API_ENDPOINTS } from '../../../modules/visit-summary/visit-summary.service';
import { OpenMRSApi } from '../../../services/openmrs';

vi.mock('../../../services/openmrs', () => ({
  OpenMRSApi: {
    post: vi.fn(),
  },
}));

describe('visitSummaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API_ENDPOINTS', () => {
    it('should have VISIT endpoint', () => {
      expect(API_ENDPOINTS.VISIT).toBe('/visit');
    });
  });

  describe('closeVisit', () => {
    it('should call OpenMRSApi.post with correct URL', async () => {
      const mockPost = vi.mocked(OpenMRSApi.post).mockResolvedValue({});
      const visitUuid = 'test-uuid-123';

      await visitSummaryService.closeVisit(visitUuid);

      expect(mockPost).toHaveBeenCalledWith(
        `/visit/${visitUuid}`,
        expect.any(Object)
      );
    });

    it('should send stopDatetime in payload', async () => {
      const mockPost = vi.mocked(OpenMRSApi.post).mockResolvedValue({});
      const visitUuid = 'test-uuid-456';

      await visitSummaryService.closeVisit(visitUuid);

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          stopDatetime: expect.any(String),
        })
      );
    });

    it('should send a valid ISO date string as stopDatetime', async () => {
      const mockPost = vi.mocked(OpenMRSApi.post).mockResolvedValue({});
      const visitUuid = 'test-uuid-789';

      await visitSummaryService.closeVisit(visitUuid);

      const payload = mockPost.mock.calls[0][1] as { stopDatetime: string };
      const date = new Date(payload.stopDatetime);
      expect(date.toISOString()).toBe(payload.stopDatetime);
    });

    it('should return the API response', async () => {
      const mockResponse = { data: 'success' };
      vi.mocked(OpenMRSApi.post).mockResolvedValue(mockResponse);

      const result = await visitSummaryService.closeVisit('test-uuid');

      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from the API', async () => {
      const mockError = new Error('Network error');
      vi.mocked(OpenMRSApi.post).mockRejectedValue(mockError);

      await expect(
        visitSummaryService.closeVisit('test-uuid')
      ).rejects.toThrow('Network error');
    });
  });
});
