import { useEffect, useState } from 'react';
import {
  ACTIVITY_PENDING_EVENT,
  PENDING_KEY_PREFIX,
} from '../constants/activity-config';
import {
  dayWindow,
  loadPending,
  readUserId,
  secondsWithin,
} from '../utils/activity-buffer';
import { storage } from '../../../utils/storage';

/**
 * The working time of the signed-in health worker that is still waiting in the
 * browser, for the days from `from` to `to` (IST, YYYY-MM-DD), in seconds. The
 * server's number does not have it yet, so the dashboard adds it to show time
 * that keeps counting between heartbeats. With no dates it is all of it.
 *
 * It follows the browser's storage: this tab's own writes arrive as an event,
 * and other tabs' writes as a storage event.
 *
 * The dashboard shows the total in whole minutes. When the server's total for
 * the day is given (`baseSeconds`), the state is only updated when the shown
 * minute, or whether any time is waiting at all, changes, so the card is not
 * drawn again for every few seconds of work. Without it, every change updates.
 */
export const useUnsentActivitySeconds = (
  from?: string | null,
  to?: string | null,
  baseSeconds: number | null = null
): number => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const userId = readUserId(storage.getUser());
    const days = from && to ? dayWindow(from, to) : null;

    const sameDisplay = (shown: number, next: number) => {
      if (shown === next) return true;
      if (baseSeconds === null) return false;
      return (
        shown > 0 === next > 0 &&
        Math.floor((baseSeconds + shown) / 60) ===
          Math.floor((baseSeconds + next) / 60)
      );
    };
    const update = () => {
      const next = userId ? secondsWithin(loadPending(userId), days) : 0;
      setSeconds(shown => (sameDisplay(shown, next) ? shown : next));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith(PENDING_KEY_PREFIX))
        update();
    };

    update();
    window.addEventListener(ACTIVITY_PENDING_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ACTIVITY_PENDING_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, [from, to, baseSeconds]);

  return seconds;
};
