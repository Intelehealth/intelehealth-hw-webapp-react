import type {
  AchievementSummary,
  AchievementSummaryParams,
  AchievementSummaryResponse,
  HeartbeatResponse,
  HeartbeatResult,
} from '../types/achievement-summary.types';
import { env } from '../../../config/env';
import { EXIT_REQUEST_TIMEOUT_MS } from '../constants/activity-config';
import { storage } from '../../../utils/storage';
import { MindmapPortalApi } from '../../../services/mindmap';

export const API_ENDPOINTS = {
  ACHIEVEMENT_SUMMARY: '/openmrs/achievements/summary',
  ACTIVITY_HEARTBEAT: '/activity/heartbeat',
} as const;

// Background calls: no full-screen loader.
const config = { headers: { loader: false } };

export const achievementSummaryService = {
  /**
   * Values for the dashboard Achievements panel of the logged-in health worker.
   * With no params the server answers for today (IST).
   */
  async getSummary(
    params?: AchievementSummaryParams
  ): Promise<AchievementSummary> {
    const response = await MindmapPortalApi.get<AchievementSummaryResponse>(
      API_ENDPOINTS.ACHIEVEMENT_SUMMARY,
      { ...config, params }
    );
    return response.data;
  },

  /**
   * Report time spent working: activeSeconds (a whole number from 1 to 3,600)
   * that ended endedSecondsAgo seconds ago (0 to 86,400; 0 when the period has
   * just ended). The server adds only the time of that period that no earlier
   * beat of the same health worker already counted, so the same minutes reported
   * twice, from two tabs or two devices, are added once. The requestId (letters,
   * digits and . _ : -, up to 64) stays the same when the same period is sent
   * again, so the server can tell a repeat of a request from a new one.
   */
  async sendHeartbeat(
    activeSeconds: number,
    endedSecondsAgo = 0,
    requestId?: string
  ): Promise<HeartbeatResult> {
    const response = await MindmapPortalApi.post<HeartbeatResponse>(
      API_ENDPOINTS.ACTIVITY_HEARTBEAT,
      { activeSeconds, endedSecondsAgo, requestId },
      config
    );
    return response.data;
  },

  /**
   * Same call for a page that is being hidden or closed. It goes out with
   * fetch keepalive so the browser lets it finish after the page is gone. When
   * the page stays open the answer arrives: the server's data when it accepted
   * the time, null when it did not or the request failed. A page that is gone
   * never sees the answer, so the time is treated as not acknowledged.
   */
  sendHeartbeatOnExit(
    activeSeconds: number,
    endedSecondsAgo = 0,
    requestId?: string
  ): Promise<HeartbeatResult | null> {
    const token = storage.getAuthToken();
    if (!token) return Promise.resolve(null);
    const url = `${env.PORTAL_API_URL ?? ''}${API_ENDPOINTS.ACTIVITY_HEARTBEAT}`;
    try {
      return fetch(url, {
        method: 'POST',
        keepalive: true,
        // Gives up if no answer comes, so a request that is stuck does not hold up the next one.
        ...(typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
          ? { signal: AbortSignal.timeout(EXIT_REQUEST_TIMEOUT_MS) }
          : {}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activeSeconds, endedSecondsAgo, requestId }),
      })
        .then(async response =>
          response.ok
            ? (((await response.json()) as HeartbeatResponse).data ?? null)
            : null
        )
        .catch(() => null);
    } catch {
      return Promise.resolve(null);
    }
  },
};
