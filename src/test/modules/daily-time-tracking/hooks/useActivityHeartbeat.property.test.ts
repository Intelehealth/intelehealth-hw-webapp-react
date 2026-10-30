import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Every beat as the stretch of time it claims, in epoch milliseconds.
const claimed: { start: number; end: number; seconds: number; ago: number }[] =
  [];

const record = (seconds: number, ago: number) => {
  const end = Date.now() - ago * 1000;
  claimed.push({ start: end - seconds * 1000, end, seconds, ago });
};

vi.mock('../../../../modules/daily-time-tracking/services/achievement-summary.service', () => ({
  achievementSummaryService: {
    // Both answer, as the portal does, so what was sent is acknowledged and not sent again.
    sendHeartbeat: async (seconds: number, ago: number) => {
      record(seconds, ago);
      return { activityDate: '2026-10-27', todaySeconds: 0 };
    },
    sendHeartbeatOnExit: async (seconds: number, ago: number) => {
      record(seconds, ago);
      return { activityDate: '2026-10-27', todaySeconds: 0 };
    },
  },
}));

import { useActivityHeartbeat } from '../../../../modules/daily-time-tracking/hooks/useActivityHeartbeat';

let hidden = false;
let online = true;
const setHidden = (value: boolean) => {
  hidden = value;
  document.dispatchEvent(new Event('visibilitychange'));
};

// A small seeded random generator, so a failing run can be repeated.
const random = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// The test setup replaces localStorage with an empty mock. This one keeps what is written, like a browser.
const memory = new Map<string, string>();
const useMemoryStorage = () => {
  memory.clear();
  vi.mocked(window.localStorage.getItem).mockImplementation(
    key => memory.get(key) ?? null
  );
  vi.mocked(window.localStorage.setItem).mockImplementation((key, value) => {
    memory.set(key, String(value));
  });
  vi.mocked(window.localStorage.removeItem).mockImplementation(key => {
    memory.delete(key);
  });
  vi.mocked(window.localStorage.clear).mockImplementation(() => memory.clear());
};
describe('useActivityHeartbeat never claims more time than has passed, and never the same time twice', () => {
  beforeEach(() => {
    useMemoryStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T10:00:00'));
    claimed.length = 0;
    hidden = false;
    online = true;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => online,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete (document as unknown as { hidden?: boolean }).hidden;
    delete (navigator as unknown as { onLine?: boolean }).onLine;
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    'with a random mix of moves, hide, show, pagehide, offline and online (seed %i)',
    async seed => {
      const next = random(seed);
      const startedAt = Date.now();
      const { unmount } = renderHook(() => useActivityHeartbeat());

      for (let i = 0; i < 600; i += 1) {
        const step = Math.floor(next() * 90_000); // up to 90 s between events
        await act(async () => {
          await vi.advanceTimersByTimeAsync(step);
        });
        const pick = next();
        if (pick < 0.3) window.dispatchEvent(new Event('mousemove'));
        else if (pick < 0.42) window.dispatchEvent(new Event('keydown'));
        else if (pick < 0.54) setHidden(true);
        else if (pick < 0.66) setHidden(false);
        else if (pick < 0.74) window.dispatchEvent(new Event('pagehide'));
        else if (pick < 0.82) online = false;
        else if (pick < 0.9) {
          online = true;
          window.dispatchEvent(new Event('online'));
        } else window.dispatchEvent(new Event('online'));
      }
      online = true;
      unmount();
      const finishedAt = Date.now();

      // the run did send something, so the checks below are not about nothing
      expect(claimed.length).toBeGreaterThan(0);

      // 1. each beat is a whole number of seconds the server accepts, with a sane age
      for (const c of claimed) {
        expect(Number.isInteger(c.seconds)).toBe(true);
        expect(c.seconds).toBeGreaterThanOrEqual(1);
        expect(c.seconds).toBeLessThanOrEqual(3600);
        expect(Number.isInteger(c.ago)).toBe(true);
        expect(c.ago).toBeGreaterThanOrEqual(0);
        expect(c.ago).toBeLessThanOrEqual(86_400);
      }

      // 2. every claimed stretch lies inside the time that passed
      for (const c of claimed) {
        expect(c.start).toBeGreaterThanOrEqual(startedAt - 1000);
        expect(c.end).toBeLessThanOrEqual(finishedAt + 1000);
      }

      // 3. no two beats claim the same time (a second of slack for the rounding of "ago")
      const sorted = [...claimed].sort((a, b) => a.start - b.start);
      for (let i = 1; i < sorted.length; i += 1) {
        expect(sorted[i].start).toBeGreaterThanOrEqual(sorted[i - 1].end - 1000);
      }

      // 4. so the total can never be more than the time that passed
      const total = claimed.reduce((a, b) => a + b.seconds, 0);
      expect(total).toBeLessThanOrEqual(Math.ceil((finishedAt - startedAt) / 1000));
    }
  );
});