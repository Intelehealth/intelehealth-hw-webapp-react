import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSendHeartbeat = vi.fn();
const mockSendHeartbeatOnExit = vi.fn();

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

import { useActivityHeartbeat } from '../../../../modules/daily-time-tracking/hooks/useActivityHeartbeat';
import { flushActivityHeartbeat } from '../../../../modules/daily-time-tracking/utils/activity-flush';
import { pendingKey, serverKey } from '../../../../modules/daily-time-tracking/utils/activity-buffer';
import { ACTIVITY_KEY, ACTIVITY_PENDING_EVENT, ACTIVITY_SENT_EVENT, HEARTBEAT_MAX_SECONDS, HIDE_SEND_MIN_GAP_MS, HIDE_SEND_MIN_SECONDS, IDLE_LIMIT_MS, LEASE_KEY, MAX_ENDED_SECONDS_AGO } from '../../../../modules/daily-time-tracking/constants/activity-config';

let hidden = false;
let online = true;

const setHidden = (value: boolean) => {
  hidden = value;
  document.dispatchEvent(new Event('visibilitychange'));
};

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const move = () => window.dispatchEvent(new Event('mousemove'));

// the seconds that count after the last move
const IDLE_SECONDS = IDLE_LIMIT_MS / 1000;

// One minute at a time, with a mouse move before each, so the health worker never looks away.
const advanceActive = async (minutes: number) => {
  for (let i = 0; i < minutes; i += 1) {
    move();
    await advance(60_000);
  }
};

// The hook sends on events, not on a timer. The connection coming back is one
// of those events: it counts what has passed and sends what is waiting.
const sendNow = () =>
  act(async () => {
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);
  });

const sentSeconds = () => mockSendHeartbeat.mock.calls.map(call => call[0]);
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
// every heartbeat as [seconds, how many seconds ago its period ended]
const sentPeriods = () =>
  mockSendHeartbeat.mock.calls.map(call => [call[0], call[1]]);

const ANSWER = { activityDate: '2026-10-27', todaySeconds: 60 };

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

type Lease = { id: string; ts: number; upTo: number };
const writeLease = (lease: Lease) =>
  memory.set(LEASE_KEY, JSON.stringify(lease));
const readLease = (): Lease | null => {
  const raw = memory.get(LEASE_KEY);
  return raw ? (JSON.parse(raw) as Lease) : null;
};

// A request that stays open until the test finishes it.
const holdNextRequest = () => {
  let finish: (value: unknown) => void = () => undefined;
  mockSendHeartbeat.mockImplementationOnce(
    () => new Promise(resolve => (finish = resolve))
  );
  return (value: unknown = ANSWER) =>
    act(async () => {
      finish(value);
      await vi.advanceTimersByTimeAsync(0);
    });
};

