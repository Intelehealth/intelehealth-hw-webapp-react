import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();

vi.mock('../../../services/patient.service', () => ({
  EmrMiddlewareApi: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

import { achievementService } from '../../../modules/achievement-ui/achievement.service';

describe('achievementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchRawData', () => {
    const mockResponse = {
      data: {
        patientlist: [{ uuid: 'p1' }],
        patientAttributesList: [
          { patientuuid: 'p1', person_attribute_type_uuid: 'type1', value: 'val1' },
        ],
        visitlist: [{ uuid: 'v1' }],
        encounterlist: [
          { uuid: 'e1', visituuid: 'v1', encounter_type_uuid: 'et1', provider_uuid: 'prov1', encounter_time: '2026-01-01 10:00:00' },
        ],
        obslist: [
          { conceptuuid: 'c1', encounteruuid: 'e1', value: '5' },
        ],
      },
    };

    it('should call the correct API endpoint with location UUID', async () => {
      mockGet.mockResolvedValue(mockResponse);
      await achievementService.fetchRawData('location-uuid-123');

      expect(mockGet).toHaveBeenCalledWith(
        '/pull/pulldata/location-uuid-123/2008-05-12 15:58:31/0/50000'
      );
    });

    it('should return only patientAttributesList, encounterlist, and obslist', async () => {
      mockGet.mockResolvedValue(mockResponse);
      const result = await achievementService.fetchRawData('location-uuid-123');

      expect(result).toEqual({
        patientAttributesList: mockResponse.data.patientAttributesList,
        encounterlist: mockResponse.data.encounterlist,
        obslist: mockResponse.data.obslist,
      });
      // Should NOT include patientlist or visitlist
      expect(result).not.toHaveProperty('patientlist');
      expect(result).not.toHaveProperty('visitlist');
    });

    it('should propagate API errors', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(achievementService.fetchRawData('location-uuid-123')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle empty response data', async () => {
      mockGet.mockResolvedValue({
        data: {
          patientlist: [],
          patientAttributesList: [],
          visitlist: [],
          encounterlist: [],
          obslist: [],
        },
      });

      const result = await achievementService.fetchRawData('location-uuid-123');
      expect(result).toEqual({
        patientAttributesList: [],
        encounterlist: [],
        obslist: [],
      });
    });
  });
});
