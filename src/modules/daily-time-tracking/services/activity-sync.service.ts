import type { HeartbeatResult } from '../types/achievement-summary.types';
import {
  loadPending,
  mergeSegments,
  nextDayStart,
  saveServerSeconds,
  savePending,
  type Segment,
} from '../utils/activity-buffer';
import {
  ACTIVITY_SENT_EVENT,
  HEARTBEAT_MAX_SECONDS,
  MAX_ENDED_SECONDS_AGO,
} from '../constants/activity-config';
import { reportActivityIssue } from '../utils/activity-diagnostics';
import { achievementSummaryService } from './achievement-summary.service';

/**
 * Synchronization: keeps the working time that has been counted until the
 * portal has accepted it, and sends it.
 *
 * Time moves through three places:
 *   waiting  - counted, not sent yet;
 *   outbox   - sent (or being sent), and not yet acknowledged;
 *   gone     - the portal answered that it accepted it.
 * Only an answer from the portal takes time out of the outbox. A request that
 * fails, or whose answer never arrives (the page closed), leaves it there, and
 * it is sent again at the next event. That is safe because the portal counts
 * the same period of time once, however often it is reported (see the heartbeat
 * API: a period is a claim, and only the part not yet counted is added).
 * Everything that is waiting or in the outbox is also kept in localStorage, under
 * the user's id, so it survives a reload or a closed browser.
 *
 * One request at a time, oldest first. The portal adds only the part of a period
 * that is newer than what it has already counted, so a newer period that arrives
 * before an older one would make the older one worth nothing. Requests are
 * therefore never in flight together: while one is on its way (also one sent as
 * the page was hidden or closed), what else is waiting stays in the browser and
 * goes out after the answer, or at the next page load. A page that is closed or
 * hidden sends only the oldest piece for the same reason.
 *
 * A period is never longer than the portal accepts, never reaches across
 * midnight (it is cut one second before, so it is saved under the right day),
 * and is dropped, with a note, when it is older than the portal accepts.
 */
export interface ActivitySyncOptions {
  /** The signed-in user the time belongs to. With none, nothing is kept in the browser. */
  userId: string | null;
  /** True while this tab is the one that counts: only it writes the browser's copy. */
  isLeader: () => boolean;
}

export interface ActivitySync {
  /** Add counted working time to what is waiting. */
  add: (stretch: Segment) => void;
  /** The wall clock was set back: move everything that was counted with it. */
  shift: (byMs: number) => void;
  /** Take time an earlier session left in the browser. True if there was some. */
  adoptStored: () => boolean;
  /** Whole seconds that are waiting to be sent, counting time that was tried and failed. */
  waitingSeconds: () => number;
  /** When a send last started, in milliseconds on the wall clock, or 0. */
  lastSendAt: () => number;
  /** Send what is waiting and wait for the answers. One at a time. */
  flush: () => Promise<void>;
  /** For a page that is going away or hidden: send without waiting for the answers. */
  sendOnExit: () => void;
  /** Write what is not acknowledged to the browser (if this tab leads). */
  persist: () => void;
  /** No more sending: the page is gone. */
  stop: () => void;
}

// A failed request is sent again at the next event, unless the server has said
// the request itself is wrong. A 401 is not that: the session can be renewed or
// the person can sign in again, and the time is kept under their id until then.
// It is not a loop: one failure ends the run (see flush).
const isRetryable = (error: unknown): boolean => {
  const status = (error as { response?: { status?: number } } | null)?.response
    ?.status;
  return (
    status === undefined ||
    status >= 500 ||
    status === 401 ||
    status === 408 ||
    status === 429
  );
};

const statusOf = (error: unknown): number | null =>
  (error as { response?: { status?: number } } | null)?.response?.status ??
  null;

const isAnswer = (value: unknown): value is HeartbeatResult =>
  !!value &&
  typeof (value as HeartbeatResult).activityDate === 'string' &&
  typeof (value as HeartbeatResult).todaySeconds === 'number';

const same = (a: Segment, b: Segment) => a.start === b.start && a.end === b.end;

