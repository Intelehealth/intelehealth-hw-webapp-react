/**
 * What the browser keeps about the working time of one health worker, in
 * localStorage, so a closed browser, a crash, a reload or a logout does not lose
 * it. Everything is kept under the signed-in user's id, because several people
 * can share one browser, and each record also says whose it is, so it is never
 * mixed up with another user's, and which IST day it was written for.
 *
 * - The pending record: the stretches of time that were counted and have not
 *   been acknowledged by the server yet, with their real start and end (epoch
 *   milliseconds, timestamps and not a counter). Sending a stretch twice is
 *   harmless: the server counts the same time once.
 * - The server record: the last total the server gave for one day. It shows
 *   the day's time at once after a reload, before the summary has come back,
 *   and only ever grows within a day. A new day starts with no record.
 */
/** A stretch of time (epoch milliseconds) that was spent working and is not sent yet. */
export interface Segment {
  start: number;
  end: number;
}

import {
  ACTIVITY_PENDING_EVENT,
  ACTIVITY_TZ_OFFSET_MS,
  DAY_MS,
  PENDING_KEY_PREFIX,
  SERVER_KEY_PREFIX,
} from '../constants/activity-config';

export interface ActivitySentDetail {
  activityDate: string;
  todaySeconds: number;
}

export const pendingKey = (userId: string): string =>
  `${PENDING_KEY_PREFIX}${userId}`;

export const serverKey = (userId: string): string =>
  `${SERVER_KEY_PREFIX}${userId}`;

/** The IST day of a moment (epoch milliseconds), as YYYY-MM-DD. */
export const istDate = (ms: number): string =>
  new Date(ms + ACTIVITY_TZ_OFFSET_MS).toISOString().slice(0, 10);

/** The moment (epoch milliseconds) the IST day after the one ms is in begins. */
export const nextDayStart = (ms: number): number =>
  (Math.floor((ms + ACTIVITY_TZ_OFFSET_MS) / DAY_MS) + 1) * DAY_MS -
  ACTIVITY_TZ_OFFSET_MS;

const storageOrNull = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

/** Stretches that are valid, in order, with touching or overlapping ones joined. */
export const mergeSegments = (segments: Segment[]): Segment[] => {
  const sorted = segments
    .filter(
      s => Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start
    )
    .map(s => ({ start: s.start, end: s.end }))
    .sort((a, b) => a.start - b.start);
  const merged: Segment[] = [];
  for (const segment of sorted) {
    const last = merged[merged.length - 1];
    if (last && segment.start <= last.end)
      last.end = Math.max(last.end, segment.end);
    else merged.push(segment);
  }
  return merged;
};

const isSegment = (s: unknown): s is Segment =>
  !!s &&
  typeof (s as Segment).start === 'number' &&
  typeof (s as Segment).end === 'number';

/**
 * What is waiting for this health worker. Anything unreadable is left out, and a
 * record that says it belongs to somebody else is not used. A record written
 * before records said whose they are (a plain list) is still read.
 */
export const loadPending = (userId: string): Segment[] => {
  const storage = storageOrNull();
  if (!storage) return [];
  try {
    const raw = storage.getItem(pendingKey(userId));
    if (!raw) return [];
    const value = JSON.parse(raw) as unknown;
    let list: unknown = value;
    if (value && !Array.isArray(value) && typeof value === 'object') {
      const record = value as { userId?: unknown; segments?: unknown };
      if (record.userId !== undefined && record.userId !== userId) return [];
      list = record.segments;
    }
    return Array.isArray(list) ? mergeSegments(list.filter(isSegment)) : [];
  } catch {
    return [];
  }
};

/** Replace what is waiting for this health worker. Nothing waiting removes the entry. */
export const savePending = (userId: string, segments: Segment[]): void => {
  const storage = storageOrNull();
  if (!storage) return;
  try {
    const key = pendingKey(userId);
    const current = storage.getItem(key);
    if (segments.length === 0) {
      if (current === null || current === undefined) return; // nothing to remove
      storage.removeItem(key);
    } else {
      const next = JSON.stringify({
        userId,
        date: istDate(Date.now()),
        segments,
      });
      if (current === next) return; // already written: no write, nothing to tell
      storage.setItem(key, next);
    }
  } catch {
    // Full or blocked: the time is still sent from memory.
  }
  // The storage event only reaches other tabs, so this tab is told here.
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(ACTIVITY_PENDING_EVENT));
};

/**
 * The last total the server gave for this health worker for that IST day, or
 * null when there is none, it is for another day, or it is somebody else's.
 */
export const loadServerSeconds = (
  userId: string,
  date: string
): number | null => {
  const storage = storageOrNull();
  if (!storage) return null;
  try {
    const raw = storage.getItem(serverKey(userId));
    if (!raw) return null;
    const record = JSON.parse(raw) as {
      userId?: unknown;
      date?: unknown;
      seconds?: unknown;
    } | null;
    if (
      !record ||
      record.userId !== userId ||
      record.date !== date ||
      typeof record.seconds !== 'number' ||
      !Number.isFinite(record.seconds) ||
      record.seconds < 0
    )
      return null;
    return record.seconds;
  } catch {
    return null;
  }
};

/**
 * Remember the server's total for a day. Within a day it only grows, so a
 * smaller number (a late, stale answer) does not replace a bigger one. A record
 * of an earlier day is replaced.
 */
export const saveServerSeconds = (
  userId: string,
  date: string,
  seconds: number
): void => {
  const storage = storageOrNull();
  if (!storage || !Number.isFinite(seconds) || seconds < 0) return;
  try {
    const known = loadServerSeconds(userId, date);
    if (known !== null && known >= seconds) return;
    storage.setItem(
      serverKey(userId),
      JSON.stringify({ userId, date, seconds })
    );
  } catch {
    // Full or blocked: the summary is asked for again at the next load.
  }
};
/**
 * The start and end (epoch milliseconds) of the IST days from fromIso to toIso,
 * both included, each as YYYY-MM-DD. Null when either is missing or not a date: no limit.
 */
export const dayWindow = (
  fromIso: string | null | undefined,
  toIso: string | null | undefined
): { start: number; end: number } | null => {
  const parse = (iso: string | null | undefined): number | null => {
    const match = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
    if (!match) return null;
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  };
  const from = parse(fromIso);
  const to = parse(toIso);
  if (from === null || to === null || to < from) return null;
  return {
    start: from - ACTIVITY_TZ_OFFSET_MS,
    end: to + DAY_MS - ACTIVITY_TZ_OFFSET_MS,
  };
};

/** Whole seconds of the stretches that fall inside the window, or all of them with no window. */
export const secondsWithin = (
  segments: Segment[],
  window: { start: number; end: number } | null
): number => {
  let milliseconds = 0;
  for (const segment of segments) {
    const start = window
      ? Math.max(segment.start, window.start)
      : segment.start;
    const end = window ? Math.min(segment.end, window.end) : segment.end;
    if (end > start) milliseconds += end - start;
  }
  return Math.floor(milliseconds / 1000);
};

/** The id the buffer is kept under: the signed-in user's uuid, if there is one. */
export const readUserId = (rawUser: string | null): string | null => {
  if (!rawUser) return null;
  try {
    const user = JSON.parse(rawUser) as {
      uuid?: unknown;
      person?: { uuid?: unknown };
    } | null;
    const id = user?.uuid ?? user?.person?.uuid;
    return typeof id === 'string' && id.length > 0 ? id : null;
  } catch {
    return null;
  }
};
