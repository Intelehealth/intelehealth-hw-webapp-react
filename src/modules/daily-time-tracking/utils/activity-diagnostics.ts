import { captureMessage } from '../../../config/sentry';

/**
 * Problems with the daily time spent, written down so they can be found later.
 * The details are numbers and short codes only: never a user id, a token or any
 * patient data. Problems that are not expected (the server refusing a request,
 * time dropped, a server total that went down) are also sent to Sentry, like the
 * rest of the app's unexpected errors. A failed request that will be tried again
 * is only written to the console.
 */
export type ActivityIssue =
  | 'send_failed' // a request failed and is kept to be sent again
  | 'send_rejected' // the server refused the request as wrong: the time is dropped
  | 'dropped_too_old' // time that is older than the server accepts: dropped
  | 'server_total_lower'; // the server's total for the day is lower than one it gave before

export const reportActivityIssue = (
  issue: ActivityIssue,
  details: Record<string, number | string | boolean | null>
): void => {
  console.warn(`[daily-time] ${issue}`, details);
  if (issue !== 'send_failed')
    captureMessage(
      `Daily time: ${issue} ${JSON.stringify(details)}`,
      'warning'
    );
};
