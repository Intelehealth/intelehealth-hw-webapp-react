import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSendHeartbeat = vi.fn();
const mockSendHeartbeatOnExit = vi.fn();
const mockReportActivityIssue = vi.fn();

vi.mock(
  '../../../../modules/daily-time-tracking/services/achievement-summary.service',
  () => ({
    achievementSummaryService: {
      sendHeartbeat: (...args: unknown[]) => mockSendHeartbeat(...args),
      sendHeartbeatOnExit: (...args: unknown[]) =>
        mockSendHeartbeatOnExit(...args),
    },
  })
);
vi.mock(
  '../../../../modules/daily-time-tracking/utils/activity-diagnostics',
  () => ({
    reportActivityIssue: (...args: unknown[]) =>
      mockReportActivityIssue(...args),
  })
);

import { createActivitySync } from '../../../../modules/daily-time-tracking/services/activity-sync.service';
import { loadPending, loadServerSeconds, pendingKey, savePending, type ActivitySentDetail } from '../../../../modules/daily-time-tracking/utils/activity-buffer';
import { ACTIVITY_SENT_EVENT } from '../../../../modules/daily-time-tracking/constants/activity-config';

// 12:00 IST on 27 October 2026
const NOW = Date.UTC(2026, 9, 27, 6, 30, 0);
const DAY = '2026-10-27';
const ANSWER = { activityDate: DAY, todaySeconds: 90 };

// a stretch that started `from` seconds ago and ended `to` seconds ago
const seg = (from: number, to: number) => ({
  start: NOW - from * 1000,
  end: NOW - to * 1000,
});

const make = (options: { userId?: string | null; leader?: boolean } = {}) =>
  createActivitySync({
    userId: 'userId' in options ? (options.userId ?? null) : 'u1',
    isLeader: () => options.leader ?? true,
  });

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const settle = () => vi.advanceTimersByTimeAsync(0);

const memory = new Map<string, string>();
let online = true;

