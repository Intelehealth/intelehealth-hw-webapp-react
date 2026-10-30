import { useEffect } from 'react';
import { createActivitySync } from '../services/activity-sync.service';
import { readUserId } from '../utils/activity-buffer';
import {
  ACTIVITY_KEY,
  HIDE_SEND_MIN_GAP_MS,
  HIDE_SEND_MIN_SECONDS,
  LEASE_REFRESH_MS,
} from '../constants/activity-config';
import { registerActivityFlush } from '../utils/activity-flush';
import { createActivitySession } from '../utils/activity-session';
import { storage } from '../../../utils/storage';
import { createTabLeader } from '../utils/tab-leader';

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'wheel',
  'scroll',
  'touchstart',
] as const;

/**
 * Starts tracking how long the health worker has been working in the app, and
 * sends it to the portal when it needs to. It only connects the pieces to the
 * browser's events and lifecycle; the work is done by
 * - activity-session: elapsed time from timestamps, active versus idle time,
 *   clock changes;
 * - activity-buffer: the time kept in localStorage per user and day;
 * - tab-leader: which tab of the browser counts and sends;
 * - activity-sync.service: keeping the time until the portal has acknowledged
 *   it, sending, retrying;
 * all of them using the settings in activity-config.
 *
 * There is no timer that sends. Time is sent by events:
 * - when the page is closed or left (pagehide), when the layout goes away, when
 *   the person logs out (flushActivityHeartbeat, see activity-flush: all of it,
 *   one request after the other), when the connection returns, when a page loads
 *   and finds time an earlier session left, and when another tab takes over
 *   counting;
 * - when the page is hidden (the person switched tab or window), but only if
 *   HIDE_SEND_MIN_SECONDS are waiting and the last send was at least
 *   HIDE_SEND_MIN_GAP_MS ago, so switching tabs often does not send each time.
 * The one timer that runs, every LEASE_REFRESH_MS, makes no request: it keeps
 * this tab's place as the leader and writes the waiting time to localStorage.
 *
 * Only one tab of the same browser counts and sends (see tab-leader). A move in
 * any tab keeps the leader counting, even when the leader is hidden. A tab that
 * is not the leader counts nothing and sends nothing; if the leader closes,
 * another tab takes over from where it had counted.
 *
 * Browsers close pages without waiting for requests, so sending when a page is
 * closed is a best effort. Nothing depends on it: the time stays in the browser
 * until the portal has acknowledged it, and goes out at the next page load.
 */
export const useActivityHeartbeat = (): void => {
  useEffect(() => {
    const tab = createTabLeader();
    let isLeader = false;
    const sync = createActivitySync({
      userId: readUserId(storage.getUser()),
      isLeader: () => isLeader,
    });
    const session = createActivitySession({
      onCounted: sync.add,
      onClockSetBack: sync.shift,
    });

    // Send everything that is waiting, without waiting for the answer: for a page that is going away.
    const sendAll = () => {
      session.collect(isLeader);
      sync.sendOnExit();
    };

    // Send everything that is waiting, oldest first, and answer when it is all sent.
    const flushAll = () => {
      session.collect(isLeader);
      return sync.flush();
    };

    // Renew the lease if this tab leads, take it if it is free. A tab that has
    // just become the leader picks up time that an earlier session left in the
    // browser, and continues from where the previous leader had counted. A tab
    // that has just lost the lease sends what it has.
    const elect = () => {
      const wasLeader = isLeader;
      session.collect(isLeader);
      const result = tab.elect(session.now(), session.checkpoint());
      if (result.leader && !wasLeader) {
        isLeader = true;
        // The gap since the previous leader is counted first, so it joins the time left from
        // the last session and both go out in one request.
        session.startCounting(tab.lastSharedActivity(), result.adoptUpTo);
        if (sync.adoptStored()) void sync.flush(); // the time left from the last session goes out now
      } else if (!result.leader && wasLeader) {
        // Another tab leads now. This tab sends what it has but no longer writes the
        // browser's copy, which is the new leader's.
        isLeader = false;
        sendAll();
      }
      sync.persist();
    };

    const onActivity = () => {
      const at = session.move(isLeader);
      if (at !== null) tab.noteActivity(at);
    };
    // A move in another tab.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== ACTIVITY_KEY || !event.newValue) return;
      const incoming = Number(event.newValue);
      if (!Number.isFinite(incoming)) return;
      session.remoteMove(isLeader, incoming, Number(event.oldValue) || null);
    };
    // The page is hidden: the person switched to another tab or window. Send the
    // waiting time if there is enough of it and it has not just been sent; if
    // not, it stays in the browser and goes out at the next event.
    const onHidden = () => {
      session.collect(isLeader);
      if (
        sync.waitingSeconds() >= HIDE_SEND_MIN_SECONDS &&
        session.now() - sync.lastSendAt() >= HIDE_SEND_MIN_GAP_MS
      )
        sync.sendOnExit();
      else sync.persist();
    };
    // The page is going away: send what is waiting and let the lease go, so
    // another tab can take over without waiting for it to run out.
    const onLeaving = () => {
      sendAll();
      if (isLeader) {
        tab.release(session.checkpoint());
        isLeader = false;
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) onHidden();
      else onActivity(); // coming back to the page is a move too
    };
    const onOnline = () => {
      void flushAll();
    };

    // The logout button sends it all while the login is still there.
    const unregisterFlush = registerActivityFlush(flushAll);

    elect();
    const leaseInterval = setInterval(elect, LEASE_REFRESH_MS);
    for (const name of ACTIVITY_EVENTS)
      window.addEventListener(name, onActivity, { passive: true });
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onLeaving);
    window.addEventListener('online', onOnline);

    return () => {
      onLeaving();
      sync.stop();
      unregisterFlush();
      clearInterval(leaseInterval);
      for (const name of ACTIVITY_EVENTS)
        window.removeEventListener(name, onActivity);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onLeaving);
      window.removeEventListener('online', onOnline);
    };
  }, []);
};
