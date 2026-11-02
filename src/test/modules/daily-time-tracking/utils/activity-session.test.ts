import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createActivitySession } from '../../../../modules/daily-time-tracking/utils/activity-session';
import type { Segment } from '../../../../modules/daily-time-tracking/utils/activity-buffer';
import {
  ACTIVITY_THROTTLE_MS,
  ADOPT_MAX_AGE_MS,
  IDLE_LIMIT_MS,
} from '../../../../modules/daily-time-tracking/constants/activity-config';

const START = Date.UTC(2026, 9, 27, 6, 30, 0);
const MINUTE = 60_000;

let wall = START;
let mono = 5_000;
let counted: Segment[] = [];
let setBack: number[] = [];

// the wall clock and the monotonic clock move together
const tick = (ms: number) => {
  wall += ms;
  mono += ms;
};

const open = () =>
  createActivitySession({
    onCounted: stretch => counted.push(stretch),
    onClockSetBack: by => setBack.push(by),
    wall: () => wall,
    mono: () => mono,
  });

describe('createActivitySession', () => {
  beforeEach(() => {
    wall = START;
    mono = 5_000;
    counted = [];
    setBack = [];
  });

  describe('what counts', () => {
    it('counts the time since the page opened, because opening is a move', () => {
      const session = open();

      tick(MINUTE);
      session.collect(true);

      expect(counted).toEqual([{ start: START, end: START + MINUTE }]);
    });

    it('stops counting thirty minutes after the last move', () => {
      const session = open();

      tick(2 * IDLE_LIMIT_MS);
      session.collect(true);

      expect(counted).toEqual([{ start: START, end: START + IDLE_LIMIT_MS }]);

      tick(MINUTE);
      session.collect(true);

      expect(counted).toHaveLength(1);
    });

    it('counts nothing when it is not counting, but still keeps up with the clock', () => {
      const session = open();

      tick(MINUTE);
      session.collect(false);

      expect(counted).toEqual([]);
      expect(session.checkpoint()).toBe(START + MINUTE);
      expect(session.now()).toBe(START + MINUTE);
    });

    it('ignores a move that comes less than a second after the last one', () => {
      const session = open();

      tick(ACTIVITY_THROTTLE_MS - 1);

      expect(session.move(true)).toBeNull();
      expect(counted).toEqual([]);
    });

    it('counts up to a move and says when it was', () => {
      const session = open();

      tick(2_000);
      const at = session.move(true);

      expect(at).toBe(START + 2_000);
      expect(counted).toEqual([{ start: START, end: START + 2_000 }]);
    });

    it('starts the thirty minutes again at a move', () => {
      const session = open();
      tick(4 * MINUTE);
      session.move(true);

      tick(2 * IDLE_LIMIT_MS);
      session.collect(true);

      expect(counted.at(-1)).toEqual({
        start: START + 4 * MINUTE,
        end: START + 4 * MINUTE + IDLE_LIMIT_MS,
      });
    });

    it('remembers a move made while it was not counting', () => {
      const session = open();
      tick(10 * MINUTE);
      session.move(false);

      tick(2 * IDLE_LIMIT_MS);
      session.collect(true);

      expect(counted).toEqual([
        {
          start: START + 10 * MINUTE,
          end: START + 10 * MINUTE + IDLE_LIMIT_MS,
        },
      ]);
    });
  });

  describe('a move in another tab', () => {
    it('does not count the away time before it, only up to the move before it', () => {
      const session = open();

      tick(2 * IDLE_LIMIT_MS);
      session.remoteMove(true, wall, START + MINUTE);

      expect(counted).toEqual([
        { start: START, end: START + MINUTE + IDLE_LIMIT_MS },
      ]);
    });

    it('closes the stretch at the moment of the earlier move when it is not known', () => {
      const session = open();

      tick(MINUTE);
      session.remoteMove(true, wall, null);

      expect(counted).toEqual([{ start: START, end: START + MINUTE }]);
    });

    it('keeps the thirty minutes going from the move, without counting when it is not counting', () => {
      const session = open();
      tick(10 * MINUTE);
      session.collect(false);
      session.remoteMove(false, wall, null);

      expect(counted).toEqual([]);

      tick(2 * IDLE_LIMIT_MS);
      session.collect(true);

      expect(counted).toEqual([
        {
          start: START + 10 * MINUTE,
          end: START + 10 * MINUTE + IDLE_LIMIT_MS,
        },
      ]);
    });
  });

  describe('taking over from another tab', () => {
    it('counts the time since the previous leader counted, as far as moves allow', () => {
      const session = open();
      tick(100_000);

      session.startCounting(START + 90_000, START + 50_000);

      expect(counted).toEqual([{ start: START + 50_000, end: wall }]);
      expect(session.checkpoint()).toBe(wall);
    });

    it('does not count past thirty minutes after the last move', () => {
      const session = open();
      tick(100_000);

      session.startCounting(START - IDLE_LIMIT_MS + 70_000, START + 50_000);

      expect(counted).toEqual([
        { start: START + 50_000, end: START - IDLE_LIMIT_MS + 70_000 + IDLE_LIMIT_MS },
      ]);
    });

    it('counts nothing when moves ended before the previous leader stopped', () => {
      const session = open();
      tick(60_000);

      session.startCounting(START - IDLE_LIMIT_MS - 100_000, START + 10_000);

      expect(counted).toEqual([]);
    });

    it('counts nothing when there is no earlier leader', () => {
      const session = open();
      tick(60_000);

      session.startCounting(START + 30_000, null);

      expect(counted).toEqual([]);
    });

    it('counts nothing for a handover that claims to be in the future', () => {
      const session = open();
      tick(60_000);

      session.startCounting(wall, wall + 1_000);

      expect(counted).toEqual([]);
    });

    it('starts from now when the previous leader stopped long ago', () => {
      const session = open();
      tick(ADOPT_MAX_AGE_MS + 1_000);

      session.startCounting(wall - 1_000, wall - ADOPT_MAX_AGE_MS - 1);

      expect(counted).toEqual([]);
    });

    it('takes the latest move of any tab into account, and works without one', () => {
      const session = open();
      tick(10 * MINUTE);
      session.startCounting(wall - 60_000, null);

      tick(2 * IDLE_LIMIT_MS);
      session.collect(true);

      expect(counted).toEqual([
        { start: wall - 2 * IDLE_LIMIT_MS, end: wall - 2 * IDLE_LIMIT_MS - 60_000 + IDLE_LIMIT_MS },
      ]);

      const alone = open();
      tick(MINUTE);
      alone.startCounting(null, null);
      tick(MINUTE);
      alone.collect(true);

      expect(counted).toHaveLength(2);
    });
  });

  describe('a clock that is set back', () => {
    it('counts the time that really passed and says by how much the clock moved', () => {
      const session = open();

      wall -= MINUTE;
      mono += 1_000;
      session.collect(true);

      expect(setBack).toEqual([-61_000]);
      expect(counted).toEqual([{ start: START - 61_000, end: START - MINUTE }]);
    });

    it('moves the last move with the clock, so the thirty minutes stay thirty minutes', () => {
      const session = open();
      tick(2_000);
      session.move(true);
      counted = [];

      wall -= 10 * MINUTE;
      mono += 1_000;
      session.collect(true);

      tick(2 * IDLE_LIMIT_MS);
      session.collect(true);

      expect(setBack).toEqual([-(10 * MINUTE) - 1_000]);
      // the move was 2 s after the start; with the clock 601 s back it is 599 s before it
      expect(counted.at(-1)?.end).toBe(START - 599_000 + IDLE_LIMIT_MS);
    });

    it('lets a small step back pass', () => {
      const session = open();

      wall -= 3_000;
      session.collect(true);

      expect(setBack).toEqual([]);
    });
  });

  describe('with the real clocks', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(START);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('works from the computer clock when none is given', () => {
      const stretches: Segment[] = [];
      const session = createActivitySession({
        onCounted: stretch => stretches.push(stretch),
        onClockSetBack: () => undefined,
      });

      vi.advanceTimersByTime(MINUTE);
      session.collect(true);

      expect(session.now()).toBe(START + MINUTE);
      expect(stretches).toEqual([{ start: START, end: START + MINUTE }]);
    });
  });
});
