/**
 * The rules and settings of the daily time spent, in one place. The time is
 * tracked in the browser (activity-session), kept in localStorage
 * (activity-buffer), coordinated between tabs (tab-leader) and sent to the portal
 * (activity-sync.service). Nothing here is read from the server except through the
 * values that must match it, which are marked.
 */

// ---- The day ---------------------------------------------------------------
/**
 * Daily time follows one organisational timezone, not the device's: IST. It must
 * match the portal's ACHIEVEMENTS_TZ_OFFSET_MINUTES (default 330), because the
 * portal saves each period under the IST day it ended in.
 */
export const ACTIVITY_TZ_OFFSET_MINUTES = 330;
export const ACTIVITY_TZ_OFFSET_MS = ACTIVITY_TZ_OFFSET_MINUTES * 60_000;
export const DAY_MS = 86_400_000;

// ---- What counts as working time ---------------------------------------------
/**
 * Working time is time with the page open, hidden or not, as long as the person
 * did something in the page (mouse, keyboard, scroll, touch) in the last
 * IDLE_LIMIT_MS. After that it is away time and does not count until they move.
 */
export const IDLE_LIMIT_MS = 30 * 60_000;
/** A busy mouse does not need to be looked at more than once a second. */
export const ACTIVITY_THROTTLE_MS = 1_000;
/**
 * The computer's clock set back by more than this is corrected for. (Forward
 * jumps need no correction: counting stops at the last move plus IDLE_LIMIT_MS.)
 */
export const CLOCK_SET_BACK_TOLERANCE_MS = 5_000;

// ---- What the portal accepts (its API contract) --------------------------------
/** The most seconds one heartbeat may report: HEARTBEAT_MAX_SECONDS on the portal. */
export const HEARTBEAT_MAX_SECONDS = 3_600;
/** How long ago a reported period may have ended. */
export const MAX_ENDED_SECONDS_AGO = 86_400;

// ---- When time is sent ---------------------------------------------------------
/**
 * Switching to another tab or window sends the waiting time only when at least
 * this many seconds are waiting, and not more often than HIDE_SEND_MIN_GAP_MS.
 * The time is kept in the browser either way, so nothing is lost by waiting.
 * Closing the page, logging out and the other events always send everything.
 */
export const HIDE_SEND_MIN_SECONDS = 60;
export const HIDE_SEND_MIN_GAP_MS = 5 * 60_000;
/**
 * A page that stays open and is never hidden or closed still sends: the tab that
 * counts sends what is waiting from the lease timer, when at least this many
 * seconds are waiting and this long has passed since the page opened or since
 * the last send. At most once an hour, which is also one heartbeat of at most
 * HEARTBEAT_MAX_SECONDS. It keeps the portal from being a day behind, and the
 * time from living only on the device for a whole day.
 */
export const PERIODIC_SEND_MIN_SECONDS = 60;
export const PERIODIC_SEND_MIN_GAP_MS = 60 * 60_000;
/**
 * A request sent as the page is hidden or closed gives up after this long if no answer
 * comes. Until it is answered no other request is sent, so it must not wait for ever.
 */
export const EXIT_REQUEST_TIMEOUT_MS = 30_000;
/**
 * Logging out waits this long, at most, for the waiting time to be sent before the login
 * is cleared. What has not gone by then stays in the browser for the next login.
 */
export const LOGOUT_FLUSH_MAX_MS = 5_000;
/** The summary is fetched again when the tab comes back after being hidden this long. */
export const REFRESH_AFTER_HIDDEN_MS = 10 * 60_000;

// ---- Tabs of one browser -------------------------------------------------------
/** How often the leader renews the lease, and the others check it. */
export const LEASE_REFRESH_MS = 15_000;
/**
 * A lease that was not renewed for this long is free. A hidden tab's timers can
 * run only once a minute, so this is well above a minute.
 */
export const LEASE_TTL_MS = 90_000;
/**
 * A tab that takes over continues from where the previous leader had counted,
 * but only if that was this recent: a handover, not a restart after hours.
 */
export const ADOPT_MAX_AGE_MS = 120_000;
/** A move in a tab is written for the other tabs at most this often. */
export const SHARED_ACTIVITY_WRITE_GAP_MS = 10_000;

// ---- localStorage keys and events ----------------------------------------------
export const PENDING_KEY_PREFIX = 'ih:activity:pending:';
export const SERVER_KEY_PREFIX = 'ih:activity:server:';
export const LEASE_KEY = 'ih:activity:lease';
export const ACTIVITY_KEY = 'ih:activity:last-move';
/** Fired in this tab when what is waiting in the browser has been written. */
export const ACTIVITY_PENDING_EVENT = 'ih:activity-pending-changed';
/**
 * Fired in this tab each time the server has accepted waiting time. The event
 * carries the server's answer (CustomEvent detail, an ActivitySentDetail).
 */
export const ACTIVITY_SENT_EVENT = 'ih:activity-sent';