describe('createActivitySync', () => {
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
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mockSendHeartbeat.mockReset();
    mockSendHeartbeatOnExit.mockReset();
    mockReportActivityIssue.mockReset();
    mockSendHeartbeat.mockResolvedValue(ANSWER);
    mockSendHeartbeatOnExit.mockResolvedValue(ANSWER);
    online = true;
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => online,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (navigator as unknown as { onLine?: boolean }).onLine;
  });

  describe('waiting time', () => {
    it('adds up the whole seconds that are waiting', () => {
      const sync = make();

      sync.add(seg(100, 40));
      sync.add(seg(30, 10));
      sync.add({ start: NOW - 1_500, end: NOW });

      expect(sync.waitingSeconds()).toBe(60 + 20 + 1);
    });

    it('joins stretches that touch or overlap into one', async () => {
      const sync = make();

      sync.add(seg(100, 50));
      sync.add(seg(60, 10));
      await sync.flush();

      expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
      expect(mockSendHeartbeat).toHaveBeenCalledWith(90, 10, expect.any(String));
    });

    it('keeps stretches that do not touch apart, each with its own end', async () => {
      const sync = make();

      sync.add(seg(100, 80));
      sync.add(seg(30, 10));
      await sync.flush();

      expect(mockSendHeartbeat.mock.calls.map(call => call.slice(0, 2))).toEqual([
        [20, 80],
        [20, 10],
      ]);
    });

    it('says when the last send started', async () => {
      const sync = make();
      expect(sync.lastSendAt()).toBe(0);

      sync.add(seg(10, 0));
      await sync.flush();

      expect(sync.lastSendAt()).toBe(NOW);
    });
  });

  describe('flush', () => {
    it('sends the seconds with how long ago they ended, then forgets them', async () => {
      const sync = make();
      sync.add(seg(90, 30));

      await sync.flush();

      expect(mockSendHeartbeat).toHaveBeenCalledWith(60, 30, expect.any(String));
      expect(sync.waitingSeconds()).toBe(0);
      expect(memory.has(pendingKey('u1'))).toBe(false);
    });

    it('keeps the time in the browser if the page leaves while the request is on its way', async () => {
      const gate = deferred<typeof ANSWER>();
      mockSendHeartbeat.mockReturnValue(gate.promise);
      const sync = make();
      sync.add(seg(60, 0));

      const running = sync.flush();
      sync.sendOnExit();

      expect(loadPending('u1')).toEqual([seg(60, 0)]);

      gate.resolve(ANSWER);
      await running;

      expect(loadPending('u1')).toEqual([]);
    });

    it("remembers the server's total and tells the dashboard", async () => {
      const heard: ActivitySentDetail[] = [];
      const listener = (event: Event) =>
        heard.push((event as CustomEvent<ActivitySentDetail>).detail);
      window.addEventListener(ACTIVITY_SENT_EVENT, listener);
      const sync = make();
      sync.add(seg(60, 0));

      await sync.flush();
      window.removeEventListener(ACTIVITY_SENT_EVENT, listener);

      expect(loadServerSeconds('u1', DAY)).toBe(90);
      expect(heard).toEqual([{ activityDate: DAY, todaySeconds: 90 }]);
    });

    it('sends nothing when nothing is waiting', async () => {
      await make().flush();

      expect(mockSendHeartbeat).not.toHaveBeenCalled();
    });

    it('keeps nothing in the browser for nobody, and does not remember a total', async () => {
      const sync = make({ userId: null });
      sync.add(seg(60, 0));

      await sync.flush();

      expect(mockSendHeartbeat).toHaveBeenCalledWith(60, 0, expect.any(String));
      expect(memory.size).toBe(0);
    });

    it('does not write the browser copy when this tab is not the leader', async () => {
      const sync = make({ leader: false });
      sync.add(seg(60, 0));

      await sync.flush();

      expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
      expect(memory.has(pendingKey('u1'))).toBe(false);
    });

    it('treats an answer it cannot read as sent, without telling the dashboard', async () => {
      mockSendHeartbeat.mockResolvedValue(undefined);
      const heard = vi.fn();
      window.addEventListener(ACTIVITY_SENT_EVENT, heard);
      const sync = make();
      sync.add(seg(60, 0));

      await sync.flush();
      window.removeEventListener(ACTIVITY_SENT_EVENT, heard);

      expect(heard).not.toHaveBeenCalled();
      expect(sync.waitingSeconds()).toBe(0);
      expect(loadPending('u1')).toEqual([]);
    });

    it('sends nothing while offline and keeps the time', async () => {
      online = false;
      const sync = make();
      sync.add(seg(60, 0));

      await sync.flush();

      expect(mockSendHeartbeat).not.toHaveBeenCalled();
      expect(sync.waitingSeconds()).toBe(60);
    });

    it('returns the same promise while a send is running, and sends once', async () => {
      const gate = deferred<typeof ANSWER>();
      mockSendHeartbeat.mockReturnValue(gate.promise);
      const sync = make();
      sync.add(seg(60, 0));

      const first = sync.flush();
      const second = sync.flush();
      expect(second).toBe(first);
      gate.resolve(ANSWER);
      await first;

      expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
    });

    it('sends one request at a time, oldest first, in pieces of at most an hour', async () => {
      const first = deferred<typeof ANSWER>();
      mockSendHeartbeat
        .mockReturnValueOnce(first.promise)
        .mockResolvedValue(ANSWER);
      const sync = make();
      sync.add(seg(7_300, 0));

      const running = sync.flush();
      expect(mockSendHeartbeat.mock.calls.map(call => call.slice(0, 2))).toEqual([[3_600, 3_700]]);

      first.resolve(ANSWER);
      await running;

      expect(mockSendHeartbeat.mock.calls.map(call => call.slice(0, 2))).toEqual([
        [3_600, 3_700],
        [3_600, 100],
        [100, 0],
      ]);
    });

    it('stops sending the rest once the page is gone', async () => {
      const first = deferred<typeof ANSWER>();
      mockSendHeartbeat.mockReturnValueOnce(first.promise);
      const sync = make();
      sync.add(seg(7_300, 0));

      const running = sync.flush();
      sync.stop();
      first.resolve(ANSWER);
      await running;

      expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
    });
  });

  describe('a request that fails', () => {
    it.each([
      ['no answer at all', undefined, null],
      ['a 500', 500, 500],
      ['a 503', 503, 503],
      ['a 401', 401, 401],
      ['a 408', 408, 408],
      ['a 429', 429, 429],
    ])(
      'keeps the time after %s and sends it again at the next event',
      async (_label, status, reported) => {
        mockSendHeartbeat.mockRejectedValueOnce(
          status === undefined ? new Error('Network Error') : { response: { status } }
        );
        const sync = make();
        sync.add(seg(60, 0));

        await sync.flush();

        expect(mockReportActivityIssue).toHaveBeenCalledWith('send_failed', {
          status: reported,
          seconds: 60,
          retry: true,
        });
        expect(sync.waitingSeconds()).toBe(60);
        expect(loadPending('u1')).toEqual([seg(60, 0)]);
        expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);

        await sync.flush();

        expect(mockSendHeartbeat).toHaveBeenCalledTimes(2);
        expect(sync.waitingSeconds()).toBe(0);
        expect(loadPending('u1')).toEqual([]);
      }
    );

    it.each([400, 403, 404, 422])(
      'drops the time after a %i, because the server called the request wrong',
      async status => {
        mockSendHeartbeat.mockRejectedValueOnce({ response: { status } });
        const sync = make();
        sync.add(seg(60, 0));

        await sync.flush();
        await sync.flush();

        expect(mockReportActivityIssue).toHaveBeenCalledWith('send_rejected', {
          status,
          seconds: 60,
          retry: false,
        });
        expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
        expect(sync.waitingSeconds()).toBe(0);
        expect(loadPending('u1')).toEqual([]);
      }
    );

    it('stops at the first failure instead of trying the next piece', async () => {
      mockSendHeartbeat.mockRejectedValueOnce({ response: { status: 500 } });
      const sync = make();
      sync.add(seg(100, 80));
      sync.add(seg(30, 10));

      await sync.flush();

      expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
      expect(sync.waitingSeconds()).toBe(40);
    });

    it('sends the failed piece again together with time that has come in since', async () => {
      mockSendHeartbeat.mockRejectedValueOnce({ response: { status: 500 } });
      const sync = make();
      sync.add(seg(60, 30));
      await sync.flush();

      sync.add(seg(30, 0));
      await sync.flush();

      expect(mockSendHeartbeat).toHaveBeenLastCalledWith(60, 0, expect.any(String));
    });
  });

  describe('where a period is cut', () => {
    // 23:59:00 IST to 00:01:00 IST: IST midnight is 18:30 UTC
    const beforeMidnight = Date.UTC(2026, 9, 27, 18, 29, 0);

    it('never lets a period reach across IST midnight: the first one ends a second before', async () => {
      vi.setSystemTime(beforeMidnight + 120_000);
      const sync = make();
      sync.add({ start: beforeMidnight, end: beforeMidnight + 120_000 });

      await sync.flush();

      expect(mockSendHeartbeat.mock.calls[0][0]).toBe(59);
      expect(mockSendHeartbeat.mock.calls[0][1]).toBe(61);
    });

    it('skips the last half second before midnight and starts the next day from midnight', async () => {
      const midnight = Date.UTC(2026, 9, 27, 18, 30, 0);
      vi.setSystemTime(midnight + 60_000);
      const sync = make();
      sync.add({ start: midnight - 1_500, end: midnight + 60_000 });

      await sync.flush();

      expect(mockSendHeartbeat.mock.calls.map(call => call.slice(0, 2))).toEqual([[60, 0]]);
    });

    it('keeps a stretch shorter than a second until the next count continues it', async () => {
      const sync = make();
      sync.add({ start: NOW - 500, end: NOW });

      await sync.flush();

      expect(mockSendHeartbeat).not.toHaveBeenCalled();
      expect(sync.waitingSeconds()).toBe(0);

      sync.add({ start: NOW, end: NOW + 500 });
      vi.setSystemTime(NOW + 500);
      await sync.flush();

      expect(mockSendHeartbeat).toHaveBeenCalledWith(1, 0, expect.any(String));
    });

    it('drops a stretch shorter than a second when newer time waits behind it', async () => {
      const sync = make();
      sync.add({ start: NOW - 5_000, end: NOW - 4_500 });
      sync.add(seg(3, 0));

      await sync.flush();

      expect(mockSendHeartbeat.mock.calls.map(call => call.slice(0, 2))).toEqual([[3, 0]]);
    });

    it('drops time older than the server accepts, says so, and still sends the recent time', async () => {
      const sync = make();
      sync.add({ start: NOW - 90_000_000, end: NOW - 89_940_000 });
      sync.add(seg(30, 0));

      await sync.flush();

      expect(mockReportActivityIssue).toHaveBeenCalledWith('dropped_too_old', {
        seconds: 60,
        endedSecondsAgo: 89_940,
      });
      expect(mockSendHeartbeat.mock.calls.map(call => call.slice(0, 2))).toEqual([[30, 0]]);
    });
  });

  describe('sendOnExit', () => {
    it('sends the oldest piece without waiting, and forgets it when the answer comes', async () => {
      const sync = make();
      sync.add(seg(100, 80));
      sync.add(seg(30, 10));

      sync.sendOnExit();
      await settle();

      expect(mockSendHeartbeatOnExit.mock.calls.map(call => call.slice(0, 2))).toEqual([[20, 80]]);
      expect(sync.waitingSeconds()).toBe(20);
      expect(loadServerSeconds('u1', DAY)).toBe(90);
    });

    it('keeps the time when no answer comes back, to be sent at the next load', async () => {
      mockSendHeartbeatOnExit.mockResolvedValue(null);
      const sync = make();
      sync.add(seg(60, 0));

      sync.sendOnExit();
      await settle();

      expect(loadPending('u1')).toEqual([seg(60, 0)]);
      expect(sync.waitingSeconds()).toBe(60);
      expect(loadServerSeconds('u1', DAY)).toBeNull();
    });

    it('treats a request that rejects as not acknowledged, so the piece can be sent again', async () => {
      const rejected = Promise.reject(new Error('exit request failed'));
      const handled = vi.spyOn(rejected, 'catch');
      mockSendHeartbeatOnExit.mockReturnValueOnce(rejected);
      const sync = make();
      sync.add(seg(60, 0));

      sync.sendOnExit();
      await settle();

      expect(handled).toHaveBeenCalled();
      expect(loadPending('u1')).toEqual([seg(60, 0)]);
      expect(sync.waitingSeconds()).toBe(60);

      // The piece is no longer on its way, so the next send is not blocked.
      await sync.flush();

      expect(mockSendHeartbeat.mock.calls.map(call => call.slice(0, 2))).toEqual([[60, 0]]);
    });

    it('only saves the time while offline', () => {
      online = false;
      const sync = make();
      sync.add(seg(60, 0));

      sync.sendOnExit();

      expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();
      expect(loadPending('u1')).toEqual([seg(60, 0)]);
    });

    it('sends nothing when nothing is waiting', () => {
      make().sendOnExit();

      expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();
    });

    it('never sends a second request while one is still on its way', async () => {
      const gate = deferred<typeof ANSWER | null>();
      mockSendHeartbeatOnExit.mockReturnValueOnce(gate.promise);
      const sync = make();
      sync.add(seg(100, 80));
      sync.add(seg(30, 10));

      sync.sendOnExit();
      sync.sendOnExit();
      void sync.flush();

      expect(mockSendHeartbeatOnExit).toHaveBeenCalledTimes(1);
      expect(mockSendHeartbeat).not.toHaveBeenCalled();
      expect(loadPending('u1')).toEqual([seg(100, 80), seg(30, 10)]);

      gate.resolve(ANSWER);
      await settle();
      await sync.flush();

      expect(mockSendHeartbeat.mock.calls.map(call => call.slice(0, 2))).toEqual([[20, 10]]);
    });

    it('waits for a running send instead of starting another', () => {
      const gate = deferred<typeof ANSWER>();
      mockSendHeartbeat.mockReturnValue(gate.promise);
      const sync = make();
      sync.add(seg(100, 80));
      sync.add(seg(30, 10));
      void sync.flush();

      sync.sendOnExit();

      expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();
    });

    it('sends the failed piece again at the next exit', async () => {
      mockSendHeartbeat.mockRejectedValueOnce({ response: { status: 500 } });
      const sync = make();
      sync.add(seg(60, 0));
      await sync.flush();

      sync.sendOnExit();
      await settle();

      expect(mockSendHeartbeatOnExit.mock.calls.map(call => call.slice(0, 2))).toEqual([[60, 0]]);
    });
  });

  describe('the clock, the browser copy and the end of the page', () => {
    it('moves everything with a clock that was set back, so ages stay right', async () => {
      mockSendHeartbeat.mockRejectedValueOnce({ response: { status: 500 } });
      const sync = make();
      sync.add(seg(100, 80));
      await sync.flush(); // now in the outbox
      sync.add(seg(30, 10));

      sync.shift(-60_000);
      await sync.flush();

      expect(mockSendHeartbeat.mock.calls.at(-2)?.slice(0, 2)).toEqual([20, 140]);
      expect(mockSendHeartbeat.mock.calls.at(-1)?.slice(0, 2)).toEqual([20, 70]);
    });

    it('takes time an earlier session left in the browser', async () => {
      savePending('u1', [seg(120, 60)]);
      const sync = make();

      expect(sync.adoptStored()).toBe(true);
      await sync.flush();

      expect(mockSendHeartbeat).toHaveBeenCalledWith(60, 60, expect.any(String));
    });

    it('says there is nothing to take when nothing was left, or nobody is signed in', () => {
      expect(make().adoptStored()).toBe(false);

      savePending('u1', [seg(120, 60)]);
      expect(make({ userId: null }).adoptStored()).toBe(false);
    });

    it('writes what is not acknowledged only while it leads', () => {
      const sync = make({ leader: false });
      sync.add(seg(60, 0));

      sync.persist();

      expect(memory.has(pendingKey('u1'))).toBe(false);
    });

    it('writes what is not acknowledged when asked', () => {
      const sync = make();
      sync.add(seg(60, 0));

      sync.persist();

      expect(loadPending('u1')).toEqual([seg(60, 0)]);
    });
  });
});
