import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'ih_daily_time_spent';

interface StoredTimeData {
  date: string;
  ms: number;
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadStoredMs(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed: StoredTimeData = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return 0;
    return parsed.ms;
  } catch {
    return 0;
  }
}

function saveMs(ms: number): void {
  const data: StoredTimeData = { date: getTodayKey(), ms };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * Tracks how long the user has the app open today.
 * Uses Page Visibility API to pause tracking when the tab is hidden.
 * Persists accumulated time in localStorage per day.
 */
export const useTimeSpent = (): string => {
  const [display, setDisplay] = useState(() => formatTime(loadStoredMs()));
  const accumulatedRef = useRef(loadStoredMs());
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    const flush = () => {
      const elapsed = Date.now() - sessionStartRef.current;
      accumulatedRef.current += elapsed;
      saveMs(accumulatedRef.current);
      sessionStartRef.current = Date.now();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        flush();
      } else {
        accumulatedRef.current = loadStoredMs();
        sessionStartRef.current = Date.now();
      }
    };

    const interval = setInterval(() => {
      const total =
        accumulatedRef.current + (Date.now() - sessionStartRef.current);
      setDisplay(formatTime(total));
      flush();
    }, 60_000);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', flush);

    return () => {
      flush();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', flush);
    };
  }, []);

  return display;
};
