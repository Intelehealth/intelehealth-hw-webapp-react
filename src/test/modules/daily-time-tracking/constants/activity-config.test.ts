import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_KEY,
  ACTIVITY_PENDING_EVENT,
  ACTIVITY_SENT_EVENT,
  ACTIVITY_THROTTLE_MS,
  ACTIVITY_TZ_OFFSET_MINUTES,
  ACTIVITY_TZ_OFFSET_MS,
  ADOPT_MAX_AGE_MS,
  CLOCK_SET_BACK_TOLERANCE_MS,
  DAY_MS,
  EXIT_REQUEST_TIMEOUT_MS,
  HEARTBEAT_MAX_SECONDS,
  HIDE_SEND_MIN_GAP_MS,
  HIDE_SEND_MIN_SECONDS,
  IDLE_LIMIT_MS,
  LEASE_KEY,
  LEASE_REFRESH_MS,
  LEASE_TTL_MS,
  LOGOUT_FLUSH_MAX_MS,
  MAX_ENDED_SECONDS_AGO,
  PENDING_KEY_PREFIX,
  REFRESH_AFTER_HIDDEN_MS,
  SERVER_KEY_PREFIX,
  SHARED_ACTIVITY_WRITE_GAP_MS,
} from '../../../../modules/daily-time-tracking/constants/activity-config';

describe('activity-config', () => {
  it('follows IST, the day the portal saves time under', () => {
    expect(ACTIVITY_TZ_OFFSET_MINUTES).toBe(330);
    expect(ACTIVITY_TZ_OFFSET_MS).toBe(330 * 60_000);
    expect(DAY_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('matches what the portal accepts', () => {
    expect(HEARTBEAT_MAX_SECONDS).toBe(3_600);
    expect(MAX_ENDED_SECONDS_AGO).toBe(86_400);
  });

  it('counts thirty minutes after the last move', () => {
    expect(IDLE_LIMIT_MS).toBe(30 * 60_000);
    expect(ACTIVITY_THROTTLE_MS).toBe(1_000);
    expect(CLOCK_SET_BACK_TOLERANCE_MS).toBe(5_000);
  });

  it('sends on hide only for a minute of waiting time, at most every five minutes', () => {
    expect(HIDE_SEND_MIN_SECONDS).toBe(60);
    expect(HIDE_SEND_MIN_GAP_MS).toBe(5 * 60_000);
    expect(EXIT_REQUEST_TIMEOUT_MS).toBe(30_000);
    expect(LOGOUT_FLUSH_MAX_MS).toBe(5_000);
    expect(REFRESH_AFTER_HIDDEN_MS).toBe(10 * 60_000);
  });

  it('gives the lease room: it runs out well after a hidden tab renews it', () => {
    expect(LEASE_TTL_MS).toBeGreaterThan(LEASE_REFRESH_MS * 4);
    expect(ADOPT_MAX_AGE_MS).toBeGreaterThan(LEASE_TTL_MS);
    expect(SHARED_ACTIVITY_WRITE_GAP_MS).toBeLessThan(LEASE_REFRESH_MS);
  });

  it('keeps its records and events under one name', () => {
    expect(PENDING_KEY_PREFIX).toBe('ih:activity:pending:');
    expect(SERVER_KEY_PREFIX).toBe('ih:activity:server:');
    expect(LEASE_KEY).toBe('ih:activity:lease');
    expect(ACTIVITY_KEY).toBe('ih:activity:last-move');
    expect(ACTIVITY_PENDING_EVENT).toBe('ih:activity-pending-changed');
    expect(ACTIVITY_SENT_EVENT).toBe('ih:activity-sent');
  });
});
