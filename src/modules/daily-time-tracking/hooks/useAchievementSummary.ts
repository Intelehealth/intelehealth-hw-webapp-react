import { useEffect, useState } from 'react';
import { achievementSummaryService } from '../services/achievement-summary.service';
import type { AchievementSummary } from '../types/achievement-summary.types';
import {
  loadServerSeconds,
  readUserId,
  saveServerSeconds,
  serverKey,
  type ActivitySentDetail,
} from '../utils/activity-buffer';
import {
  ACTIVITY_SENT_EVENT,
  REFRESH_AFTER_HIDDEN_MS,
} from '../constants/activity-config';
import { reportActivityIssue } from '../utils/activity-diagnostics';
import { storage } from '../../../utils/storage';

// The summary is for one day (today) when it was asked for without dates.
const isOneDay = (summary: AchievementSummary) =>
  summary.from !== null && summary.from === summary.to;

/**
 * The newer of two answers for the time of the same day. The server's total for
 * a day only grows, so an answer that arrives late with a smaller number is
 * stale and does not take the number back.
 */
const withNewerTime = (
  current: AchievementSummary | null,
  incoming: AchievementSummary
): AchievementSummary => {
  if (
    current &&
    isOneDay(current) &&
    current.from === incoming.from &&
    current.to === incoming.to &&
    (current.dailyTimeSpentSeconds ?? 0) > (incoming.dailyTimeSpentSeconds ?? 0)
  )
    return {
      ...incoming,
      dailyTimeSpentSeconds: current.dailyTimeSpentSeconds,
      status: current.status === 'Active' ? 'Active' : incoming.status,
    };
  return incoming;
};

/**
 * Loads the Achievements panel values from the portal. It asks only when it has
 * to, not on a timer:
 * - once when the dashboard opens (a page load or a login),
 * - again when the connection returns after that failed,
 * - again when the tab comes back after being hidden for REFRESH_AFTER_HIDDEN_MS,
 * - and again when a heartbeat answer is for another day than the numbers: the
 *   day has changed.
 * Between those, the time spent follows the heartbeat answers: each one says the
 * server's total for the day, which is used without asking again. The answers
 * of this tab come as an event; those of another tab of the same browser arrive
 * through the total remembered in localStorage. If a load fails the last good
 * values stay. The remembered total also lets the time show at once after a reload.
 */
export const useAchievementSummary = () => {
  const [data, setData] = useState<AchievementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let failed = false;
    let current: AchievementSummary | null = null;
    let hiddenAt: number | null = null;
    const userId = readUserId(storage.getUser());

    const apply = (next: AchievementSummary) => {
      current = next;
      setData(next);
    };

    // One request at a time: events that come close together share it.
    let request: Promise<void> | null = null;
    const loadOnce = async () => {
      try {
        const summary = await achievementSummaryService.getSummary();
        if (!active) return;
        failed = false;
        const next = withNewerTime(current, summary);
        apply(next);
        if (userId && isOneDay(next) && next.to) {
          const known = loadServerSeconds(userId, next.to);
          if (known !== null && (summary.dailyTimeSpentSeconds ?? 0) < known)
            reportActivityIssue('server_total_lower', {
              known,
              given: summary.dailyTimeSpentSeconds ?? 0,
            });
          saveServerSeconds(userId, next.to, next.dailyTimeSpentSeconds ?? 0);
        }
        setError(false);
      } catch {
        if (!active) return;
        failed = true;
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    const load = (): Promise<void> => {
      if (request) return request;
      const run = loadOnce().finally(() => {
        if (request === run) request = null;
      });
      request = run;
      return run;
    };
    const onOnline = () => {
      if (failed) void load();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      const wasHiddenFor = hiddenAt === null ? 0 : Date.now() - hiddenAt;
      hiddenAt = null;
      if (wasHiddenFor >= REFRESH_AFTER_HIDDEN_MS) void load();
    };

    // The server has accepted working time and says its total for that day.
    const takeAnswer = (answer: ActivitySentDetail) => {
      if (!current) return; // not loaded yet: the load will have it
      if (!isOneDay(current)) return;
      if (answer.activityDate !== current.to) {
        void load(); // the day has changed: ask again for the new day
        return;
      }
      if (answer.todaySeconds > (current.dailyTimeSpentSeconds ?? 0))
        apply({
          ...current,
          dailyTimeSpentSeconds: answer.todaySeconds,
          status: 'Active',
        });
    };
    const onTimeSent = (event: Event) => {
      const answer = (event as CustomEvent<ActivitySentDetail | undefined>)
        .detail;
      if (answer) takeAnswer(answer);
    };
    // Another tab of this browser got an answer: it left the total in localStorage.
    const onStorage = (event: StorageEvent) => {
      if (!userId || event.key !== serverKey(userId) || !event.newValue) return;
      try {
        const record = JSON.parse(event.newValue) as {
          date?: unknown;
          seconds?: unknown;
        };
        if (
          typeof record.date === 'string' &&
          typeof record.seconds === 'number'
        )
          takeAnswer({
            activityDate: record.date,
            todaySeconds: record.seconds,
          });
      } catch {
        // not a record this version wrote: the next load has the total
      }
    };

    void load();
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener(ACTIVITY_SENT_EVENT, onTimeSent);
    window.addEventListener('storage', onStorage);

    return () => {
      active = false;
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener(ACTIVITY_SENT_EVENT, onTimeSent);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return { data, loading, error };
};
