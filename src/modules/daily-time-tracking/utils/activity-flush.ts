import { LOGOUT_FLUSH_MAX_MS } from '../constants/activity-config';

/**
 * The way to send the waiting working time from outside the activity hook.
 * It is kept apart from the hook so the logout button can use it without
 * loading the hook and what it needs.
 */
let waiting: (() => void | Promise<void>) | null = null;

/** Called by the hook while it is counting. Returns the way to stop. */
export const registerActivityFlush = (
  flush: () => void | Promise<void>
): (() => void) => {
  waiting = flush;
  return () => {
    if (waiting === flush) waiting = null;
  };
};

/**
 * Sends all the time that is waiting, oldest first, and answers when it is
 * sent, or after LOGOUT_FLUSH_MAX_MS. Call it just before the login is cleared
 * (the logout button): the requests are made with the token that is still there,
 * and whatever does not get through stays in the browser for the next login.
 * Does nothing when no page is counting.
 */
export const flushActivityHeartbeat = async (): Promise<void> => {
  if (!waiting) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const giveUp = new Promise<void>(resolve => {
    timer = setTimeout(resolve, LOGOUT_FLUSH_MAX_MS);
  });
  try {
    await Promise.race([waiting(), giveUp]);
  } finally {
    clearTimeout(timer);
  }
};
