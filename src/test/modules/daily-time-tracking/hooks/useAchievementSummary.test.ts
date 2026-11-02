import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSummary = vi.fn();
const mockReport = vi.fn();

vi.mock(
  '../../../../modules/daily-time-tracking/services/achievement-summary.service',
  () => ({
    achievementSummaryService: {
      getSummary: (...args: unknown[]) => mockGetSummary(...args),
    },
  })
);

vi.mock(
  '../../../../modules/daily-time-tracking/utils/activity-diagnostics',
  () => ({
    reportActivityIssue: (...args: unknown[]) => mockReport(...args),
  })
);

import { useAchievementSummary } from '../../../../modules/daily-time-tracking/hooks/useAchievementSummary';
import { serverKey } from '../../../../modules/daily-time-tracking/utils/activity-buffer';
import { ACTIVITY_SENT_EVENT, REFRESH_AFTER_HIDDEN_MS } from '../../../../modules/daily-time-tracking/constants/activity-config';

const summary = (doctorVisits: number) => ({
  from: '2026-10-27',
  to: '2026-10-27',
  doctorVisitsInRange: doctorVisits,
  doctorVisitsCompletedTotal: doctorVisits,
  beneficiariesRegisteredInRange: 5,
  beneficiariesRegisteredTotal: 5,
  visitsPendingFromDoctor: 2,
  timeSpentSecondsInRange: 600,
  status: 'Active' as const,
});

let hidden = false;
const setHidden = (value: boolean) => {
  hidden = value;
  document.dispatchEvent(new Event('visibilitychange'));
};

const settle = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });

// The server has accepted working time and says its total for the day.
const answer = (activityDate: string, todaySeconds: number) =>
  act(async () => {
    window.dispatchEvent(
      new CustomEvent(ACTIVITY_SENT_EVENT, {
        detail: { activityDate, todaySeconds },
      })
    );
    await vi.advanceTimersByTimeAsync(0);
  });

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
};

