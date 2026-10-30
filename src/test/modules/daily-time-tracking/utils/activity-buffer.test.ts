import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dayWindow, istDate, loadPending, loadServerSeconds, mergeSegments, nextDayStart, pendingKey, readUserId, saveServerSeconds, savePending, secondsWithin, serverKey } from '../../../../modules/daily-time-tracking/utils/activity-buffer';
import { ACTIVITY_PENDING_EVENT } from '../../../../modules/daily-time-tracking/constants/activity-config';

// The test setup replaces localStorage with an empty mock; this one keeps what is written.
const memory = new Map<string, string>();

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
});

describe('mergeSegments', () => {
  it('puts stretches in order', () => {
    expect(
      mergeSegments([
        { start: 500, end: 600 },
        { start: 100, end: 200 },
      ])
    ).toEqual([
      { start: 100, end: 200 },
      { start: 500, end: 600 },
    ]);
  });

  it('joins stretches that touch or overlap', () => {
    expect(
      mergeSegments([
        { start: 100, end: 200 },
        { start: 200, end: 300 },
        { start: 250, end: 400 },
        { start: 900, end: 1000 },
      ])
    ).toEqual([
      { start: 100, end: 400 },
      { start: 900, end: 1000 },
    ]);
  });

  it('drops stretches that are empty, backwards or not numbers', () => {
    expect(
      mergeSegments([
        { start: 100, end: 100 },
        { start: 300, end: 200 },
        { start: Number.NaN, end: 500 },
        { start: 100, end: Number.POSITIVE_INFINITY },
        { start: 1, end: 2 },
      ])
    ).toEqual([{ start: 1, end: 2 }]);
  });

  it('does not change what it is given', () => {
    const input = [{ start: 100, end: 200 }];
    mergeSegments(input).push({ start: 1, end: 2 });
    expect(input).toEqual([{ start: 100, end: 200 }]);
  });
});

describe('the buffer in localStorage', () => {
  it('keeps a stretch under the user and reads it back', () => {
    savePending('user-1', [{ start: 1_000, end: 61_000 }]);

    expect(memory.has(pendingKey('user-1'))).toBe(true);
    expect(loadPending('user-1')).toEqual([{ start: 1_000, end: 61_000 }]);
    expect(loadPending('user-2')).toEqual([]);
  });

  it('removes the entry when nothing is waiting', () => {
    savePending('user-1', [{ start: 1_000, end: 61_000 }]);
    savePending('user-1', []);

    expect(memory.has(pendingKey('user-1'))).toBe(false);
  });

  it('reads nothing from a broken or unexpected entry', () => {
    for (const bad of ['{broken', '"text"', '{"start":1,"end":2}', 'null', '[1,2]']) {
      memory.set(pendingKey('user-1'), bad);
      expect(loadPending('user-1')).toEqual([]);
    }
  });

  it('keeps the good stretches of an entry that has bad ones', () => {
    memory.set(
      pendingKey('user-1'),
      JSON.stringify([{ start: 1, end: 2 }, { start: 'x', end: 2 }, null])
    );

    expect(loadPending('user-1')).toEqual([{ start: 1, end: 2 }]);
  });

  it('does not throw when localStorage fails', () => {
    vi.mocked(window.localStorage.getItem).mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.mocked(window.localStorage.setItem).mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(loadPending('user-1')).toEqual([]);
    expect(() => savePending('user-1', [{ start: 1, end: 2 }])).not.toThrow();
  });

  it('keeps each user in an entry of their own', () => {
    expect(pendingKey('a')).not.toBe(pendingKey('b'));
  });
});

