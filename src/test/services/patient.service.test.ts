import { beforeEach, describe, expect, it, vi } from 'vitest';
import { patientService } from '../../services/patient.service';

// Hoisted mocks - must be set up before module-level code in patient.service.ts runs
const h = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockInterceptorUse: vi.fn(),
  mockGetBasicAuthHeader: vi.fn(),
}));

// Mock axios BEFORE the service module is imported (service constructs singleton at module level)
vi.mock('axios', () => ({
  default: {
    create: vi.fn().mockReturnValue({
      get: h.mockGet,
      interceptors: {
        request: { use: h.mockInterceptorUse },
      },
    }),
  },
}));

// Mock storage
vi.mock('../../utils/storage', () => ({
  storage: {
    getBasicAuthHeader: () => h.mockGetBasicAuthHeader(),
  },
}));

// Mock env (required field)
vi.mock('../../config/env', () => ({
  env: {
    EMR_MIDDLEWARE_API_URL: 'https://test.intelehealth.org/EMR-Middleware/webapi',
  },
}));

// Capture the interceptor fn registered at module construction time,
// BEFORE any vi.clearAllMocks() call can wipe the call history.
// This runs during describe-block evaluation, which happens before any beforeEach.
const registeredInterceptorFn: ((config: Record<string, unknown>) => Record<string, unknown>) =
  h.mockInterceptorUse.mock.calls[0]?.[0];

describe('patientService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // HttpService.get() unwraps response.data before returning.
  // So axiosInstance.get() must resolve to { data: <API response body> }
  // where the API response body is { status, data: { visits, ... } }.

  describe('getRecentPatients', () => {
    it('calls the correct URL and returns visits', async () => {
      const mockVisits = [
        { visitUuid: 'v-1', patientName: 'Ravi Kumar', gender: 'M', visitCreatedDate: '2025-04-21', clinicName: 'TC 1', uploadTimestamp: '1h' },
      ];
      h.mockGet.mockResolvedValue({ data: { status: 'success', data: { visits: mockVisits, totalCount: 1, pageNo: 0, pageSize: 50 } } });

      const result = await patientService.getRecentPatients('hw-123');

      expect(h.mockGet).toHaveBeenCalledWith('/pull/hw-visits/hw-123?type=recent-patients&page=0&limit=50', undefined);
      expect(result).toEqual(mockVisits);
    });

    it('passes custom page and limit', async () => {
      h.mockGet.mockResolvedValue({ data: { status: 'success', data: { visits: [], totalCount: 0, pageNo: 1, pageSize: 10 } } });

      await patientService.getRecentPatients('hw-456', 1, 10);

      expect(h.mockGet).toHaveBeenCalledWith('/pull/hw-visits/hw-456?type=recent-patients&page=1&limit=10', undefined);
    });

    it('propagates errors from the API', async () => {
      h.mockGet.mockRejectedValue(new Error('Network error'));

      await expect(patientService.getRecentPatients('hw-123')).rejects.toThrow('Network error');
    });
  });

  describe('getPrescriptionsReceived', () => {
    it('calls the correct URL and returns visits', async () => {
      const mockVisits = [
        { visitUuid: 'r-1', patientName: 'Sarrah Paul', gender: 'F', visitCreatedDate: '2025-04-21', clinicName: 'TC 2', prescriptionReceivedTimestamp: '1h' },
      ];
      h.mockGet.mockResolvedValue({ data: { status: 'success', data: { visits: mockVisits, totalCount: 1, pageNo: 0, pageSize: 50 } } });

      const result = await patientService.getPrescriptionsReceived('hw-123');

      expect(h.mockGet).toHaveBeenCalledWith('/pull/hw-visits/hw-123?type=prescription-received&page=0&limit=50', undefined);
      expect(result).toEqual(mockVisits);
    });

    it('passes custom page and limit', async () => {
      h.mockGet.mockResolvedValue({ data: { status: 'success', data: { visits: [], totalCount: 0, pageNo: 2, pageSize: 20 } } });

      await patientService.getPrescriptionsReceived('hw-789', 2, 20);

      expect(h.mockGet).toHaveBeenCalledWith('/pull/hw-visits/hw-789?type=prescription-received&page=2&limit=20', undefined);
    });

    it('propagates errors from the API', async () => {
      h.mockGet.mockRejectedValue(new Error('Server error'));

      await expect(patientService.getPrescriptionsReceived('hw-123')).rejects.toThrow('Server error');
    });
  });

  describe('getOpenVisits', () => {
    it('calls the correct URL and returns visits', async () => {
      const mockVisits = [
        { visitUuid: 'ov-1', patientName: 'Priya Singh', gender: 'F', visitCreatedDate: '2025-04-20', clinicName: 'TC 1', uploadTimestamp: '3h' },
      ];
      h.mockGet.mockResolvedValue({ data: { status: 'success', data: { visits: mockVisits, totalCount: 1, pageNo: 0, pageSize: 50 } } });

      const result = await patientService.getOpenVisits('hw-123');

      expect(h.mockGet).toHaveBeenCalledWith('/pull/hw-visits/hw-123?type=open-visits&page=0&limit=50', undefined);
      expect(result).toEqual(mockVisits);
    });

    it('passes custom page and limit', async () => {
      h.mockGet.mockResolvedValue({ data: { status: 'success', data: { visits: [], totalCount: 0, pageNo: 3, pageSize: 5 } } });

      await patientService.getOpenVisits('hw-999', 3, 5);

      expect(h.mockGet).toHaveBeenCalledWith('/pull/hw-visits/hw-999?type=open-visits&page=3&limit=5', undefined);
    });

    it('propagates errors from the API', async () => {
      h.mockGet.mockRejectedValue(new Error('Timeout'));

      await expect(patientService.getOpenVisits('hw-123')).rejects.toThrow('Timeout');
    });
  });

  describe('request interceptor', () => {
    it('registers a request interceptor on construction', () => {
      // registeredInterceptorFn was captured before vi.clearAllMocks() ever ran
      expect(registeredInterceptorFn).toBeDefined();
    });

    it('interceptor adds Authorization header when basic auth header exists', () => {
    
      h.mockGetBasicAuthHeader.mockReturnValue(btoa('Basic dXNlcjpwYXNz'));

      const config: Record<string, unknown> = { headers: {} };
      const result = registeredInterceptorFn(config) as Record<string, Record<string, string>>;

      expect(result.headers.Authorization).toBe('Basic dXNlcjpwYXNz');
    });

    it('interceptor does not add Authorization header when no basic auth header', () => {
      h.mockGetBasicAuthHeader.mockReturnValue(null);

      const config: Record<string, unknown> = { headers: {} };
      const result = registeredInterceptorFn(config) as Record<string, Record<string, string>>;

      expect(result.headers.Authorization).toBeUndefined();
    });
  });
});