export const createActivitySync = ({
  userId,
  isLeader,
}: ActivitySyncOptions): ActivitySync => {
  let waiting: Segment[] = [];
  let outbox: Segment[] = [];
  // The pieces of the outbox whose request has not been answered yet: they are on
  // their way, so they are not sent a second time.
  let onTheirWay: Segment[] = [];
  let sentAt = 0;
  let inflight: Promise<void> | null = null;
  let stopped = false;

  const isOffline = () =>
    typeof navigator !== 'undefined' && navigator.onLine === false;

  const persist = () => {
    if (userId && isLeader())
      savePending(userId, mergeSegments([...outbox, ...waiting]));
  };

  const notOnTheirWay = () =>
    outbox.filter(p => !onTheirWay.some(w => same(w, p)));

  // Time that was tried, was not acknowledged and is not on its way any more
  // (the request failed) goes back to be sent again.
  const retryUnacknowledged = () => {
    const failed = notOnTheirWay();
    if (failed.length === 0) return;
    waiting = mergeSegments([...failed, ...waiting]);
    outbox = outbox.filter(p => onTheirWay.some(w => same(w, p)));
  };

  const answered = (piece: Segment) => {
    onTheirWay = onTheirWay.filter(w => !same(w, piece));
  };

  // The portal accepted (or refused for good) this piece: it is no longer waiting.
  const settle = (piece: Segment) => {
    outbox = outbox.filter(p => !same(p, piece));
  };

  // Remember what the portal has now and tell the dashboard, after the browser's
  // copy of the waiting time is updated.
  const announce = (answer: HeartbeatResult) => {
    persist();
    if (userId)
      saveServerSeconds(userId, answer.activityDate, answer.todaySeconds);
    window.dispatchEvent(
      new CustomEvent(ACTIVITY_SENT_EVENT, {
        detail: {
          activityDate: answer.activityDate,
          todaySeconds: answer.todaySeconds,
        },
      })
    );
  };

  // Takes the oldest whole seconds out of what is waiting, up to one heartbeat's
  // worth and not across midnight, and says how long ago they ended. The piece
  // goes to the outbox until the portal answers. Null when nothing is left.
  // The request id is the start and end of the piece, so the same piece sent
  // again carries the same id and the portal can tell it is a repeat.
  const takeNext = (): {
    seconds: number;
    endedSecondsAgo: number;
    requestId: string;
    piece: Segment;
  } | null => {
    for (;;) {
      const first = waiting[0];
      if (!first) return null;
      // A period ends one second before midnight, so the portal, which saves it
      // under the day it ended in, saves it under the day it was worked in.
      const beforeMidnight = nextDayStart(first.start) - 1000;
      const limit =
        first.start < beforeMidnight && first.end > beforeMidnight
          ? beforeMidnight
          : first.end;
      const whole = Math.floor((limit - first.start) / 1000);
      if (whole < 1) {
        // Less than a second: it stays only if it is the newest stretch, where
        // the next count continues it.
        if (waiting.length === 1 && limit === first.end) return null;
        if (limit === first.end) waiting.shift();
        else first.start = limit + 1000; // the last second before midnight goes with the next day
        continue;
      }
      const seconds = Math.min(whole, HEARTBEAT_MAX_SECONDS);
      const pieceStart = first.start;
      const pieceEnd = pieceStart + seconds * 1000;
      first.start = pieceEnd;
      if (first.end - first.start <= 0) waiting.shift();
      const endedSecondsAgo = Math.max(
        0,
        Math.round((Date.now() - pieceEnd) / 1000)
      );
      if (endedSecondsAgo > MAX_ENDED_SECONDS_AGO) {
        reportActivityIssue('dropped_too_old', { seconds, endedSecondsAgo });
        continue;
      }
      const piece = { start: pieceStart, end: pieceEnd };
      outbox.push(piece);
      return {
        seconds,
        endedSecondsAgo,
        requestId: `${pieceStart}-${pieceEnd}`,
        piece,
      };
    }
  };

  const flush = (): Promise<void> => {
    if (inflight) return inflight;
    if (isOffline()) return Promise.resolve();
    // A request sent as the page was hidden or closed has not been answered yet.
    if (onTheirWay.length > 0) return Promise.resolve();
    retryUnacknowledged();
    sentAt = Date.now();
    const run = (async () => {
      while (!stopped) {
        const next = takeNext();
        if (!next) break;
        onTheirWay.push(next.piece);
        try {
          const answer = await achievementSummaryService.sendHeartbeat(
            next.seconds,
            next.endedSecondsAgo,
            next.requestId
          );
          answered(next.piece);
          settle(next.piece);
          if (isAnswer(answer)) announce(answer);
          else persist();
        } catch (error) {
          answered(next.piece);
          const retry = isRetryable(error);
          reportActivityIssue(retry ? 'send_failed' : 'send_rejected', {
            status: statusOf(error),
            seconds: next.seconds,
            retry,
          });
          if (!retry) {
            settle(next.piece); // the portal called the request wrong
            persist();
          }
          break; // try again at the next event, not in a loop
        }
      }
    })();
    inflight = run;
    // After the assignment, even for a run that had nothing to send.
    void run.finally(() => {
      if (inflight === run) inflight = null;
      persist();
    });
    return run;
  };

  const sendOnExit = () => {
    if (isOffline()) {
      persist();
      return;
    }
    // Never two requests at once: the oldest piece goes, the rest stays in the browser.
    if (onTheirWay.length > 0 || inflight) {
      persist();
      return;
    }
    retryUnacknowledged();
    const next = takeNext();
    persist();
    if (!next) return;
    sentAt = Date.now();
    onTheirWay.push(next.piece);
    void Promise.resolve(
      achievementSummaryService.sendHeartbeatOnExit(
        next.seconds,
        next.endedSecondsAgo,
        next.requestId
      )
    )
      // It answers null when it fails. A rejection counts the same, so the piece
      // is never left on its way, which would block every later send.
      .catch(() => null)
      .then(answer => {
        answered(next.piece);
        if (!isAnswer(answer)) return; // not acknowledged: it stays, to be sent again
        settle(next.piece);
        announce(answer);
      });
  };

  return {
    add: stretch => {
      const last = waiting[waiting.length - 1];
      if (last && last.end >= stretch.start)
        last.end = Math.max(last.end, stretch.end);
      else waiting.push({ start: stretch.start, end: stretch.end });
    },

    shift: byMs => {
      const move = (list: Segment[]) =>
        list.map(s => ({ start: s.start + byMs, end: s.end + byMs }));
      // The outbox and the pieces on their way are shifted together, so a piece
      // can still be matched with its answer.
      waiting = move(waiting);
      outbox = move(outbox);
      onTheirWay = move(onTheirWay);
    },

    adoptStored: () => {
      if (!userId) return false;
      const stored = loadPending(userId);
      if (stored.length === 0) return false;
      waiting = mergeSegments([...stored, ...waiting]);
      return true;
    },

    waitingSeconds: () =>
      [...notOnTheirWay(), ...waiting].reduce(
        (total, s) => total + Math.floor((s.end - s.start) / 1000),
        0
      ),

    lastSendAt: () => sentAt,
    flush,
    sendOnExit,
    persist,
    stop: () => {
      stopped = true;
    },
  };
};