beforeEach(() => {
  useMemoryStorage();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-27T10:00:00'));
  mockSendHeartbeat.mockReset();
  mockSendHeartbeatOnExit.mockReset();
  mockSendHeartbeat.mockResolvedValue(ANSWER);
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

describe('useActivityHeartbeat', () => {
  it('uses the same limit the server accepts', () => {
    expect(HEARTBEAT_MAX_SECONDS).toBe(3600);
  });

  it('stops counting after thirty minutes without a move', () => {
    expect(IDLE_LIMIT_MS).toBe(30 * 60_000);
  });

  it('sends a hidden page only when enough is waiting and not too often', () => {
    expect(HIDE_SEND_MIN_SECONDS).toBe(60);
    expect(HIDE_SEND_MIN_GAP_MS).toBe(5 * 60_000);
  });

  describe('when it sends', () => {
    it('sends nothing on its own, however long the page stays open and in use', async () => {
      renderHook(() => useActivityHeartbeat());

      await advanceActive(120);

      expect(mockSendHeartbeat).not.toHaveBeenCalled();
      expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();
    });

    it('sends the time that has passed when an event asks for it', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(3 * 60_000);
      expect(mockSendHeartbeat).not.toHaveBeenCalled();
      await sendNow();

      expect(sentPeriods()).toEqual([[180, 0]]);
    });

    it('sends nothing when the connection returns and nothing has passed', async () => {
      renderHook(() => useActivityHeartbeat());

      await sendNow();

      expect(mockSendHeartbeat).not.toHaveBeenCalled();
    });
  });

  describe('a hidden page', () => {
    it('keeps counting while the page is hidden, because the person is still working', async () => {
      renderHook(() => useActivityHeartbeat());

      setHidden(true);
      await advance(60_000);
      await sendNow();

      expect(sentSeconds()).toEqual([60]);
    });

    it('keeps counting after the page is shown again', async () => {
      renderHook(() => useActivityHeartbeat());

      setHidden(true);
      await advance(60_000);
      setHidden(false);
      await advance(60_000);
      await sendNow();

      expect(sentSeconds()).toEqual([120]);
    });

    it('sends the waiting seconds at once when the page is hidden and enough is waiting', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(90_000);
      setHidden(true);

      expect(mockSendHeartbeatOnExit).toHaveBeenCalledTimes(1);
      expect(mockSendHeartbeatOnExit).toHaveBeenCalledWith(90, 0, expect.any(String));
      expect(mockSendHeartbeat).not.toHaveBeenCalled();
    });

    it('does not send when hiding with less than a minute waiting, and sends it later', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(HIDE_SEND_MIN_SECONDS * 1000 - 1_000);
      setHidden(true);
      expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();

      setHidden(false);
      await sendNow();
      expect(sentSeconds()).toEqual([59]);
    });

    it('does not send again when hiding within five minutes of the last send', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(90_000);
      setHidden(true); // sent
      setHidden(false);
      await advance(120_000);
      setHidden(true); // 120 s since the last send: only saved

      expect(mockSendHeartbeatOnExit).toHaveBeenCalledTimes(1);
    });

    it('sends everything that waits once five minutes have passed since the last send', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(90_000);
      setHidden(true); // sent, but the request is not answered
      setHidden(false);
      await advance(120_000);
      setHidden(true); // too soon
      setHidden(false);
      await advance(200_000);
      setHidden(true); // 320 s since the last send

      expect(mockSendHeartbeatOnExit).toHaveBeenCalledTimes(2);
      // the 90 s that were never answered go out again with everything since
      expect(mockSendHeartbeatOnExit).toHaveBeenLastCalledWith(410, 0, expect.any(String));
    });
  });

  describe('a page that is closing', () => {
    it('sends the waiting seconds at once on pagehide', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(45_000);
      window.dispatchEvent(new Event('pagehide'));

      expect(mockSendHeartbeatOnExit).toHaveBeenCalledTimes(1);
      expect(mockSendHeartbeatOnExit).toHaveBeenCalledWith(45, 0, expect.any(String));
    });

    it('does not send the same seconds twice when hide and pagehide both fire', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(45_000);
      setHidden(true); // under a minute: only saved
      window.dispatchEvent(new Event('pagehide'));

      expect(mockSendHeartbeatOnExit.mock.calls.map(call => call.slice(0, 2))).toEqual([[45, 0]]);
    });

    it('sends the waiting seconds when the layout unmounts', async () => {
      const { unmount } = renderHook(() => useActivityHeartbeat());

      await advance(20_000);
      unmount();

      expect(mockSendHeartbeatOnExit).toHaveBeenCalledWith(20, 0, expect.any(String));
    });

    it('does not start a second request while one is on its way, and does not repeat its seconds', async () => {
      const finish = holdNextRequest();
      renderHook(() => useActivityHeartbeat());

      await advance(60_000);
      await sendNow(); // 60 s are on their way and stay open
      await advance(30_000);
      window.dispatchEvent(new Event('pagehide')); // the 30 s since then are only saved

      expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();

      await finish();

      expect(sentSeconds()).toEqual([60, 30]); // the 30 s go out once, after the answer
    });

    it('sends nothing at exit while offline', async () => {
      memory.set('user', JSON.stringify({ uuid: 'user-1' }));
      renderHook(() => useActivityHeartbeat());

      await advance(30_000);
      online = false;
      window.dispatchEvent(new Event('pagehide'));

      expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();
      expect(memory.has(pendingKey('user-1'))).toBe(true); // kept for later
    });
  });

  describe('away from the page', () => {
    it('stops counting after thirty minutes without a move', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(2 * IDLE_LIMIT_MS);
      await sendNow();

      expect(sentPeriods()).toEqual([[IDLE_SECONDS, IDLE_SECONDS]]);
    });

    it('a move starts the thirty minutes again', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(4 * 60_000);
      move();
      await advance(IDLE_LIMIT_MS + 60_000);
      await sendNow();

      // 4 minutes before the move, then thirty minutes after it
      expect(sum(sentSeconds())).toBe(4 * 60 + IDLE_SECONDS);
    });

    it.each(['mousedown', 'keydown', 'wheel', 'scroll', 'touchstart'])(
      'a %s counts as a move',
      async name => {
        renderHook(() => useActivityHeartbeat());

        await advance(4 * 60_000);
        window.dispatchEvent(new Event(name));
        await advance(IDLE_LIMIT_MS + 60_000);
        await sendNow();

        expect(sum(sentSeconds())).toBe(4 * 60 + IDLE_SECONDS);
      }
    );

    it('coming back to a hidden page counts as a move', async () => {
      renderHook(() => useActivityHeartbeat());

      setHidden(true);
      await advance(IDLE_LIMIT_MS + 60_000); // thirty minutes count, the next one is away time
      await sendNow();
      expect(sum(sentSeconds())).toBe(IDLE_SECONDS);

      setHidden(false);
      await advance(60_000);
      await sendNow();

      expect(sum(sentSeconds())).toBe(IDLE_SECONDS + 60);
    });

    it('does not credit a long sleep of the computer', async () => {
      renderHook(() => useActivityHeartbeat());

      // the timers do not run for two hours, then something happens
      vi.setSystemTime(new Date('2026-10-27T12:00:00'));
      await sendNow();

      expect(sum(sentSeconds())).toBe(IDLE_SECONDS);
    });

    it('counts a move that comes less than a second after the last as the same move', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(5_000);
      move();
      const first = memory.get(ACTIVITY_KEY);
      await advance(500);
      move();

      expect(memory.get(ACTIVITY_KEY)).toBe(first);
    });
  });

  describe('offline and failures', () => {
    it('keeps the seconds while offline and sends them when the connection returns', async () => {
      renderHook(() => useActivityHeartbeat());

      online = false;
      await advance(3 * 60_000);
      await sendNow(); // an event while offline sends nothing
      expect(mockSendHeartbeat).not.toHaveBeenCalled();

      online = true;
      await sendNow();

      expect(sentSeconds()).toEqual([180]);
    });

    it('sends a long offline stretch in pieces of at most an hour', async () => {
      renderHook(() => useActivityHeartbeat());

      online = false;
      await advanceActive(125); // 7,500 seconds, the person is working all the time
      online = true;
      await sendNow();

      expect(sentSeconds()).toEqual([3600, 3600, 300]);
    });

    it('sends the waiting seconds at the next event if the online event is missed', async () => {
      renderHook(() => useActivityHeartbeat());

      online = false;
      await advance(2 * 60_000);
      online = true;
      await advance(60_000);
      setHidden(true);

      expect(mockSendHeartbeatOnExit).toHaveBeenCalledWith(180, 0, expect.any(String));
    });

    it('sends a heartbeat that failed again with the next one, so the time is not lost', async () => {
      mockSendHeartbeat.mockRejectedValueOnce(new Error('timeout'));
      renderHook(() => useActivityHeartbeat());

      await advance(60_000);
      await sendNow(); // fails
      await advance(60_000);
      await sendNow(); // the minute that failed goes out with this one

      expect(mockSendHeartbeat.mock.calls.map(call => [call[0], call[1]])).toEqual([
        [60, 0],
        [120, 0],
      ]);
    });

    it('tries again at the next event only, not straight away', async () => {
      mockSendHeartbeat.mockRejectedValue(new Error('Network Error'));
      renderHook(() => useActivityHeartbeat());

      await advance(60_000);
      await sendNow();
      await advance(10 * 60_000);

      expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
    });

    it.each([500, 503, 401, 408, 429])(
      'sends a heartbeat again after a %i',
      async status => {
        mockSendHeartbeat.mockRejectedValueOnce({ response: { status } });
        renderHook(() => useActivityHeartbeat());

        await advance(60_000);
        await sendNow();
        await advance(60_000);
        await sendNow();

        expect(sentSeconds()).toEqual([60, 120]);
      }
    );

    it.each([400, 403, 404, 422])(
      'does not send a heartbeat again after a %i, the server called the request wrong',
      async status => {
        mockSendHeartbeat.mockRejectedValueOnce({ response: { status } });
        renderHook(() => useActivityHeartbeat());

        await advance(60_000);
        await sendNow();
        await advance(60_000);
        await sendNow();

        expect(sentSeconds()).toEqual([60, 60]);
      }
    );

    it('does not start a second send while one is still on its way, and loses no seconds', async () => {
      const finish = holdNextRequest();
      renderHook(() => useActivityHeartbeat());

      await advance(60_000);
      await sendNow(); // the first send starts and stays open
      await advance(60_000);
      await sendNow(); // while it is still open
      expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);

      await finish();

      // the seconds that waited go out as soon as the first send is done
      expect(sentSeconds()).toEqual([60, 60]);
      await advance(60_000);
      await sendNow();
      expect(sentSeconds()).toEqual([60, 60, 60]);
    });

    it('does not send what is left once the page is gone', async () => {
      const finish = holdNextRequest();
      const { unmount } = renderHook(() => useActivityHeartbeat());

      await advance(60_000);
      await sendNow();
      await advance(30_000);
      unmount(); // the open request is the only one sent; the rest stays in the browser

      await finish();

      expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
    });
  });

  it('stops after unmount', async () => {
    const { unmount } = renderHook(() => useActivityHeartbeat());

    await advance(60_000);
    await sendNow();
    expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);

    unmount();
    mockSendHeartbeatOnExit.mockReset();
    await advance(5 * 60_000);
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('pagehide'));
    setHidden(true);

    expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
    expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();
  });
});

