import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockGetAuthToken = vi.fn();

vi.mock('../../../../services/mindmap', () => ({
  MindmapPortalApi: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock('../../../../utils/storage', () => ({
  storage: { getAuthToken: () => mockGetAuthToken() },
}));

const mockPortalUrl = vi.fn<() => string | undefined>(() => '/portal-api');
vi.mock('../../../../config/env', () => ({
  env: {
    get PORTAL_API_URL() {
      return mockPortalUrl();
    },
  },
}));

import { EXIT_REQUEST_TIMEOUT_MS } from '../../../../modules/daily-time-tracking/constants/activity-config';
import {
  API_ENDPOINTS,
  achievementSummaryService,
} from '../../../../modules/daily-time-tracking/services/achievement-summary.service';

const summary = {
  from: '2026-10-27',
  to: '2026-10-27',
  doctorVisitsToday: 3,
  doctorVisitsCompletedTotal: 42,
  beneficiariesRegisteredToday: 5,
  beneficiariesRegisteredTotal: 120,
  visitsPendingFromDoctor: 7,
  dailyTimeSpentSeconds: 5460,
  status: 'Active' as const,
};

describe('achievementSummaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPortalUrl.mockReturnValue('/portal-api');
  });

  it('uses the portal paths', () => {
    expect(API_ENDPOINTS.ACHIEVEMENT_SUMMARY).toBe('/openmrs/achievements/summary');
    expect(API_ENDPOINTS.ACTIVITY_HEARTBEAT).toBe('/activity/heartbeat');
  });

  describe('getSummary', () => {
    it('calls the summary endpoint without the full-screen loader and returns the data', async () => {
      mockGet.mockResolvedValue({
        success: true,
        message: 'Achievements fetched successfully!',
        data: summary,
      });

      const result = await achievementSummaryService.getSummary();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(API_ENDPOINTS.ACHIEVEMENT_SUMMARY, {
        headers: { loader: false },
        params: undefined,
      });
      expect(result).toEqual(summary);
    });

    it('passes a date range through as query params', async () => {
      mockGet.mockResolvedValue({ success: true, message: '', data: summary });

      await achievementSummaryService.getSummary({
        from: '2026-10-01',
        to: '2026-10-27',
      });

      expect(mockGet).toHaveBeenCalledWith(API_ENDPOINTS.ACHIEVEMENT_SUMMARY, {
        headers: { loader: false },
        params: { from: '2026-10-01', to: '2026-10-27' },
      });
    });

    it('passes period=overall through', async () => {
      mockGet.mockResolvedValue({ success: true, message: '', data: summary });

      await achievementSummaryService.getSummary({ period: 'overall' });

      expect(mockGet).toHaveBeenCalledWith(
        API_ENDPOINTS.ACHIEVEMENT_SUMMARY,
        expect.objectContaining({ params: { period: 'overall' } })
      );
    });

    it('lets errors reach the caller', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(achievementSummaryService.getSummary()).rejects.toThrow(
        'Network Error'
      );
    });
  });

  describe('sendHeartbeat', () => {
    it('posts the seconds without the full-screen loader and returns the data', async () => {
      const result = {
        activityDate: '2026-10-27',
        todaySeconds: 1860,
      };
      mockPost.mockResolvedValue({
        success: true,
        message: 'Heartbeat recorded successfully!',
        data: result,
      });

      const returned = await achievementSummaryService.sendHeartbeat(60);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith(
        API_ENDPOINTS.ACTIVITY_HEARTBEAT,
        { activeSeconds: 60, endedSecondsAgo: 0 },
        { headers: { loader: false } }
      );
      expect(returned).toEqual(result);
    });

    it('says how long ago the period ended, for seconds that waited', async () => {
      mockPost.mockResolvedValue({
        success: true,
        message: '',
        data: { activityDate: '2026-10-27', todaySeconds: 300 },
      });

      await achievementSummaryService.sendHeartbeat(300, 360);

      expect(mockPost).toHaveBeenCalledWith(
        API_ENDPOINTS.ACTIVITY_HEARTBEAT,
        { activeSeconds: 300, endedSecondsAgo: 360 },
        { headers: { loader: false } }
      );
    });

    it('sends the request id, so the portal can tell a repeat of the request', async () => {
      mockPost.mockResolvedValue({
        success: true,
        message: '',
        data: { activityDate: '2026-10-27', todaySeconds: 300 },
      });

      await achievementSummaryService.sendHeartbeat(300, 360, 'piece-1');

      expect(mockPost).toHaveBeenCalledWith(
        API_ENDPOINTS.ACTIVITY_HEARTBEAT,
        { activeSeconds: 300, endedSecondsAgo: 360, requestId: 'piece-1' },
        { headers: { loader: false } }
      );
    });

    it('lets errors reach the caller', async () => {
      mockPost.mockRejectedValue(new Error('timeout'));

      await expect(achievementSummaryService.sendHeartbeat(60)).rejects.toThrow(
        'timeout'
      );
    });
  });


  describe('sendHeartbeatOnExit', () => {
    const mockFetch = vi.fn();
    const mockTimeout = vi.fn((ms: number) => `signal:${ms}`);

    beforeEach(() => {
      mockFetch.mockReset();
      mockTimeout.mockClear();
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: null }) });
      vi.stubGlobal('fetch', mockFetch);
      vi.stubGlobal('AbortSignal', { timeout: mockTimeout });
      mockGetAuthToken.mockReturnValue('token-123');
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('posts the seconds with keepalive, the login token and a time limit', async () => {
      await achievementSummaryService.sendHeartbeatOnExit(42);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/portal-api/activity/heartbeat', {
        method: 'POST',
        keepalive: true,
        signal: `signal:${EXIT_REQUEST_TIMEOUT_MS}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        body: JSON.stringify({ activeSeconds: 42, endedSecondsAgo: 0 }),
      });
      expect(mockTimeout).toHaveBeenCalledWith(30_000);
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('can say how long ago the period ended', async () => {
      await achievementSummaryService.sendHeartbeatOnExit(42, 15);

      const options = mockFetch.mock.calls[0][1] as { body: string };
      expect(JSON.parse(options.body)).toEqual({
        activeSeconds: 42,
        endedSecondsAgo: 15,
      });
    });

    it('sends the request id too', async () => {
      await achievementSummaryService.sendHeartbeatOnExit(42, 15, 'piece-2');

      const options = mockFetch.mock.calls[0][1] as { body: string };
      expect(JSON.parse(options.body)).toEqual({
        activeSeconds: 42,
        endedSecondsAgo: 15,
        requestId: 'piece-2',
      });
    });

    it('gives the server answer when it accepted the time', async () => {
      const answer = { activityDate: '2026-10-27', todaySeconds: 300 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: '', data: answer }),
      });

      await expect(achievementSummaryService.sendHeartbeatOnExit(42)).resolves.toEqual(
        answer
      );
    });

    it('gives null when the server did not accept it', async () => {
      mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });

      await expect(achievementSummaryService.sendHeartbeatOnExit(42)).resolves.toBeNull();
    });

    it('gives null when the answer has no data', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      await expect(achievementSummaryService.sendHeartbeatOnExit(42)).resolves.toBeNull();
    });

    it('sends nothing when nobody is logged in', async () => {
      mockGetAuthToken.mockReturnValue(null);

      await expect(achievementSummaryService.sendHeartbeatOnExit(42)).resolves.toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('gives null, with no error, when the request fails', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      await expect(achievementSummaryService.sendHeartbeatOnExit(42)).resolves.toBeNull();
    });

    it('gives null when fetch itself throws', async () => {
      mockFetch.mockImplementation(() => {
        throw new Error('blocked');
      });

      await expect(achievementSummaryService.sendHeartbeatOnExit(42)).resolves.toBeNull();
    });

    it('sends without a time limit in a browser that has no AbortSignal.timeout', async () => {
      vi.stubGlobal('AbortSignal', {});

      await achievementSummaryService.sendHeartbeatOnExit(42);

      const options = mockFetch.mock.calls[0][1] as Record<string, unknown>;
      expect(options).not.toHaveProperty('signal');
      expect(options.keepalive).toBe(true);
    });

    it('sends without a time limit in a browser that has no AbortSignal at all', async () => {
      vi.stubGlobal('AbortSignal', undefined);

      await achievementSummaryService.sendHeartbeatOnExit(42);

      expect(mockFetch.mock.calls[0][1]).not.toHaveProperty('signal');
    });

    it('posts to the path alone when no portal address is set', async () => {
      mockPortalUrl.mockReturnValue(undefined);

      await achievementSummaryService.sendHeartbeatOnExit(42);

      expect(mockFetch.mock.calls[0][0]).toBe('/activity/heartbeat');
    });
  });
});