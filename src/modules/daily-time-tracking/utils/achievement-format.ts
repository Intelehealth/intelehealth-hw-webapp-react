/** Shown when a value is missing, not defined yet, or could not be loaded. */
export const NO_VALUE = '—';

/** Shown while the first answer is on its way. */
export const LOADING_VALUE = '...';

export const formatCount = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? String(value)
    : NO_VALUE;

/**
 * Seconds as "45m" or "1h 5m". Whole minutes only, as the panel always showed.
 */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {
    return NO_VALUE;
  }
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};