describe('useActivityHeartbeat: when the seconds were spent', () => {
  it('knows the server accepts a period that ended up to a day ago', () => {
    expect(MAX_ENDED_SECONDS_AGO).toBe(86_400);
  });

  it('says time that is sent as soon as it ends ended 0 seconds ago', async () => {
    renderHook(() => useActivityHeartbeat());

    await advance(3 * 60_000);
    await sendNow();

    expect(sentPeriods()).toEqual([[180, 0]]);
  });

  it('sends counts and ages as numbers, and an id the portal does not read as a time', async () => {
    renderHook(() => useActivityHeartbeat());

    await advance(60_000);
    await sendNow();

    const [seconds, age, requestId] = mockSendHeartbeat.mock.calls[0];
    expect(mockSendHeartbeat.mock.calls[0].length).toBe(3);
    expect([seconds, age].every(value => typeof value === 'number' && value < 1_000_000)).toBe(true);
    // letters, digits and - only, at most 64 characters: what the portal accepts
    expect(requestId).toMatch(/^[A-Za-z0-9._:-]{1,64}$/);
  });

  it('sends the same id when the same period is sent again, and a new one for a new period', async () => {
    mockSendHeartbeat.mockRejectedValueOnce({ response: { status: 500 } });
    renderHook(() => useActivityHeartbeat());

    await advance(60_000);
    await sendNow(); // fails: the same piece is sent again at the next event
    await sendNow();
    await advance(60_000);
    await sendNow();

    const ids = mockSendHeartbeat.mock.calls.map(call => call[2]);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[2]).not.toBe(ids[1]);
  });

  it('puts seconds that waited offline where they belong: one piece, ended just now', async () => {
    renderHook(() => useActivityHeartbeat());

    online = false;
    await advanceActive(11); // 660 seconds of work
    online = true;
    await sendNow();

    expect(sentPeriods()).toEqual([[660, 0]]); // one piece: 0 to 660 s, ended just now
  });

  it('splits a long stretch in pieces of an hour and gives each its own age', async () => {
    renderHook(() => useActivityHeartbeat());

    online = false;
    await advanceActive(125); // 7,500 seconds
    online = true;
    await sendNow();

    expect(sentPeriods()).toEqual([
      [3600, 3900], // 0 to 3,600 s, ended 3,900 s before the 7,500 s mark
      [3600, 300], // 3,600 to 7,200 s
      [300, 0], // 7,200 to 7,500 s
    ]);
  });

  it('keeps the gap when the person was away: two stretches, each with its own end', async () => {
    renderHook(() => useActivityHeartbeat());

    online = false;
    await advance(2 * 60_000);
    move(); // active for 2 minutes, then away
    await advance(IDLE_LIMIT_MS + 10 * 60_000); // thirty more minutes count (idle limit), 10 are away
    move(); // back at 42 minutes
    await advance(2 * 60_000); // 2 more minutes of work, 44 minutes in all
    online = true;
    await sendNow();

    // first stretch 0 to 32 minutes (1,920 s), second 42 to 44 minutes (120 s); sent at the 44 minute mark
    expect(sentPeriods()).toEqual([
      [1920, 720], // 0 to 1,920 s, ended 720 s before the 2,640 s mark
      [120, 0], // 2,520 to 2,640 s
    ]);
    expect(sum(sentSeconds())).toBe(2040);
  });

  it('drops time older than the server accepts and still sends the recent time', async () => {
    renderHook(() => useActivityHeartbeat());

    online = false;
    await advance(25 * 3_600_000 - 2 * 60_000); // 25 hours offline, nobody moves
    move();
    await advance(2 * 60_000);
    online = true;
    await sendNow();

    // the first thirty minutes of work are more than 24 hours old and are dropped; the last 2 minutes are sent
    expect(sentPeriods()).toEqual([[120, 0]]);
  });

  it('sends the time that waited behind a request on its way as soon as that request is answered', async () => {
    const finish = holdNextRequest();
    renderHook(() => useActivityHeartbeat());

    await advance(60_000);
    await sendNow(); // 0 to 60 s is on its way
    await advance(60_000);
    await sendNow(); // 60 to 120 s waits behind it
    expect(sentPeriods()).toEqual([[60, 0]]);

    await finish();

    // the waiting minute ended at the 120 s mark, which is now
    expect(sentPeriods()).toEqual([
      [60, 0],
      [60, 0],
    ]);
  });
});

