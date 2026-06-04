import { describe, expect, it } from 'vitest';
import { isDateInFilterRange } from '../../utils/date-filter';
import type { FilterValue } from '../../utils/date-filter';

describe('isDateInFilterRange', () => {
  // --- null filter (no filter applied) ---
  it('returns true when filter is null', () => {
    expect(isDateInFilterRange('2025-04-21', null)).toBe(true);
  });

  // --- unparseable / empty date strings ---
  it('returns true when dateStr is empty', () => {
    const filter: FilterValue = { mode: 'date', from: '2025-04-21', to: null };
    expect(isDateInFilterRange('', filter)).toBe(true);
  });

  it('returns true when dateStr is not a recognisable format', () => {
    const filter: FilterValue = { mode: 'date', from: '2025-04-21', to: null };
    expect(isDateInFilterRange('not-a-date', filter)).toBe(true);
  });

  // --- ISO format: "yyyy-MM-dd" ---
  describe('ISO date format (yyyy-MM-dd)', () => {
    it('matches exact date in date mode', () => {
      const filter: FilterValue = {
        mode: 'date',
        from: '2025-04-21',
        to: null,
      };
      expect(isDateInFilterRange('2025-04-21', filter)).toBe(true);
    });

    it('does not match a different date in date mode', () => {
      const filter: FilterValue = {
        mode: 'date',
        from: '2025-04-21',
        to: null,
      };
      expect(isDateInFilterRange('2025-04-22', filter)).toBe(false);
    });
  });

  // --- Human-readable format: "DD Mon YYYY, at HH:mm" ---
  describe('human-readable date format', () => {
    it('matches exact date in date mode', () => {
      const filter: FilterValue = {
        mode: 'date',
        from: '2025-10-10',
        to: null,
      };
      expect(isDateInFilterRange('10 Oct 2025, at 10:00 am', filter)).toBe(
        true
      );
    });

    it('does not match a different date in date mode', () => {
      const filter: FilterValue = {
        mode: 'date',
        from: '2025-10-11',
        to: null,
      };
      expect(isDateInFilterRange('10 Oct 2025, at 10:00 am', filter)).toBe(
        false
      );
    });

    it('returns true for unparseable human-readable string', () => {
      const filter: FilterValue = {
        mode: 'date',
        from: '2025-04-21',
        to: null,
      };
      // "32 Xyz 2025" won't parse to a valid Date
      expect(isDateInFilterRange('32 Xyz 2025', filter)).toBe(true);
    });
  });

  // --- Range mode with to ---
  describe('range mode with to', () => {
    const filter: FilterValue = {
      mode: 'range',
      from: '2025-04-20',
      to: '2025-04-25',
    };

    it('returns true when date is within range', () => {
      expect(isDateInFilterRange('2025-04-22', filter)).toBe(true);
    });

    it('returns true when date equals from boundary', () => {
      expect(isDateInFilterRange('2025-04-20', filter)).toBe(true);
    });

    it('returns true when date equals to boundary', () => {
      expect(isDateInFilterRange('2025-04-25', filter)).toBe(true);
    });

    it('returns false when date is before range', () => {
      expect(isDateInFilterRange('2025-04-19', filter)).toBe(false);
    });

    it('returns false when date is after range', () => {
      expect(isDateInFilterRange('2025-04-26', filter)).toBe(false);
    });

    it('works with human-readable format in range', () => {
      expect(isDateInFilterRange('22 Apr 2025, at 09:00 am', filter)).toBe(
        true
      );
    });
  });

  // --- Range mode without to ---
  describe('range mode without to', () => {
    const filter: FilterValue = {
      mode: 'range',
      from: '2025-04-20',
      to: null,
    };

    it('returns true when date is on or after from', () => {
      expect(isDateInFilterRange('2025-04-20', filter)).toBe(true);
      expect(isDateInFilterRange('2025-05-01', filter)).toBe(true);
    });

    it('returns false when date is before from', () => {
      expect(isDateInFilterRange('2025-04-19', filter)).toBe(false);
    });
  });

  // --- ISO string with invalid date portion ---
  it('returns true when ISO-shaped string produces invalid Date', () => {
    const filter: FilterValue = {
      mode: 'date',
      from: '2025-04-21',
      to: null,
    };
    // "0000-00-00" matches the regex but new Date('0000-00-00') may be valid
    // Use a truly invalid one
    expect(isDateInFilterRange('abcd-ef-gh', filter)).toBe(true);
  });
});