describe('the record that says whose time it is', () => {
  const DAY = '2026-10-27';

  it('is kept under the user and the day, and is not another user’s', () => {
    savePending('user-1', [{ start: 1_000, end: 61_000 }]);
    const record = JSON.parse(memory.get(pendingKey('user-1')) as string);

    expect(record.userId).toBe('user-1');
    expect(record.segments).toEqual([{ start: 1_000, end: 61_000 }]);
    expect(typeof record.date).toBe('string');

    memory.set(
      pendingKey('user-2'),
      JSON.stringify({ userId: 'someone-else', segments: [{ start: 1, end: 2 }] })
    );
    expect(loadPending('user-2')).toEqual([]);
  });

  it('is read when it has no owner, as an older version wrote it', () => {
    memory.set(
      pendingKey('user-1'),
      JSON.stringify({ segments: [{ start: 1, end: 2 }] })
    );

    expect(loadPending('user-1')).toEqual([{ start: 1, end: 2 }]);
  });

  it('reads nothing from a record whose list is not a list', () => {
    memory.set(
      pendingKey('user-1'),
      JSON.stringify({ userId: 'user-1', segments: 'soon' })
    );

    expect(loadPending('user-1')).toEqual([]);
  });

  it('is not written again, and nobody is told, when nothing changed', () => {
    savePending('user-1', [{ start: 1_000, end: 61_000 }]);
    const heard = vi.fn();
    window.addEventListener(ACTIVITY_PENDING_EVENT, heard);

    savePending('user-1', [{ start: 1_000, end: 61_000 }]);
    savePending('user-2', []);

    window.removeEventListener(ACTIVITY_PENDING_EVENT, heard);
    expect(heard).not.toHaveBeenCalled();
  });

  describe('the server total of a day', () => {
    it('is kept under the user and the day', () => {
      saveServerSeconds('user-1', DAY, 600);

      expect(memory.has(serverKey('user-1'))).toBe(true);
      expect(loadServerSeconds('user-1', DAY)).toBe(600);
      expect(loadServerSeconds('user-2', DAY)).toBeNull();
      expect(loadServerSeconds('user-1', '2026-10-28')).toBeNull();
    });

    it('only grows within a day', () => {
      saveServerSeconds('user-1', DAY, 600);
      saveServerSeconds('user-1', DAY, 300);
      expect(loadServerSeconds('user-1', DAY)).toBe(600);

      saveServerSeconds('user-1', DAY, 900);
      expect(loadServerSeconds('user-1', DAY)).toBe(900);
    });

    it('starts again on a new day', () => {
      saveServerSeconds('user-1', DAY, 900);
      saveServerSeconds('user-1', '2026-10-28', 60);

      expect(loadServerSeconds('user-1', '2026-10-28')).toBe(60);
      expect(loadServerSeconds('user-1', DAY)).toBeNull();
    });

    it('does not keep a total that is not a number of seconds', () => {
      saveServerSeconds('user-1', DAY, Number.NaN);
      saveServerSeconds('user-1', DAY, -5);

      expect(memory.has(serverKey('user-1'))).toBe(false);
    });

    it('reads nothing from a broken or foreign entry', () => {
      const entries = [
        '{broken',
        'null',
        JSON.stringify({ userId: 'other', date: DAY, seconds: 5 }),
        JSON.stringify({ userId: 'user-1', date: DAY, seconds: -5 }),
        JSON.stringify({ userId: 'user-1', date: DAY, seconds: 'many' }),
        JSON.stringify({ userId: 'user-1', date: DAY, seconds: null }),
      ];
      for (const entry of entries) {
        memory.set(serverKey('user-1'), entry);
        expect(loadServerSeconds('user-1', DAY)).toBeNull();
      }
    });

    it('does not throw when localStorage fails', () => {
      vi.mocked(window.localStorage.getItem).mockImplementation(() => {
        throw new Error('SecurityError');
      });
      vi.mocked(window.localStorage.setItem).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(loadServerSeconds('user-1', DAY)).toBeNull();
      expect(() => saveServerSeconds('user-1', DAY, 60)).not.toThrow();
    });
  });
});

describe('without a usable localStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['no window', undefined],
    ['a browser that refuses localStorage', {
      get localStorage(): Storage {
        throw new Error('SecurityError');
      },
    }],
    ['a window without localStorage', { localStorage: null }],
  ])('keeps nothing and does not throw with %s', (_label, stub) => {
    vi.stubGlobal('window', stub);

    expect(loadPending('user-1')).toEqual([]);
    expect(() => savePending('user-1', [{ start: 1, end: 2 }])).not.toThrow();
    expect(loadServerSeconds('user-1', '2026-10-27')).toBeNull();
    expect(() => saveServerSeconds('user-1', '2026-10-27', 60)).not.toThrow();
  });
});