describe('useActivityHeartbeat: several tabs of one browser', () => {
  // Another tab that leads: it renews its lease every 15 seconds while time passes.
  const advanceWhileOtherTabLeads = async (ms: number) => {
    for (let spent = 0; spent < ms; spent += 15_000) {
      writeLease({ id: 'other', ts: Date.now(), upTo: Date.now() });
      await advance(Math.min(15_000, ms - spent));
    }
  };
  // Something done in another tab, as the browser tells this one about it.
  const otherTabMoved = (at: number, before: number | null) =>
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: ACTIVITY_KEY,
          newValue: String(at),
          oldValue: before === null ? null : String(before),
        })
      );
    });

  it('is the leader when no other tab is, and renews its lease', async () => {
    renderHook(() => useActivityHeartbeat());
    const first = readLease();
    expect(first).not.toBeNull();
    expect(first?.id).not.toBe('other');

    await advance(45_000);

    expect(readLease()?.id).toBe(first?.id);
    expect(readLease()?.ts).toBe(Date.now()); // renewed at the 45 s check
  });

  it('counts and sends nothing while another tab leads, and leaves its lease alone', async () => {
    writeLease({ id: 'other', ts: Date.now(), upTo: Date.now() });
    const { unmount } = renderHook(() => useActivityHeartbeat());

    await advanceWhileOtherTabLeads(5 * 60_000);
    move();
    await advanceWhileOtherTabLeads(3 * 60_000);
    await sendNow();

    expect(mockSendHeartbeat).not.toHaveBeenCalled();
    expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();
    expect(readLease()?.id).toBe('other');

    unmount();
    expect(readLease()?.id).toBe('other');
    expect(readLease()?.ts).not.toBe(0);
  });

  it('takes over when the leader stops renewing, and counts the time in between as far as moves allow', async () => {
    writeLease({ id: 'other', ts: Date.now(), upTo: Date.now() });
    renderHook(() => useActivityHeartbeat());

    await advance(50_000);
    move(); // the person is working here at 50 s; the other tab has stopped
    await advance(70_000); // the lease runs out at 105 s, this tab leads from then
    await sendNow();

    // the leader had counted up to 0 s; with the move at 50 s the time to 105 s counts, and then on to 120 s
    expect(sentPeriods()).toEqual([[120, 0]]);
    expect(readLease()?.id).not.toBe('other');
  });

  it('does not count the time between if nobody moved', async () => {
    writeLease({ id: 'other', ts: Date.now(), upTo: Date.now() });
    renderHook(() => useActivityHeartbeat());

    await advance(120_000); // the lease runs out at 105 s; opening the page is not a move of the other tab
    await sendNow();

    expect(sentPeriods()).toEqual([[15, 0]]); // only from the takeover on
  });

  it('starts from now when the lease was free for a long time, even if someone moved a moment ago', async () => {
    memory.set(ACTIVITY_KEY, String(Date.now() - 10_000));
    writeLease({ id: 'other', ts: 0, upTo: Date.now() - 3 * 3_600_000 });
    renderHook(() => useActivityHeartbeat());

    await advance(60_000);
    await sendNow();

    expect(sentPeriods()).toEqual([[60, 0]]);
  });

  it('continues from where a leader that let go had counted', async () => {
    memory.set(ACTIVITY_KEY, String(Date.now() - 10_000)); // the last move was 10 s ago
    writeLease({ id: 'other', ts: 0, upTo: Date.now() - 20_000 });
    renderHook(() => useActivityHeartbeat());

    await advance(60_000);
    await sendNow();

    // 20 s before this tab opened, counted because the move 10 s ago allows it, plus the minute here
    expect(sentPeriods()).toEqual([[80, 0]]);
  });

  it('keeps counting while hidden when the person moves in another tab', async () => {
    renderHook(() => useActivityHeartbeat());
    setHidden(true);

    await advance(4 * 60_000);
    await otherTabMoved(Date.now(), Date.now() - 4 * 60_000);
    await advance(IDLE_LIMIT_MS + 60_000);
    await sendNow();

    // 4 minutes, then thirty more minutes after the move in the other tab: 2,040, not the 1,800 a single tab would count
    expect(sum(sentSeconds())).toBe(4 * 60 + IDLE_SECONDS);
  });

  it('does not count away time before a move in another tab', async () => {
    renderHook(() => useActivityHeartbeat());

    await advance(2 * IDLE_LIMIT_MS); // nobody moves for an hour: thirty minutes count
    const before = Date.now() - 2 * IDLE_LIMIT_MS;
    await otherTabMoved(Date.now(), before);
    await advance(60_000);
    await sendNow();

    // thirty minutes of the idle stretch, then the minute after the move: 1,860, not 61 minutes
    expect(sum(sentSeconds())).toBe(IDLE_SECONDS + 60);
  });

  it('takes a move in another tab that does not say what came before it', async () => {
    renderHook(() => useActivityHeartbeat());

    await advance(60_000);
    await otherTabMoved(Date.now(), null);
    await advance(60_000);
    await sendNow();

    expect(sum(sentSeconds())).toBe(120);
  });

  it.each([
    ['another key', { key: 'something-else', newValue: '5', oldValue: null }],
    ['no value', { key: ACTIVITY_KEY, newValue: null, oldValue: null }],
    ['a value that is not a time', { key: ACTIVITY_KEY, newValue: 'soon', oldValue: null }],
  ])('ignores a storage event with %s', async (_label, init) => {
    renderHook(() => useActivityHeartbeat());

    await advance(2 * IDLE_LIMIT_MS);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', init));
    });
    await sendNow();

    expect(sum(sentSeconds())).toBe(IDLE_SECONDS); // still only the first thirty minutes
  });

  it('writes its own moves where the other tabs can see them', async () => {
    renderHook(() => useActivityHeartbeat());

    await advance(5_000);
    move();

    expect(memory.get(ACTIVITY_KEY)).toBe(String(Date.now()));
  });

  it('sends what it has at once when another tab takes the lease, and then stays quiet', async () => {
    renderHook(() => useActivityHeartbeat());

    await advance(30_000);
    writeLease({ id: 'other', ts: Date.now(), upTo: Date.now() });
    await advance(15_000); // the check at 45 s finds another leader

    expect(mockSendHeartbeatOnExit).toHaveBeenCalledWith(45, 0, expect.any(String));

    await advanceWhileOtherTabLeads(5 * 60_000);
    expect(mockSendHeartbeat).not.toHaveBeenCalled();
    expect(mockSendHeartbeatOnExit).toHaveBeenCalledTimes(1);
  });

  it('does not write the time kept in the browser once another tab leads', async () => {
    memory.set('user', JSON.stringify({ uuid: 'user-1' }));
    renderHook(() => useActivityHeartbeat());
    await advance(20_000);
    const before = memory.get(pendingKey('user-1'));
    expect(before).toBeDefined();

    writeLease({ id: 'other', ts: Date.now(), upTo: Date.now() });
    await advance(15_000); // loses the lease and sends

    expect(mockSendHeartbeatOnExit).toHaveBeenCalledTimes(1);
    expect(memory.get(pendingKey('user-1'))).toBe(before);
  });

  it('lets the lease go when the page goes away, so another tab can lead at once', async () => {
    const { unmount } = renderHook(() => useActivityHeartbeat());
    await advance(20_000);

    unmount();

    expect(readLease()?.ts).toBe(0);
    expect(mockSendHeartbeatOnExit).toHaveBeenCalledWith(20, 0, expect.any(String));
  });

  it('leads again after the page comes back from the cache', async () => {
    renderHook(() => useActivityHeartbeat());
    await advance(20_000);
    window.dispatchEvent(new Event('pagehide'));
    expect(readLease()?.ts).toBe(0);

    await advance(15_000); // the check at 30 s takes the free lease

    expect(readLease()?.ts).toBeGreaterThan(0);
    await advance(60_000);
    await sendNow();
    expect(sum(sentSeconds())).toBeGreaterThan(0);
  });

  it('a tab that is only hidden keeps the lease', async () => {
    renderHook(() => useActivityHeartbeat());
    const id = readLease()?.id;

    setHidden(true);
    await advance(60_000);

    expect(readLease()?.id).toBe(id);
    expect(readLease()?.ts).not.toBe(0);
  });

  it('counts on its own when localStorage keeps nothing', async () => {
    vi.mocked(window.localStorage.getItem).mockImplementation(() => null);
    writeLease({ id: 'other', ts: Date.now(), upTo: Date.now() }); // invisible to this tab
    renderHook(() => useActivityHeartbeat());

    await advance(2 * 60_000);
    await sendNow();

    expect(sentSeconds()).toEqual([120]);
  });

  it('counts on its own when localStorage cannot be written', async () => {
    vi.mocked(window.localStorage.setItem).mockImplementation(() => {
      throw new Error('SecurityError');
    });
    renderHook(() => useActivityHeartbeat());

    await advance(2 * 60_000);
    move();
    await sendNow();

    expect(sentSeconds()).toEqual([120]);
  });

  it('two tabs of the same browser together send each minute once', async () => {
    // tab one is this hook; tab two is simulated by the other-tab helpers: it never leads while this one renews
    renderHook(() => useActivityHeartbeat());

    for (let i = 0; i < 10; i += 1) {
      await advance(60_000);
      await otherTabMoved(Date.now(), Date.now() - 60_000); // the person works in the other tab
    }
    await sendNow();

    expect(sentPeriods()).toEqual([[600, 0]]);
  });
});