describe('useAchievementSummary', () => {
  beforeEach(() => {
    useMemoryStorage();
    vi.useFakeTimers();
    mockGetSummary.mockReset();
    mockReport.mockReset();
    hidden = false;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (document as unknown as { hidden?: boolean }).hidden;
  });

  it('starts loading, then holds the loaded data', async () => {
    mockGetSummary.mockResolvedValue(summary(3));

    const { result } = renderHook(() => useAchievementSummary());
    expect(result.current).toEqual({ data: null, loading: true, error: false });

    await settle();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.data?.doctorVisitsInRange).toBe(3);
    expect(mockGetSummary).toHaveBeenCalledTimes(1);
  });

  it('reports an error, with no data, when the first load fails', async () => {
    mockGetSummary.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useAchievementSummary());
    await settle();

    expect(result.current).toEqual({ data: null, loading: false, error: true });
  });

  describe('when it asks again', () => {
    it('does not ask on a timer, however long the page stays open', async () => {
      mockGetSummary.mockResolvedValue(summary(1));
      renderHook(() => useAchievementSummary());
      await settle();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60 * 60_000);
      });

      expect(mockGetSummary).toHaveBeenCalledTimes(1);
    });

    it('does not ask when the tab is shown again after a short time hidden', async () => {
      mockGetSummary.mockResolvedValue(summary(1));
      renderHook(() => useAchievementSummary());
      await settle();

      setHidden(true);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFRESH_AFTER_HIDDEN_MS - 1_000);
      });
      await act(async () => {
        setHidden(false);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockGetSummary).toHaveBeenCalledTimes(1);
    });

    it('asks again when the tab is shown after being hidden for ten minutes', async () => {
      mockGetSummary
        .mockResolvedValueOnce(summary(1))
        .mockResolvedValueOnce(summary(2));
      const { result } = renderHook(() => useAchievementSummary());
      await settle();

      setHidden(true);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFRESH_AFTER_HIDDEN_MS);
      });
      expect(mockGetSummary).toHaveBeenCalledTimes(1);
      await act(async () => {
        setHidden(false);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockGetSummary).toHaveBeenCalledTimes(2);
      expect(result.current.data?.doctorVisitsInRange).toBe(2);
    });

    it('does not ask when the tab is shown without having been hidden', async () => {
      mockGetSummary.mockResolvedValue(summary(1));
      renderHook(() => useAchievementSummary());
      await settle();

      await act(async () => {
        setHidden(false);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockGetSummary).toHaveBeenCalledTimes(1);
    });

    it('asks again when the connection returns after a failed load, and recovers', async () => {
      mockGetSummary
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce(summary(6));
      const { result } = renderHook(() => useAchievementSummary());
      await settle();
      expect(result.current.error).toBe(true);

      await act(async () => {
        window.dispatchEvent(new Event('online'));
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockGetSummary).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBe(false);
      expect(result.current.data?.doctorVisitsInRange).toBe(6);
    });

    it('does not ask when the connection returns and nothing had failed', async () => {
      mockGetSummary.mockResolvedValue(summary(1));
      renderHook(() => useAchievementSummary());
      await settle();

      await act(async () => {
        window.dispatchEvent(new Event('online'));
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockGetSummary).toHaveBeenCalledTimes(1);
    });

    it('keeps the last good data when a refresh fails, and recovers on the next one', async () => {
      mockGetSummary
        .mockResolvedValueOnce(summary(4))
        .mockRejectedValueOnce(new Error('503'))
        .mockResolvedValueOnce(summary(6));
      const { result } = renderHook(() => useAchievementSummary());
      await settle();

      setHidden(true);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFRESH_AFTER_HIDDEN_MS);
        setHidden(false);
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.error).toBe(true);
      expect(result.current.data?.doctorVisitsInRange).toBe(4);

      await act(async () => {
        window.dispatchEvent(new Event('online'));
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.error).toBe(false);
      expect(result.current.data?.doctorVisitsInRange).toBe(6);
    });

    it('shares one request between events that come close together', async () => {
      let resolveSecond: (value: ReturnType<typeof summary>) => void = () => {};
      mockGetSummary
        .mockResolvedValueOnce(summary(1))
        .mockReturnValueOnce(
          new Promise(resolve => {
            resolveSecond = resolve;
          })
        );
      renderHook(() => useAchievementSummary());
      await settle();

      await answer('2026-10-28', 10);
      await answer('2026-10-28', 20);
      expect(mockGetSummary).toHaveBeenCalledTimes(2);

      await act(async () => {
        resolveSecond(summary(2));
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(mockGetSummary).toHaveBeenCalledTimes(2);
    });

    it('stops asking after unmount', async () => {
      mockGetSummary.mockResolvedValue(summary(1));
      const { unmount } = renderHook(() => useAchievementSummary());
      await settle();

      unmount();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300_000);
        setHidden(true);
        await vi.advanceTimersByTimeAsync(REFRESH_AFTER_HIDDEN_MS);
        setHidden(false);
        window.dispatchEvent(new Event('online'));
      });
      await answer('2026-10-28', 10);

      expect(mockGetSummary).toHaveBeenCalledTimes(1);
    });
  });

  describe('when working time reaches the server', () => {
    it('shows the total the server gave, as Active, without asking again', async () => {
      mockGetSummary.mockResolvedValue({
        ...summary(3),
        timeSpentSecondsInRange: 0,
        status: 'Inactive' as const,
      });
      const { result } = renderHook(() => useAchievementSummary());
      await settle();

      await answer('2026-10-27', 900);

      expect(mockGetSummary).toHaveBeenCalledTimes(1);
      expect(result.current.data?.timeSpentSecondsInRange).toBe(900);
      expect(result.current.data?.status).toBe('Active');
      expect(result.current.data?.doctorVisitsInRange).toBe(3);
    });

    it('treats a missing total as 0', async () => {
      mockGetSummary.mockResolvedValue({
        ...summary(3),
        timeSpentSecondsInRange: null,
        status: 'Inactive' as const,
      });
      const { result } = renderHook(() => useAchievementSummary());
      await settle();

      await answer('2026-10-27', 120);

      expect(result.current.data?.timeSpentSecondsInRange).toBe(120);
    });

    it('does not take the number back for a smaller or equal total', async () => {
      mockGetSummary.mockResolvedValue(summary(3));
      const { result } = renderHook(() => useAchievementSummary());
      await settle();
      const before = result.current.data;

      await answer('2026-10-27', 300);
      await answer('2026-10-27', 600);

      expect(result.current.data).toBe(before);
      expect(result.current.data?.timeSpentSecondsInRange).toBe(600);
    });

    it('ignores an answer that comes before the first load has finished', async () => {
      let resolveFirst: (value: ReturnType<typeof summary>) => void = () => {};
      mockGetSummary.mockReturnValueOnce(
        new Promise(resolve => {
          resolveFirst = resolve;
        })
      );
      const { result } = renderHook(() => useAchievementSummary());

      await answer('2026-10-27', 900);
      expect(result.current.data).toBeNull();
      expect(mockGetSummary).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveFirst(summary(3));
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(result.current.data?.timeSpentSecondsInRange).toBe(600);
    });

    it('ignores an event that carries no answer', async () => {
      mockGetSummary.mockResolvedValue(summary(3));
      const { result } = renderHook(() => useAchievementSummary());
      await settle();
      const before = result.current.data;

      await act(async () => {
        window.dispatchEvent(new Event(ACTIVITY_SENT_EVENT));
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.data).toBe(before);
      expect(mockGetSummary).toHaveBeenCalledTimes(1);
    });

    it('asks again for the new day when an answer is for another day', async () => {
      mockGetSummary
        .mockResolvedValueOnce(summary(3))
        .mockResolvedValueOnce({
          ...summary(0),
          from: '2026-10-28',
          to: '2026-10-28',
          timeSpentSecondsInRange: 60,
        });
      const { result } = renderHook(() => useAchievementSummary());
      await settle();

      await answer('2026-10-28', 60);

      expect(mockGetSummary).toHaveBeenCalledTimes(2);
      expect(result.current.data?.to).toBe('2026-10-28');
      expect(result.current.data?.timeSpentSecondsInRange).toBe(60);
    });

    it('does not follow answers when the numbers are for a range of days or all time', async () => {
      mockGetSummary.mockResolvedValue({
        ...summary(3),
        from: null,
        to: null,
      });
      const { result } = renderHook(() => useAchievementSummary());
      await settle();

      await answer('2026-10-27', 900);

      expect(mockGetSummary).toHaveBeenCalledTimes(1);
      expect(result.current.data?.timeSpentSecondsInRange).toBe(600);
    });

    it('does not follow an event after the hook is removed', async () => {
      mockGetSummary.mockResolvedValue(summary(3));
      const { unmount } = renderHook(() => useAchievementSummary());
      await settle();
      unmount();

      await answer('2026-10-28', 10);

      expect(mockGetSummary).toHaveBeenCalledTimes(1);
    });
  });

  describe('when another tab of the browser gets an answer', () => {
    const otherTabSaved = (value: string | null, key = serverKey('u1')) =>
      act(async () => {
        window.dispatchEvent(
          new StorageEvent('storage', { key, newValue: value })
        );
        await vi.advanceTimersByTimeAsync(0);
      });
    const record = (date: string, seconds: unknown) =>
      JSON.stringify({ userId: 'u1', date, seconds });

    beforeEach(() => {
      memory.set('user', JSON.stringify({ uuid: 'u1' }));
    });

    it('shows the total it left, as Active, without asking again', async () => {
      mockGetSummary.mockResolvedValue({
        ...summary(3),
        timeSpentSecondsInRange: 0,
        status: 'Inactive' as const,
      });
      const { result } = renderHook(() => useAchievementSummary());
      await settle();

      await otherTabSaved(record('2026-10-27', 900));

      expect(mockGetSummary).toHaveBeenCalledTimes(1);
      expect(result.current.data?.timeSpentSecondsInRange).toBe(900);
      expect(result.current.data?.status).toBe('Active');
    });

    it('asks again for the new day when the total is for another day', async () => {
      mockGetSummary
        .mockResolvedValueOnce(summary(3))
        .mockResolvedValueOnce({
          ...summary(0),
          from: '2026-10-28',
          to: '2026-10-28',
          timeSpentSecondsInRange: 60,
        });
      const { result } = renderHook(() => useAchievementSummary());
      await settle();

      await otherTabSaved(record('2026-10-28', 60));

      expect(mockGetSummary).toHaveBeenCalledTimes(2);
      expect(result.current.data?.to).toBe('2026-10-28');
    });

    it.each([
      ['another key', null, 'something-else'],
      ['no value', null, undefined],
      ['a record that is not JSON', '{broken', undefined],
      ['a record with no day', JSON.stringify({ seconds: 900 }), undefined],
      ['a record with seconds that are not a number', record('2026-10-27', 'many'), undefined],
    ])('ignores a storage event with %s', async (_label, value, key) => {
      mockGetSummary.mockResolvedValue(summary(3));
      const { result } = renderHook(() => useAchievementSummary());
      await settle();
      const before = result.current.data;

      await otherTabSaved(value, key);

      expect(result.current.data).toBe(before);
      expect(mockGetSummary).toHaveBeenCalledTimes(1);
    });

    it('ignores the total of another user', async () => {
      mockGetSummary.mockResolvedValue(summary(3));
      const { result } = renderHook(() => useAchievementSummary());
      await settle();
      const before = result.current.data;

      await otherTabSaved(record('2026-10-27', 900), serverKey('someone-else'));

      expect(result.current.data).toBe(before);
    });

    it('ignores it when nobody is signed in', async () => {
      memory.delete('user');
      mockGetSummary.mockResolvedValue(summary(3));
      const { result } = renderHook(() => useAchievementSummary());
      await settle();
      const before = result.current.data;

      await otherTabSaved(record('2026-10-27', 900));

      expect(result.current.data).toBe(before);
    });

    it('does not follow another tab after the hook is removed', async () => {
      mockGetSummary.mockResolvedValue(summary(3));
      const { unmount } = renderHook(() => useAchievementSummary());
      await settle();
      unmount();

      await otherTabSaved(record('2026-10-28', 60));

      expect(mockGetSummary).toHaveBeenCalledTimes(1);
    });
  });

  describe('an answer that arrives late', () => {
    // A heartbeat answer raises the total to 900, then a slower summary says 600.
    const raiseThenRefresh = async (later: Record<string, unknown>) => {
      mockGetSummary
        .mockResolvedValueOnce(summary(3))
        .mockResolvedValueOnce({ ...summary(3), ...later });
      const hook = renderHook(() => useAchievementSummary());
      await settle();
      await answer('2026-10-27', 900);
      setHidden(true);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFRESH_AFTER_HIDDEN_MS);
        setHidden(false);
        await vi.advanceTimersByTimeAsync(0);
      });
      return hook;
    };

    it('does not take the time back, and keeps the day Active', async () => {
      const { result } = await raiseThenRefresh({
        timeSpentSecondsInRange: 600,
        status: 'Inactive',
      });

      expect(mockGetSummary).toHaveBeenCalledTimes(2);
      expect(result.current.data?.timeSpentSecondsInRange).toBe(900);
      expect(result.current.data?.status).toBe('Active');
    });

    it('takes the time back when it is for a different range of days', async () => {
      const { result } = await raiseThenRefresh({
        from: '2026-10-20',
        to: '2026-10-27',
        timeSpentSecondsInRange: 600,
      });

      expect(result.current.data?.timeSpentSecondsInRange).toBe(600);
    });

    it('takes a bigger total as it is', async () => {
      const { result } = await raiseThenRefresh({ timeSpentSecondsInRange: 1200 });

      expect(result.current.data?.timeSpentSecondsInRange).toBe(1200);
    });

    it('takes the incoming status when the day was not Active before', async () => {
      mockGetSummary
        .mockResolvedValueOnce({
          ...summary(3),
          timeSpentSecondsInRange: 900,
          status: 'Inactive',
        })
        .mockResolvedValueOnce({
          ...summary(3),
          timeSpentSecondsInRange: 300,
          status: 'Inactive',
        });
      const { result } = renderHook(() => useAchievementSummary());
      await settle();

      setHidden(true);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFRESH_AFTER_HIDDEN_MS);
        setHidden(false);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.data?.timeSpentSecondsInRange).toBe(900);
      expect(result.current.data?.status).toBe('Inactive');
    });

    it('counts a missing total as 0 when comparing', async () => {
      mockGetSummary
        .mockResolvedValueOnce({ ...summary(3), timeSpentSecondsInRange: null })
        .mockResolvedValueOnce({ ...summary(3), timeSpentSecondsInRange: null });
      const { result } = renderHook(() => useAchievementSummary());
      await settle();

      setHidden(true);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFRESH_AFTER_HIDDEN_MS);
        setHidden(false);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.data?.timeSpentSecondsInRange).toBeNull();
    });
  });

  describe('a load that finishes after the hook is removed', () => {
    it('does not update anything when it succeeds', async () => {
      let resolveLoad: (value: ReturnType<typeof summary>) => void = () => {};
      mockGetSummary.mockReturnValueOnce(
        new Promise(resolve => {
          resolveLoad = resolve;
        })
      );
      const { result, unmount } = renderHook(() => useAchievementSummary());
      unmount();

      await act(async () => {
        resolveLoad(summary(3));
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current).toEqual({ data: null, loading: true, error: false });
      expect(memory.size).toBe(0);
    });

    it('does not update anything when it fails', async () => {
      let rejectLoad: (reason: Error) => void = () => {};
      mockGetSummary.mockReturnValueOnce(
        new Promise((_, reject) => {
          rejectLoad = reject;
        })
      );
      const { result, unmount } = renderHook(() => useAchievementSummary());
      unmount();

      await act(async () => {
        rejectLoad(new Error('Network Error'));
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current).toEqual({ data: null, loading: true, error: false });
    });
  });

  describe("the server's total kept in the browser", () => {
    beforeEach(() => {
      memory.set('user', JSON.stringify({ uuid: 'u1' }));
    });

    it("remembers the day's total under the signed-in user", async () => {
      mockGetSummary.mockResolvedValue(summary(3));
      renderHook(() => useAchievementSummary());
      await settle();

      expect(JSON.parse(memory.get(serverKey('u1')) as string)).toEqual({
        userId: 'u1',
        date: '2026-10-27',
        seconds: 600,
      });
      expect(mockReport).not.toHaveBeenCalled();
    });

    it('remembers 0 when the summary has no total', async () => {
      mockGetSummary.mockResolvedValue({
        ...summary(3),
        timeSpentSecondsInRange: null,
      });
      renderHook(() => useAchievementSummary());
      await settle();

      expect(JSON.parse(memory.get(serverKey('u1')) as string).seconds).toBe(0);
    });

    it('says so when the server gives less than it gave before', async () => {
      memory.set(
        serverKey('u1'),
        JSON.stringify({ userId: 'u1', date: '2026-10-27', seconds: 900 })
      );
      mockGetSummary.mockResolvedValue(summary(3));
      renderHook(() => useAchievementSummary());
      await settle();

      expect(mockReport).toHaveBeenCalledWith('server_total_lower', {
        known: 900,
        given: 600,
      });
      expect(JSON.parse(memory.get(serverKey('u1')) as string).seconds).toBe(
        900
      );
    });

    it('counts a missing total as 0 when it says so', async () => {
      memory.set(
        serverKey('u1'),
        JSON.stringify({ userId: 'u1', date: '2026-10-27', seconds: 100 })
      );
      mockGetSummary.mockResolvedValue({
        ...summary(3),
        timeSpentSecondsInRange: null,
      });
      renderHook(() => useAchievementSummary());
      await settle();

      expect(mockReport).toHaveBeenCalledWith('server_total_lower', {
        known: 100,
        given: 0,
      });
    });

    it('stays quiet when the server gives as much as before', async () => {
      memory.set(
        serverKey('u1'),
        JSON.stringify({ userId: 'u1', date: '2026-10-27', seconds: 600 })
      );
      mockGetSummary.mockResolvedValue(summary(3));
      renderHook(() => useAchievementSummary());
      await settle();

      expect(mockReport).not.toHaveBeenCalled();
    });

    it('keeps nothing for numbers that are not for one day', async () => {
      mockGetSummary.mockResolvedValue({ ...summary(3), from: null, to: null });
      renderHook(() => useAchievementSummary());
      await settle();

      expect(memory.has(serverKey('u1'))).toBe(false);
    });

    it('keeps nothing when the day has no name', async () => {
      mockGetSummary.mockResolvedValue({ ...summary(3), from: '', to: '' });
      renderHook(() => useAchievementSummary());
      await settle();

      expect(memory.has(serverKey('u1'))).toBe(false);
    });
  });

  it('keeps nothing in the browser when nobody is signed in', async () => {
    mockGetSummary.mockResolvedValue(summary(3));
    renderHook(() => useAchievementSummary());
    await settle();

    expect([...memory.keys()].some(key => key.startsWith('ih:activity:server:'))).toBe(
      false
    );
  });
});
