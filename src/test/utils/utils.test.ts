import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as utils from '../../utils/utils';
const { calculateAge, formatDate, isValidDate } = utils;

describe('utils', () => {
  describe('calculateAge', () => {
    let mockToday: Date;

    beforeEach(() => {
      // Mock current date to March 15, 2024 for consistent testing
      mockToday = new Date('2024-03-15');
      vi.useFakeTimers();
      vi.setSystemTime(mockToday);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return null for empty string', () => {
      expect(calculateAge('')).toBeNull();
      expect(calculateAge('   ')).toBeNull();
    });

    it('should return null for null or undefined input', () => {
      expect(calculateAge(null as unknown as string)).toBeNull();
      expect(calculateAge(undefined as unknown as string)).toBeNull();
    });

    it('should return null for invalid date string', () => {
      expect(calculateAge('invalid-date')).toBeNull();
      expect(calculateAge('2024-13-45')).toBeNull();
      expect(calculateAge('not-a-date')).toBeNull();
    });

    it('should calculate age correctly for past dates', () => {
      // Born in 1990, should be 34 in 2024
      expect(calculateAge('1990-01-01')).toBe(34);
      
      // Born in 2000, should be 24 in 2024
      expect(calculateAge('2000-06-15')).toBe(23);
    });

    it('should adjust age if birthday has not occurred this year', () => {
      // Mock today as March 15, 2024
      // Born March 20, 2000 - birthday hasn't occurred yet this year
      expect(calculateAge('2000-03-20')).toBe(23);
      
      // Born April 1, 2000 - birthday hasn't occurred yet
      expect(calculateAge('2000-04-01')).toBe(23);
      
      // Born March 10, 2000 - birthday already occurred this year
      expect(calculateAge('2000-03-10')).toBe(24);
      
      // Born March 15, 2000 - birthday is today, should count as occurred
      expect(calculateAge('2000-03-15')).toBe(24);
    });

    it('should return 0 for future dates', () => {
      // Future date should return 0
      expect(calculateAge('2025-01-01')).toBe(0);
      expect(calculateAge('2030-12-31')).toBe(0);
    });

    it('should handle error and return null', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock Date constructor to throw an error
      const OriginalDate = global.Date;
      global.Date = class extends OriginalDate {
        constructor(...args: unknown[]) {
          super(...args);
          // Throw error for specific test case
          if (args.length > 0 && String(args[0]) === 'throw-error') {
            throw new Error('Forced date error');
          }
        }
      } as DateConstructor;

      // Test with a value that will trigger the error
      const result = calculateAge('throw-error');
      expect(result).toBeNull();
      
      // Cleanup
      global.Date = OriginalDate;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('formatDate', () => {
    it('should format Date object to YYYY-MM-DD', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date)).toBe('2024-03-15');
    });

    it('should format date string to YYYY-MM-DD', () => {
      expect(formatDate('2024-03-15')).toBe('2024-03-15');
      expect(formatDate('2024-12-31')).toBe('2024-12-31');
    });

    it('should handle error and return empty string', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock Date.prototype.toISOString to throw an error
      const originalToISOString = Date.prototype.toISOString;
      Date.prototype.toISOString = function () {
        throw new Error('Forced ISO string error');
      };

      expect(formatDate(new Date())).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      Date.prototype.toISOString = originalToISOString;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('isValidDate', () => {
    it('should return false for empty string', () => {
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('   ')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidDate(null as unknown as string)).toBe(false);
      expect(isValidDate(undefined as unknown as string)).toBe(false);
    });

    it('should return false for invalid date strings', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2024-13-45')).toBe(false);
      expect(isValidDate('not-a-date')).toBe(false);
      expect(isValidDate('2024/03/15')).toBe(false); // Wrong format
    });

    it('should return true for valid date strings', () => {
      expect(isValidDate('2024-03-15')).toBe(true);
      expect(isValidDate('2024-12-31')).toBe(true);
      expect(isValidDate('2000-01-01')).toBe(true);
    });

    it('should return false when date string does not match formatted date', () => {
      // Date that can be parsed but doesn't match the exact format
      // This tests the dateString === formatDate(date) check
      const date = new Date('2024-03-15T10:30:00');
      const formatted = formatDate(date);
      // If we pass a string that's different from the formatted version
      expect(isValidDate('2024-03-15T10:30:00')).toBe(false);
    });

    it('should handle error and return false', () => {
      // Force an error by making the Date constructor throw
      // This will trigger the catch block in isValidDate
      const OriginalDate = global.Date;
      global.Date = class extends OriginalDate {
        constructor(...args: unknown[]) {
          super(...args);
          // Throw error for specific test case
          if (args.length > 0 && String(args[0]) === 'throw-error-date') {
            throw new Error('Forced date constructor error');
          }
        }
      } as DateConstructor;

      expect(isValidDate('throw-error-date')).toBe(false);

      // Restore
      global.Date = OriginalDate;
    });
  });
});