describe('useActivityHeartbeat: the time kept in the browser', () => {
  const USER = JSON.stringify({ uuid: 'user-1', name: 'Nurse One' });
  type Record = {
    userId: string;
    date: string;
    segments: { start: number; end: number }[];
  };
  const stored = (userId = 'user-1') => {
    const raw = memory.get(pendingKey(userId));
    return raw ? (JSON.parse(raw) as Record) : null;
  };
  const storedSeconds = (userId = 'user-1') =>
    (stored(userId)?.segments ?? []).reduce(
      (total, s) => total + (s.end - s.start) / 1000,
      0
    );

  beforeEach(() => {
    memory.set('user', USER);
  });

  describe('what is written', () => {
    it('is written under the signed-in user, with the day it is for', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(20_000);

      expect(storedSeconds()).toBeGreaterThanOrEqual(15);
      expect(stored()?.userId).toBe('user-1');
      expect(stored()?.date).toBe('2026-10-27');
      expect(stored('someone-else')).toBeNull();
    });

    it('is removed once it has been sent', async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(61_000);
      await sendNow();

      expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
      expect(stored()).toBeNull();
    });

    it('is not written when nobody is signed in', async () => {
      memory.delete('user');
      renderHook(() => useActivityHeartbeat());

      await advance(20_000);

      expect([...memory.keys()].some(k => k.includes('pending'))).toBe(false);
    });

    it('is not written, or erased, by a tab that is not the leader', async () => {
      const other = JSON.stringify({
        userId: 'user-1',
        date: '2026-10-27',
        segments: [{ start: Date.now(), end: Date.now() + 60_000 }],
      });
      memory.set(pendingKey('user-1'), other);
      writeLease({ id: 'other', ts: Date.now(), upTo: Date.now() });
      renderHook(() => useActivityHeartbeat());

      for (let spent = 0; spent < 120_000; spent += 15_000) {
        writeLease({ id: 'other', ts: Date.now(), upTo: Date.now() });
        await advance(15_000);
      }

      expect(memory.get(pendingKey('user-1'))).toBe(other);
      expect(mockSendHeartbeat).not.toHaveBeenCalled();
    });

    it('stays in the browser when a heartbeat fails, and goes out at the next login', async () => {
      mockSendHeartbeat.mockRejectedValueOnce(new Error('Network Error'));
      const { unmount } = renderHook(() => useActivityHeartbeat());

      await advance(60_000);
      await sendNow(); // the heartbeat fails
      expect(storedSeconds()).toBeGreaterThanOrEqual(60);
      unmount();
      mockSendHeartbeat.mockClear();

      renderHook(() => useActivityHeartbeat()); // the next login
      await advance(0);

      expect(mockSendHeartbeat).toHaveBeenCalledTimes(1);
      expect(mockSendHeartbeat.mock.calls[0][0]).toBeGreaterThanOrEqual(60);
    });
  });

  describe('what is found at the next page load', () => {
    const left = (start: number, end: number, userId = 'user-1') =>
      memory.set(
        pendingKey(userId),
        JSON.stringify({
          userId,
          date: '2026-10-27',
          segments: [{ start: Date.now() - start, end: Date.now() - end }],
        })
      );

    it('is sent at once', async () => {
      left(600_000, 540_000);

      renderHook(() => useActivityHeartbeat());
      await advance(0);

      expect(sentPeriods()).toEqual([[60, 540]]);
    });

    it('is also read when it was written as a plain list', async () => {
      const now = Date.now();
      memory.set(
        pendingKey('user-1'),
        JSON.stringify([{ start: now - 600_000, end: now - 540_000 }])
      );

      renderHook(() => useActivityHeartbeat());
      await advance(0);

      expect(sentPeriods()).toEqual([[60, 540]]);
    });

    it('goes out in one request together with the seconds of the reload, not in two', async () => {
      const now = Date.now();
      // the page that went away counted up to 3 s ago and let the lease go; the person moved 0.5 s ago
      writeLease({ id: 'old-tab', ts: 0, upTo: now - 3_000 });
      memory.set(ACTIVITY_KEY, String(now - 500));
      left(120_000, 3_000);

      renderHook(() => useActivityHeartbeat());
      await advance(50);

      expect(sentPeriods()).toEqual([[120, 0]]);
    });

    it('is not sent for another user who shares the browser', async () => {
      left(600_000, 540_000, 'user-2');

      renderHook(() => useActivityHeartbeat());
      await advance(10_000);

      expect(mockSendHeartbeat).not.toHaveBeenCalled();
      expect(stored('user-2')).not.toBeNull(); // left for that user
    });

    it('is dropped when it is more than a day old', async () => {
      left(2 * 86_400_000, 2 * 86_400_000 - 60_000);

      renderHook(() => useActivityHeartbeat());
      await advance(10_000);

      expect(mockSendHeartbeat).not.toHaveBeenCalled();
    });

    it('is ignored when the entry is broken', async () => {
      memory.set(pendingKey('user-1'), '{broken');

      renderHook(() => useActivityHeartbeat());
      await advance(10_000);

      expect(mockSendHeartbeat).not.toHaveBeenCalled();
    });
  });

  describe('telling the dashboard', () => {
    const heard = (name: string) => {
      const listener = vi.fn();
      window.addEventListener(name, listener);
      return {
        listener,
        stop: () => window.removeEventListener(name, listener),
      };
    };

    it('says the server has more time once a heartbeat gets through', async () => {
      const sent = heard(ACTIVITY_SENT_EVENT);
      renderHook(() => useActivityHeartbeat());

      await advance(59_000);
      expect(sent.listener).not.toHaveBeenCalled();
      await sendNow();

      expect(sent.listener).toHaveBeenCalledTimes(1);
      expect((sent.listener.mock.calls[0][0] as CustomEvent).detail).toEqual(
        ANSWER
      );
      sent.stop();
    });

    it("remembers the server's total in the browser", async () => {
      renderHook(() => useActivityHeartbeat());

      await advance(60_000);
      await sendNow();

      expect(JSON.parse(memory.get(serverKey('user-1')) as string)).toEqual({
        userId: 'user-1',
        date: '2026-10-27',
        seconds: 60,
      });
    });

    it('says it after the waiting time was written, so the numbers agree', async () => {
      let waitingWhenTold: number | null = null;
      const listener = () => {
        waitingWhenTold = storedSeconds();
      };
      window.addEventListener(ACTIVITY_SENT_EVENT, listener);
      renderHook(() => useActivityHeartbeat());

      await advance(60_000);
      await sendNow();

      window.removeEventListener(ACTIVITY_SENT_EVENT, listener);
      expect(waitingWhenTold).toBe(0); // the sent minute is already gone from the browser
    });

    it('also says it when a request sent at exit is answered', async () => {
      mockSendHeartbeatOnExit.mockResolvedValue({
        activityDate: '2026-10-27',
        todaySeconds: 90,
      });
      const sent = heard(ACTIVITY_SENT_EVENT);
      renderHook(() => useActivityHeartbeat());

      await advance(90_000);
      setHidden(true);
      await advance(0);

      expect(sent.listener).toHaveBeenCalledTimes(1);
      expect(stored()).toBeNull();
      sent.stop();
    });

    it('stays quiet when a request sent at exit is not answered', async () => {
      mockSendHeartbeatOnExit.mockResolvedValue(null);
      const sent = heard(ACTIVITY_SENT_EVENT);
      renderHook(() => useActivityHeartbeat());

      await advance(90_000);
      setHidden(true);
      await advance(0);

      expect(sent.listener).not.toHaveBeenCalled();
      expect(storedSeconds()).toBeGreaterThanOrEqual(90); // kept for the next time
      sent.stop();
    });

    it('stays quiet when the heartbeat fails', async () => {
      mockSendHeartbeat.mockRejectedValue(new Error('Network Error'));
      const sent = heard(ACTIVITY_SENT_EVENT);
      renderHook(() => useActivityHeartbeat());

      await advance(60_000);
      await sendNow();

      expect(sent.listener).not.toHaveBeenCalled();
      sent.stop();
    });

    it('stays quiet when there is nothing to send', async () => {
      const sent = heard(ACTIVITY_SENT_EVENT);
      renderHook(() => useActivityHeartbeat());
      online = false;

      await advance(60_000);
      await sendNow();

      expect(sent.listener).not.toHaveBeenCalled();
      sent.stop();
    });

    it('says when the waiting time in the browser changed', async () => {
      const changed = heard(ACTIVITY_PENDING_EVENT);
      renderHook(() => useActivityHeartbeat());
      changed.listener.mockClear();

      await advance(15_000); // the check that writes what is waiting

      expect(changed.listener).toHaveBeenCalled();
      changed.stop();
    });
  });

  describe('when the page goes away or the person logs out', () => {
    it('sends what is waiting when the person logs out, with the login still in place', async () => {
      renderHook(() => useActivityHeartbeat());
      await advance(90_000);

      await flushActivityHeartbeat();

      expect(mockSendHeartbeat).toHaveBeenCalledWith(90, 0, expect.any(String));
      expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();
    });

    it('sends all of it, oldest first, when more than an hour is waiting', async () => {
      renderHook(() => useActivityHeartbeat());
      await advanceActive(125); // 7,500 seconds, no event sent any of it

      await flushActivityHeartbeat();

      expect(sentPeriods()).toEqual([
        [3600, 3900],
        [3600, 300],
        [300, 0],
      ]);
      expect(storedSeconds()).toBe(0);
    });

    it('keeps what could not be sent in the browser for the next login', async () => {
      mockSendHeartbeat.mockRejectedValue({ response: { status: 500 } });
      renderHook(() => useActivityHeartbeat());
      await advance(90_000);

      await flushActivityHeartbeat();

      expect(storedSeconds()).toBeGreaterThanOrEqual(90);
    });

    it('does nothing when no page is counting', async () => {
      await flushActivityHeartbeat();

      expect(mockSendHeartbeat).not.toHaveBeenCalled();
      expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();
    });

    it('does nothing after the page has been unmounted', async () => {
      const { unmount } = renderHook(() => useActivityHeartbeat());
      await advance(20_000);
      unmount();
      mockSendHeartbeat.mockClear();
      mockSendHeartbeatOnExit.mockClear();

      await flushActivityHeartbeat();

      expect(mockSendHeartbeat).not.toHaveBeenCalled();
      expect(mockSendHeartbeatOnExit).not.toHaveBeenCalled();
    });

    it('keeps the time in the browser when the page closes, so a lost request is not a lost minute', async () => {
      renderHook(() => useActivityHeartbeat());
      await advance(20_000);

      window.dispatchEvent(new Event('pagehide'));

      expect(mockSendHeartbeatOnExit).toHaveBeenCalledWith(20, 0, expect.any(String));
      expect(storedSeconds()).toBeGreaterThanOrEqual(20);
    });

    it('forgets time that was sent when the page only went to the background and stays open', async () => {
      mockSendHeartbeatOnExit.mockResolvedValue({
        activityDate: '2026-10-27',
        todaySeconds: 70,
      });
      renderHook(() => useActivityHeartbeat());
      await advance(70_000);

      setHidden(true); // sent, and answered
      await advance(0);
      setHidden(false);
      await advance(15_000); // the next check writes what is waiting now

      expect(storedSeconds()).toBeLessThan(70);
    });
  });
});
