import type { Segment } from './activity-buffer';
import {
  ACTIVITY_THROTTLE_MS,
  ADOPT_MAX_AGE_MS,
  CLOCK_SET_BACK_TOLERANCE_MS,
  IDLE_LIMIT_MS,
} from '../constants/activity-config';

/**
 * Session tracking: works out how much of the time since the page opened was
 * working time, and says so as stretches with a real start and end. It knows
 * nothing about storage, tabs or the server.
 *
 * - Time is worked out from timestamps taken when it is looked at, not from a
 *   counter that adds up once a second, so a timer that is slowed down in a
 *   hidden tab (or does not run at all) loses nothing.
 * - Time counts up to IDLE_LIMIT_MS after the last move (mouse, keyboard, scroll,
 *   touch) in this tab or another, and not at all after that. An open or visible
 *   page alone does not count as working.
 * - Only the tab that is counting adds time; the others only keep up with the clock.
 * - Clock changes: a stretch is never negative, and counting never runs past the
 *   last move. If the computer's clock is set back, the elapsed time is taken
 *   from the monotonic clock (performance.now, which a clock change does not
 *   move), and everything already counted is moved with the clock so ages stay
 *   right. A clock set forward, or a computer that slept, adds nothing, because
 *   counting is capped by the last move.
 */
export interface ActivitySessionOptions {
  /** Working time that was counted: a stretch to add to what is waiting to be sent. */
  onCounted: (stretch: Segment) => void;
  /** The wall clock was set back by this many milliseconds (a negative number). */
  onClockSetBack: (byMs: number) => void;
  /** The wall clock and the monotonic clock, in milliseconds. Replaceable for tests. */
  wall?: () => number;
  mono?: () => number;
}

export interface ActivitySession {
  /** The current time on the wall clock. */
  now: () => number;
  /** Everything before this moment has been looked at. */
  checkpoint: () => number;
  /** Count the working time since the last look, if `counting`, and move up to now. */
  collect: (counting: boolean) => void;
  /**
   * A move in this tab. Returns the moment of the move, or null when it came
   * too soon after the last one to matter.
   */
  move: (counting: boolean) => number | null;
  /**
   * A move in another tab, as it was written for this one: its moment and the
   * moment of the move before it.
   */
  remoteMove: (
    counting: boolean,
    incoming: number,
    previous: number | null
  ) => void;
  /**
   * This tab has started to count. It takes the latest move of any tab into
   * account and, when it takes over from a leader that had counted up to
   * `adoptUpTo` moments ago, counts the time in between as far as moves allow.
   */
  startCounting: (sharedMove: number | null, adoptUpTo: number | null) => void;
}

export const createActivitySession = ({
  onCounted,
  onClockSetBack,
  wall = Date.now,
  mono = () => performance.now(),
}: ActivitySessionOptions): ActivitySession => {
  let checkpoint = wall();
  let checkpointMono = mono();
  let lastActivity = checkpoint; // opening the page counts as a move
  let lastMove = 0; // the latest real move, in this tab or another

  const collect = (counting: boolean) => {
    const now = wall();
    const monoNow = mono();

    // The wall clock moved less than the monotonic clock did: it was set back.
    const slip = now - checkpoint - (monoNow - checkpointMono);
    if (slip < -CLOCK_SET_BACK_TOLERANCE_MS) {
      lastActivity += slip;
      if (lastMove > 0) lastMove += slip;
      checkpoint += slip;
      onClockSetBack(slip);
    }

    if (counting) {
      const countedUntil = Math.min(now, lastActivity + IDLE_LIMIT_MS);
      if (countedUntil > checkpoint)
        onCounted({ start: checkpoint, end: countedUntil });
    }
    checkpoint = now;
    checkpointMono = monoNow;
  };

  return {
    now: () => wall(),
    checkpoint: () => checkpoint,
    collect,

    move: counting => {
      const now = wall();
      if (now - lastActivity < ACTIVITY_THROTTLE_MS) return null;
      collect(counting);
      lastActivity = now;
      lastMove = now;
      return now;
    },

    remoteMove: (counting, incoming, previous) => {
      if (counting) {
        // First close the stretch that ran up to the earlier move, so the away
        // time before this move is not counted.
        lastActivity = Math.max(lastActivity, previous ?? 0);
        collect(true);
      }
      lastActivity = Math.max(lastActivity, incoming);
      lastMove = Math.max(lastMove, incoming);
    },

    startCounting: (sharedMove, adoptUpTo) => {
      lastMove = Math.max(lastMove, sharedMove ?? 0);
      lastActivity = Math.max(lastActivity, lastMove);
      const now = wall();
      if (
        adoptUpTo !== null &&
        adoptUpTo <= now &&
        now - adoptUpTo <= ADOPT_MAX_AGE_MS
      ) {
        const end = Math.min(now, lastMove + IDLE_LIMIT_MS);
        if (end > adoptUpTo) onCounted({ start: adoptUpTo, end });
      }
      checkpoint = now;
      checkpointMono = mono();
    },
  };
};
