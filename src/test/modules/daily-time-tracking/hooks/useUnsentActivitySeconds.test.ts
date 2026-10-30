import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnsentActivitySeconds } from '../../../../modules/daily-time-tracking/hooks/useUnsentActivitySeconds';
import { pendingKey, savePending } from '../../../../modules/daily-time-tracking/utils/activity-buffer';
import { ACTIVITY_PENDING_EVENT } from '../../../../modules/daily-time-tracking/constants/activity-config';

// The test setup replaces localStorage with an empty mock; this one keeps what is written.
const memory = new Map<string, string>();

// IST day 27 October 2026 is 26 Oct 18:30 UTC to 27 Oct 18:30 UTC.
const DAY_START = Date.UTC(2026, 9, 26, 18, 30, 0);
const HOUR = 3_600_000;

describe('useUnsentActivitySeconds', () => {
  beforeEach(() => {
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
    memory.set('user', JSON.stringify({ uuid: 'user-1' }));
  });

  afterEach(() => {
    cleanup();
  });

  describe('when the server total is known', () => {
    const minuteOf = (seconds: number) => ({
      start: DAY_START + HOUR,
      end: DAY_START + HOUR + seconds * 1_000,
    });

    it('does not change while the shown minute stays the same', () => {
      savePending('user-1', [minuteOf(10)]);
      const { result } = renderHook(() =>
        useUnsentActivitySeconds('2026-10-27', '2026-10-27', 0)
      );
      expect(result.current).toBe(10);

      act(() => savePending('user-1', [minuteOf(20)]));

      expect(result.current).toBe(10);
    });

    it('changes when the shown minute changes', () => {
      savePending('user-1', [minuteOf(10)]);
      const { result } = renderHook(() =>
        useUnsentActivitySeconds('2026-10-27', '2026-10-27', 0)
      );

      act(() => savePending('user-1', [minuteOf(70)]));

      expect(result.current).toBe(70);
    });

    it('counts the server total in the minute, so 50 s on top of 20 s waiting crosses it', () => {
      savePending('user-1', [minuteOf(5)]);
      const { result } = renderHook(() =>
        useUnsentActivitySeconds('2026-10-27', '2026-10-27', 50)
      );

      act(() => savePending('user-1', [minuteOf(20)]));

      expect(result.current).toBe(20);
    });

    it('changes when time starts or stops waiting, even in the same minute', () => {
      const { result } = renderHook(() =>
        useUnsentActivitySeconds('2026-10-27', '2026-10-27', 0)
      );
      expect(result.current).toBe(0);

      act(() => savePending('user-1', [minuteOf(10)]));
      expect(result.current).toBe(10);

      act(() => savePending('user-1', []));
      expect(result.current).toBe(0);
    });
  });

  it('is 0 when nothing is waiting', () => {
    const { result } = renderHook(() =>
      useUnsentActivitySeconds('2026-10-27', '2026-10-27')
    );

    expect(result.current).toBe(0);
  });

  it('adds up what is waiting for the day', () => {
    savePending('user-1', [
      { start: DAY_START + HOUR, end: DAY_START + HOUR + 600_000 },
      { start: DAY_START + 2 * HOUR, end: DAY_START + 2 * HOUR + 90_000 },
    ]);

    const { result } = renderHook(() =>
      useUnsentActivitySeconds('2026-10-27', '2026-10-27')
    );

    expect(result.current).toBe(690);
  });

  it('counts only the part that falls in the day', () => {
    savePending('user-1', [
      // 10 minutes before the day ends and 10 minutes after it starts the next day
      { start: DAY_START + 24 * HOUR - 600_000, end: DAY_START + 24 * HOUR + 600_000 },
      // and one the day before
      { start: DAY_START - 2 * HOUR, end: DAY_START - HOUR },
    ]);

    const { result } = renderHook(() =>
      useUnsentActivitySeconds('2026-10-27', '2026-10-27')
    );

    expect(result.current).toBe(600);
  });

  it('counts all of it when no dates are given', () => {
    savePending('user-1', [
      { start: DAY_START - 2 * HOUR, end: DAY_START - HOUR },
      { start: DAY_START + HOUR, end: DAY_START + HOUR + 60_000 },
    ]);

    const { result } = renderHook(() => useUnsentActivitySeconds());

    expect(result.current).toBe(3600 + 60);
  });

  it('does not count another health worker who shares the browser', () => {
    savePending('user-2', [{ start: DAY_START + HOUR, end: DAY_START + 2 * HOUR }]);

    const { result } = renderHook(() =>
      useUnsentActivitySeconds('2026-10-27', '2026-10-27')
    );

    expect(result.current).toBe(0);
  });

  it('is 0 when nobody is signed in', () => {
    memory.delete('user');
    memory.set(pendingKey('user-1'), JSON.stringify([{ start: DAY_START + HOUR, end: DAY_START + 2 * HOUR }]));

    const { result } = renderHook(() =>
      useUnsentActivitySeconds('2026-10-27', '2026-10-27')
    );

    expect(result.current).toBe(0);
  });

  it('follows what this tab writes', () => {
    const { result } = renderHook(() =>
      useUnsentActivitySeconds('2026-10-27', '2026-10-27')
    );
    expect(result.current).toBe(0);

    act(() => {
      savePending('user-1', [{ start: DAY_START + HOUR, end: DAY_START + HOUR + 120_000 }]);
    });
    expect(result.current).toBe(120);

    act(() => {
      savePending('user-1', []); // it has been sent
    });
    expect(result.current).toBe(0);
  });

  it('follows what another tab writes', () => {
    const { result } = renderHook(() =>
      useUnsentActivitySeconds('2026-10-27', '2026-10-27')
    );

    act(() => {
      memory.set(
        pendingKey('user-1'),
        JSON.stringify([{ start: DAY_START + HOUR, end: DAY_START + HOUR + 300_000 }])
      );
      window.dispatchEvent(
        new StorageEvent('storage', { key: pendingKey('user-1') })
      );
    });

    expect(result.current).toBe(300);
  });

  it('ignores storage changes that are not about waiting time', () => {
    const { result } = renderHook(() =>
      useUnsentActivitySeconds('2026-10-27', '2026-10-27')
    );
    const readsBefore = vi.mocked(window.localStorage.getItem).mock.calls.length;

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' }));
    });

    expect(vi.mocked(window.localStorage.getItem).mock.calls.length).toBe(readsBefore);
    expect(result.current).toBe(0);
  });

  it('looks again when the dates change', () => {
    savePending('user-1', [{ start: DAY_START + HOUR, end: DAY_START + HOUR + 60_000 }]);
    const { result, rerender } = renderHook(
      ({ from, to }) => useUnsentActivitySeconds(from, to),
      { initialProps: { from: '2026-10-27', to: '2026-10-27' } }
    );
    expect(result.current).toBe(60);

    rerender({ from: '2026-10-28', to: '2026-10-28' });

    expect(result.current).toBe(0);
  });

  it('stops listening when it is removed', () => {
    const { unmount } = renderHook(() =>
      useUnsentActivitySeconds('2026-10-27', '2026-10-27')
    );
    unmount();
    const readsBefore = vi.mocked(window.localStorage.getItem).mock.calls.length;

    window.dispatchEvent(new Event(ACTIVITY_PENDING_EVENT));
    window.dispatchEvent(new StorageEvent('storage', { key: pendingKey('user-1') }));

    expect(vi.mocked(window.localStorage.getItem).mock.calls.length).toBe(readsBefore);
  });
});