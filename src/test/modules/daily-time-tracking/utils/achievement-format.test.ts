import { describe, expect, it } from 'vitest';
import {
  LOADING_VALUE,
  NO_VALUE,
  formatCount,
  formatDuration,
} from '../../../../modules/daily-time-tracking/utils/achievement-format';

describe('achievement-format', () => {
  it('has distinct placeholders', () => {
    expect(NO_VALUE).toBe('—');
    expect(LOADING_VALUE).toBe('...');
  });

  describe('formatCount', () => {
    it('shows numbers, including zero', () => {
      expect(formatCount(0)).toBe('0');
      expect(formatCount(7)).toBe('7');
    });

    it('shows a dash for anything that is not a number', () => {
      expect(formatCount(null)).toBe(NO_VALUE);
      expect(formatCount(undefined)).toBe(NO_VALUE);
      expect(formatCount(Number.NaN)).toBe(NO_VALUE);
      expect(formatCount(Number.POSITIVE_INFINITY)).toBe(NO_VALUE);
    });
  });

  describe('formatDuration', () => {
    it('shows whole minutes below an hour', () => {
      expect(formatDuration(0)).toBe('0m');
      expect(formatDuration(59)).toBe('0m');
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(45 * 60)).toBe('45m');
      expect(formatDuration(3599)).toBe('59m');
    });

    it('shows hours and minutes from an hour', () => {
      expect(formatDuration(3600)).toBe('1h 0m');
      expect(formatDuration(5460)).toBe('1h 31m');
      expect(formatDuration(86400)).toBe('24h 0m');
    });

    it('shows a dash for a missing or invalid value', () => {
      expect(formatDuration(null)).toBe(NO_VALUE);
      expect(formatDuration(undefined)).toBe(NO_VALUE);
      expect(formatDuration(-1)).toBe(NO_VALUE);
      expect(formatDuration(Number.NaN)).toBe(NO_VALUE);
    });
  });
});
