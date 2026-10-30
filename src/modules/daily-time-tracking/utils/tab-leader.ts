/**
 * Lets the tabs and windows of one browser agree on which of them counts the
 * time spent in the app, so the same minutes are not reported by every tab.
 *
 * Two things are kept in localStorage, which all tabs of the same site share:
 *
 * - A lease: the id of the tab that counts (the leader), when it last renewed
 *   the lease, and `upTo`, the moment up to which it has counted. A tab that
 *   finds no lease, a lease that ran out, or one a leaving tab let go of,
 *   takes it. The leader renews it every few seconds.
 * - The time of the latest move (mouse, keyboard, scroll, touch) in any tab, so
 *   work in one tab keeps the leader counting even when the leader is hidden.
 *
 * It is a convenience, not a lock. Two tabs can both think they lead for a few
 * seconds, and the server counts overlapping time once, so nothing is counted
 * twice. When localStorage cannot be used (private mode, blocked, or it keeps
 * nothing), every tab leads on its own, as if there were no coordination.
 */

import {
  ACTIVITY_KEY,
  LEASE_KEY,
  LEASE_TTL_MS,
  SHARED_ACTIVITY_WRITE_GAP_MS,
} from '../constants/activity-config';

interface Lease {
  id: string;
  /** When the leader last renewed it. 0 once the leader has let go. */
  ts: number;
  /** Everything before this moment has been counted by the leader. */
  upTo: number;
}

export interface Election {
  leader: boolean;
  /** Where the previous leader had counted up to, when this tab just took over from it. */
  adoptUpTo: number | null;
}

export interface TabLeader {
  id: string;
  /** Take the lease if it is free or already ours, and say whether this tab leads. */
  elect: (now: number, upTo: number) => Election;
  /** Let the lease go, if it is ours, so another tab can take it at once. */
  release: (upTo: number) => void;
  /** Record that the person did something in this tab. */
  noteActivity: (now: number) => void;
  /** The latest move in any tab, or null if there is none. */
  lastSharedActivity: () => number | null;
}

const newId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      return crypto.randomUUID();
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const defaultStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

const parseLease = (raw: string | null): Lease | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Lease> | null;
    if (
      value &&
      typeof value.id === 'string' &&
      typeof value.ts === 'number' &&
      typeof value.upTo === 'number'
    )
      return { id: value.id, ts: value.ts, upTo: value.upTo };
  } catch {
    // a broken value is the same as no lease
  }
  return null;
};

export const createTabLeader = (
  options: { storage?: Storage | null; id?: string } = {}
): TabLeader => {
  const storage = 'storage' in options ? options.storage : defaultStorage();
  const id = options.id ?? newId();
  let lastWrittenAt = -Infinity;

  const readLease = (): Lease | null => {
    if (!storage) return null;
    try {
      return parseLease(storage.getItem(LEASE_KEY));
    } catch {
      return null;
    }
  };

  // false when storage cannot be written to
  const writeLease = (lease: Lease): boolean => {
    if (!storage) return false;
    try {
      storage.setItem(LEASE_KEY, JSON.stringify(lease));
      return true;
    } catch {
      return false;
    }
  };

  return {
    id,

    elect(now, upTo) {
      const lease = readLease();
      const mine = lease?.id === id;
      // A lease that was last renewed in the future was written with a clock that has since been
      // corrected: nobody is renewing it, so it is as good as run out.
      const free =
        !lease ||
        lease.ts === 0 ||
        lease.ts > now ||
        now - lease.ts > LEASE_TTL_MS;
      if (!mine && !free) return { leader: false, adoptUpTo: null };

      const adoptUpTo = !mine && lease ? lease.upTo : null;
      const written = writeLease({
        id,
        ts: now,
        upTo: adoptUpTo !== null ? adoptUpTo : upTo,
      });
      // No usable storage: nobody can be told apart, so every tab leads alone.
      if (!written) return { leader: true, adoptUpTo: null };

      // Another tab may have written at the same moment: the last write stands.
      // A storage that takes the write but gives nothing back cannot be shared
      // between tabs either, so then this tab leads on its own.
      const check = readLease();
      if (check && check.id !== id) return { leader: false, adoptUpTo: null };
      return { leader: true, adoptUpTo: check ? adoptUpTo : null };
    },

    release(upTo) {
      const lease = readLease();
      if (lease?.id === id) writeLease({ id, ts: 0, upTo });
    },

    noteActivity(now) {
      if (!storage) return;
      // Other tabs only need to know within a few seconds, so a busy mouse is not written each time.
      if (now - lastWrittenAt < SHARED_ACTIVITY_WRITE_GAP_MS) return;
      try {
        lastWrittenAt = now;
        storage.setItem(ACTIVITY_KEY, String(now));
      } catch {
        // not shared, this tab still counts its own moves
      }
    },

    lastSharedActivity() {
      if (!storage) return null;
      try {
        const value = Number(storage.getItem(ACTIVITY_KEY));
        return Number.isFinite(value) && value > 0 ? value : null;
      } catch {
        return null;
      }
    },
  };
};
