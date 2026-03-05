import { describe, expect, it, vi } from 'vitest';
import {
  API_ENDPOINTS,
  PatientSearchService,
} from '../../../../components/navbar/patient-search/patient-search.service';

const mockGet = vi.fn();
vi.mock('../../../../services/openmrs', () => ({
  OpenMRSApi: {
    get: (...args: any[]) => mockGet(...args),
  },
}));

describe('PatientSearchService', () => {
  it('should have correct API endpoint', () => {
    expect(API_ENDPOINTS.SEARCH_PATIENT).toBe('/patient');
  });

  it('should call OpenMRSApi.get with correct endpoint and params', async () => {
    mockGet.mockResolvedValue({ results: [] });

    await PatientSearchService.searchPatient('John');

    expect(mockGet).toHaveBeenCalledWith('/patient', {
      params: {
        q: 'John',
        v: 'custom:(uuid,identifiers:(identifierType:(name),identifier),person)',
      },
    });
  });

  it('should return API response', async () => {
    const mockResponse = {
      results: [
        {
          uuid: 'uuid-1',
          identifiers: [],
          person: { display: 'John Doe', gender: 'M', age: 30 },
        },
      ],
    };
    mockGet.mockResolvedValue(mockResponse);

    const result = await PatientSearchService.searchPatient('John');

    expect(result).toEqual(mockResponse);
  });

  it('should pass different query strings correctly', async () => {
    mockGet.mockResolvedValue({ results: [] });

    await PatientSearchService.searchPatient('OPM-100');

    expect(mockGet).toHaveBeenCalledWith('/patient', {
      params: {
        q: 'OPM-100',
        v: 'custom:(uuid,identifiers:(identifierType:(name),identifier),person)',
      },
    });
  });

  it('should propagate errors from OpenMRSApi', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(
      PatientSearchService.searchPatient('test')
    ).rejects.toThrow('Network error');
  });
});