describe('IST days', () => {
  it('says which IST day a moment is in', () => {
    expect(istDate(Date.UTC(2026, 9, 27, 18, 29, 59))).toBe('2026-10-27');
    expect(istDate(Date.UTC(2026, 9, 27, 18, 30, 0))).toBe('2026-10-28');
  });

  it('says when the next IST day begins', () => {
    expect(nextDayStart(Date.UTC(2026, 9, 27, 6, 30, 0))).toBe(
      Date.UTC(2026, 9, 27, 18, 30, 0)
    );
    expect(nextDayStart(Date.UTC(2026, 9, 27, 18, 30, 0))).toBe(
      Date.UTC(2026, 9, 28, 18, 30, 0)
    );
  });
});

describe('readUserId', () => {
  it('reads the uuid of the signed-in user', () => {
    expect(readUserId(JSON.stringify({ uuid: 'u-1' }))).toBe('u-1');
  });

  it('falls back to the person uuid', () => {
    expect(readUserId(JSON.stringify({ person: { uuid: 'p-1' } }))).toBe('p-1');
  });

  it('prefers the user uuid', () => {
    expect(
      readUserId(JSON.stringify({ uuid: 'u-1', person: { uuid: 'p-1' } }))
    ).toBe('u-1');
  });

  it('gives nothing for no user, a broken value or an id that is not text', () => {
    expect(readUserId(null)).toBeNull();
    expect(readUserId('')).toBeNull();
    expect(readUserId('{broken')).toBeNull();
    expect(readUserId('null')).toBeNull();
    expect(readUserId(JSON.stringify({ uuid: 5 }))).toBeNull();
    expect(readUserId(JSON.stringify({ uuid: '' }))).toBeNull();
    expect(readUserId(JSON.stringify({}))).toBeNull();
  });
});

describe('savePending tells this tab', () => {
  it('fires an event after it writes, and after it removes', () => {
    const heard = vi.fn();
    window.addEventListener(ACTIVITY_PENDING_EVENT, heard);

    savePending('user-1', [{ start: 1, end: 2 }]);
    savePending('user-1', []);

    window.removeEventListener(ACTIVITY_PENDING_EVENT, heard);
    expect(heard).toHaveBeenCalledTimes(2);
  });
});

describe('dayWindow', () => {
  // an IST day starts at 18:30 UTC the evening before
  it('is the IST day for one date', () => {
    expect(dayWindow('2026-10-27', '2026-10-27')).toEqual({
      start: Date.UTC(2026, 9, 26, 18, 30),
      end: Date.UTC(2026, 9, 27, 18, 30),
    });
  });

  it('covers every day from the first to the last, both included', () => {
    const window = dayWindow('2026-10-25', '2026-10-27');
    expect(window).toEqual({
      start: Date.UTC(2026, 9, 24, 18, 30),
      end: Date.UTC(2026, 9, 27, 18, 30),
    });
  });

  it('has no window for missing, broken or backwards dates', () => {
    expect(dayWindow(null, '2026-10-27')).toBeNull();
    expect(dayWindow('2026-10-27', undefined)).toBeNull();
    expect(dayWindow('27 Oct 2026', '2026-10-27')).toBeNull();
    expect(dayWindow('2026-10-28', '2026-10-27')).toBeNull();
  });
});

describe('secondsWithin', () => {
  const window = { start: 1_000_000, end: 2_000_000 };

  it('adds whole seconds of the stretches inside the window', () => {
    expect(
      secondsWithin(
        [
          { start: 1_100_000, end: 1_160_000 },
          { start: 1_500_000, end: 1_530_500 },
        ],
        window
      )
    ).toBe(90); // 60 s + 30.5 s = 90.5 s, whole seconds
  });

  it('cuts a stretch at the edges of the window', () => {
    expect(
      secondsWithin(
        [
          { start: 900_000, end: 1_060_000 },
          { start: 1_940_000, end: 2_100_000 },
        ],
        window
      )
    ).toBe(120);
  });

  it('leaves out a stretch outside the window', () => {
    expect(secondsWithin([{ start: 100, end: 200_000 }], window)).toBe(0);
    expect(secondsWithin([{ start: 2_000_000, end: 3_000_000 }], window)).toBe(0);
  });

  it('adds everything when there is no window', () => {
    expect(secondsWithin([{ start: 0, end: 5_000 }, { start: 10_000, end: 12_000 }], null)).toBe(7);
  });

  it('is 0 for nothing', () => {
    expect(secondsWithin([], window)).toBe(0);
    expect(secondsWithin([], null)).toBe(0);
  });
});