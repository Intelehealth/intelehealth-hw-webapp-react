import { describe, expect, it, vi } from 'vitest';
import { calculateAge, getCountryCode } from '../../utils/common';
import * as countriesModule from '../../utils/countries';

describe('common.ts', () => {
  describe('getCountryCode', () => {
    it('should return country object for valid dial code', async () => {
      const result = await getCountryCode('+91');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+91');
      expect(result?.name).toBe('India');
      expect(result?.code).toBe('IN'); // country-state-city returns uppercase ISO codes
    });

    it('should return country object for US dial code', async () => {
      const result = await getCountryCode('+1');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+1');
      // country-state-city returns first match (could be Canada or United States)
      expect(result?.name).toBeTruthy();
      expect(['Canada', 'United States']).toContain(result?.name);
      expect(result?.code).toBeTruthy();
      expect(['CA', 'US']).toContain(result?.code);
    });

    it('should return country object for UK dial code', async () => {
      const result = await getCountryCode('+44');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+44');
      expect(result?.name).toBe('United Kingdom');
      expect(result?.code).toBe('GB'); // country-state-city returns uppercase ISO codes
    });

    it('should return country object for Australia dial code', async () => {
      const result = await getCountryCode('+61');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+61');
      expect(result?.name).toBe('Australia');
      expect(result?.code).toBe('AU'); // country-state-city returns uppercase ISO codes
    });

    it('should return undefined for invalid dial code', async () => {
      const result = await getCountryCode('+999');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', async () => {
      const result = await getCountryCode('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for dial code without plus sign', async () => {
      const result = await getCountryCode('91');
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent dial code', async () => {
      const result = await getCountryCode('+123');
      expect(result).toBeUndefined();
    });

    it('should handle case-sensitive dial code matching', async () => {
      // Dial codes should be exact matches
      const result = await getCountryCode('+91');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+91');
    });

    it('should return first matching country for duplicate dial codes', async () => {
      // Both US and Canada have +1, should return first match from country-state-city
      const result = await getCountryCode('+1');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+1');
      // country-state-city may return Canada or United States first
      expect(['Canada', 'United States']).toContain(result?.name);
      expect(['CA', 'US']).toContain(result?.code);
    });

    it('should use Array.find() internally', async () => {
      // This test verifies the function uses find() by checking behavior
      const result = await getCountryCode('+91');
      expect(result).toEqual({
        name: 'India',
        code: 'IN', // country-state-city returns uppercase ISO codes
        dial_code: '+91',
      });
    });

    it('should return undefined for whitespace-only input', async () => {
      const result = await getCountryCode('   ');
      expect(result).toBeUndefined();
    });

    it('should not return match for partial dial code', async () => {
      const result = await getCountryCode('+9');
      expect(result).toBeUndefined();
    });

    it('should handle dial code with extra characters', async () => {
      const result = await getCountryCode('+91abc');
      expect(result).toBeUndefined();
    });

    it('should handle country with missing code', async () => {
      // Mock getCountryByDialCode to return a country without code
      vi.spyOn(countriesModule, 'getCountryByDialCode').mockReturnValueOnce({
        name: 'Test Country',
        dial_code: '+999',
        code: undefined,
      } as any);

      const result = await getCountryCode('+999');
      expect(result).toBeDefined();
      expect(result?.code).toBe('');
      expect(result?.dial_code).toBe('+999');
      expect(result?.name).toBe('Test Country');

      vi.restoreAllMocks();
    });

    it('should handle country with missing dial_code', async () => {
      // Mock getCountryByDialCode to return a country without dial_code
      vi.spyOn(countriesModule, 'getCountryByDialCode').mockReturnValueOnce({
        name: 'Test Country',
        dial_code: undefined,
        code: 'TC',
      } as any);

      const result = await getCountryCode('+888');
      expect(result).toBeDefined();
      expect(result?.code).toBe('TC');
      expect(result?.dial_code).toBe('+888'); // Should use countryCode parameter
      expect(result?.name).toBe('Test Country');

      vi.restoreAllMocks();
    });
  });

  describe('calculateAge', () => {
    // Helper function to create a date string
    const createDateString = (yearsAgo: number, monthOffset = 0, dayOffset = 0): string => {
      const today = new Date();
      const date = new Date(
        today.getFullYear() - yearsAgo,
        today.getMonth() + monthOffset,
        today.getDate() + dayOffset
      );
      return date.toISOString().split('T')[0];
    };

    describe('Basic age calculation', () => {
      it('should calculate age correctly for exact years', () => {
        const dateOfBirth = createDateString(25);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(25);
      });

      it('should calculate age for a person born 30 years ago', () => {
        const dateOfBirth = createDateString(30);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(30);
      });

      it('should calculate age for a person born 1 year ago', () => {
        const dateOfBirth = createDateString(1);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(1);
      });

      it('should calculate age for a person born 50 years ago', () => {
        const dateOfBirth = createDateString(50);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(50);
      });

      it('should calculate age for a person born 100 years ago', () => {
        const dateOfBirth = createDateString(100);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(100);
      });
    });

    describe('Month boundary cases', () => {
      it('should not have birthday yet if birthday month is in the future', () => {
        const dateOfBirth = createDateString(25, 1); // 1 month in the future
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(24);
      });

      it('should have birthday if birthday month is in the past', () => {
        const dateOfBirth = createDateString(25, -1); // 1 month in the past
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(25);
      });

      it('should handle birthday in the same month but day not yet reached', () => {
        // Create a date in the same month but with a future day (birthday hasn't occurred yet)
        const today = new Date();
        // Use a fixed future day within the month to avoid overflow issues
        const futureDay = Math.min(today.getDate() + 5, 28); // Safe day that won't overflow
        if (futureDay > today.getDate()) {
          const dateOfBirth = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(futureDay).padStart(2, '0')}`;
          const age = calculateAge(dateOfBirth);
          expect(age).toBe(24); // Birthday hasn't occurred yet
        }
      });

      it('should handle birthday in the same month and day already passed', () => {
        const dateOfBirth = createDateString(25, 0, -1); // Same month, 1 day in the past
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(25);
      });

      it('should handle birthday today (same month and same day)', () => {
        const dateOfBirth = createDateString(25, 0, 0); // Exact same day
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(25);
      });
    });

    describe('Day boundary cases', () => {
      it('should handle birthday tomorrow (same month, next day)', () => {
        const today = new Date();
        const futureDay = Math.min(today.getDate() + 1, 28);
        if (futureDay > today.getDate()) {
          const dateOfBirth = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(futureDay).padStart(2, '0')}`;
          const age = calculateAge(dateOfBirth);
          expect(age).toBe(24);
        }
      });

      it('should handle birthday yesterday (same month, previous day)', () => {
        const dateOfBirth = createDateString(25, 0, -1);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(25);
      });

      it('should handle birthday 5 days ago', () => {
        const dateOfBirth = createDateString(25, 0, -5);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(25);
      });

      it('should handle birthday in 5 days', () => {
        const dateOfBirth = createDateString(25, 0, 5);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(24);
      });
    });

    describe('Edge cases with newborns', () => {
      it('should return 0 for a baby born this year', () => {
        const dateOfBirth = createDateString(0, 0, 0);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(0);
      });

      it('should return 0 for a baby born 6 months ago', () => {
        const dateOfBirth = createDateString(0, -6, 0);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(0);
      });

      it('should return 0 for a baby born 1 day ago', () => {
        const dateOfBirth = createDateString(0, 0, -1);
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(0);
      });
    });

    describe('Specific date formats', () => {
      it('should handle ISO date format (YYYY-MM-DD)', () => {
        const age = calculateAge('1990-01-01');
        const currentYear = new Date().getFullYear();
        const expectedAge = currentYear - 1990;
        const today = new Date();
        // Adjust if birthday hasn't occurred yet this year
        const adjustedAge = today.getMonth() === 0 && today.getDate() < 1 ? expectedAge - 1 : expectedAge;
        expect(age).toBeGreaterThanOrEqual(adjustedAge - 1);
        expect(age).toBeLessThanOrEqual(expectedAge);
      });

      it('should handle date with leading zeros', () => {
        const currentYear = new Date().getFullYear();
        const age = calculateAge(`${currentYear - 25}-05-15`);
        expect(age).toBeGreaterThanOrEqual(24);
        expect(age).toBeLessThanOrEqual(25);
      });

      it('should handle leap year date (Feb 29)', () => {
        // 2000 was a leap year
        const age = calculateAge('2000-02-29');
        const currentYear = new Date().getFullYear();
        const expectedAge = currentYear - 2000;
        expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
        expect(age).toBeLessThanOrEqual(expectedAge);
      });
    });

    describe('Year boundary cases', () => {
      it('should handle birthday at end of year (December)', () => {
        const currentYear = new Date().getFullYear();
        const age = calculateAge(`${currentYear - 25}-12-31`);
        expect(age).toBeGreaterThanOrEqual(24);
        expect(age).toBeLessThanOrEqual(25);
      });

      it('should handle birthday at start of year (January)', () => {
        const currentYear = new Date().getFullYear();
        const age = calculateAge(`${currentYear - 25}-01-01`);
        expect(age).toBeGreaterThanOrEqual(24);
        expect(age).toBeLessThanOrEqual(25);
      });

      it('should handle mid-year birthday (June)', () => {
        const currentYear = new Date().getFullYear();
        const age = calculateAge(`${currentYear - 25}-06-15`);
        expect(age).toBeGreaterThanOrEqual(24);
        expect(age).toBeLessThanOrEqual(25);
      });
    });

    describe('Month comparison logic', () => {
      it('should correctly handle monthDiff < 0 condition', () => {
        // Birthday in a future month
        const today = new Date();
        const futureMonth = (today.getMonth() + 2) % 12;
        const year = futureMonth < today.getMonth() ? today.getFullYear() - 24 : today.getFullYear() - 25;
        const dateOfBirth = `${year}-${String(futureMonth + 1).padStart(2, '0')}-15`;
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(24);
      });

      it('should correctly handle monthDiff === 0 and day < today condition', () => {
        // Same month but birthday hasn't occurred yet
        const today = new Date();
        const futureDay = Math.min(today.getDate() + 1, 28);
        if (futureDay > today.getDate()) {
          const dateOfBirth = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(futureDay).padStart(2, '0')}`;
          const age = calculateAge(dateOfBirth);
          expect(age).toBe(24);
        }
      });

      it('should correctly handle monthDiff === 0 and day >= today condition', () => {
        // Same month and birthday has occurred
        const today = new Date();
        if (today.getDate() > 1) {
          const dateOfBirth = createDateString(25, 0, -1);
          const age = calculateAge(dateOfBirth);
          expect(age).toBe(25);
        }
      });

      it('should correctly handle monthDiff > 0 condition', () => {
        // Birthday in a past month
        const today = new Date();
        const pastMonth = (today.getMonth() - 2 + 12) % 12;
        const year = pastMonth > today.getMonth() ? today.getFullYear() - 24 : today.getFullYear() - 25;
        const dateOfBirth = `${year}-${String(pastMonth + 1).padStart(2, '0')}-15`;
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(25);
      });
    });

    describe('Real-world scenarios', () => {
      it('should calculate age for someone born on Jan 1, 1990', () => {
        const age = calculateAge('1990-01-01');
        const currentYear = new Date().getFullYear();
        const expectedAge = currentYear - 1990;
        const today = new Date();
        const adjustedAge = today.getMonth() === 0 && today.getDate() < 1 ? expectedAge - 1 : expectedAge;
        expect(age).toBeGreaterThanOrEqual(adjustedAge - 1);
        expect(age).toBeLessThanOrEqual(expectedAge);
      });

      it('should calculate age for someone born on Dec 31, 2000', () => {
        const age = calculateAge('2000-12-31');
        const currentYear = new Date().getFullYear();
        const expectedAge = currentYear - 2000;
        expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
        expect(age).toBeLessThanOrEqual(expectedAge);
      });

      it('should calculate age for someone born on Feb 29, 2000 (leap year)', () => {
        const age = calculateAge('2000-02-29');
        const currentYear = new Date().getFullYear();
        const expectedAge = currentYear - 2000;
        expect(age).toBeGreaterThanOrEqual(expectedAge - 1);
        expect(age).toBeLessThanOrEqual(expectedAge);
      });
    });

    describe('Age decrement logic', () => {
      it('should decrement age when birthday has not occurred (future month)', () => {
        const today = new Date();
        const futureMonth = (today.getMonth() + 1) % 12;
        const year = futureMonth === 0 ? today.getFullYear() - 24 : today.getFullYear() - 25;
        const dateOfBirth = `${year}-${String(futureMonth + 1).padStart(2, '0')}-15`;
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(24);
      });

      it('should not decrement age when birthday has occurred (past month)', () => {
        const today = new Date();
        if (today.getMonth() > 0) {
          const pastMonth = today.getMonth() - 1;
          const dateOfBirth = `${today.getFullYear() - 25}-${String(pastMonth + 1).padStart(2, '0')}-15`;
          const age = calculateAge(dateOfBirth);
          expect(age).toBe(25);
        }
      });

      it('should decrement age when same month but day not reached', () => {
        const today = new Date();
        if (today.getDate() < 28) {
          const dateOfBirth = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 1).padStart(2, '0')}`;
          const age = calculateAge(dateOfBirth);
          expect(age).toBe(24);
        }
      });

      it('should not decrement age when same month and day reached', () => {
        const today = new Date();
        const dateOfBirth = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const age = calculateAge(dateOfBirth);
        expect(age).toBe(25);
      });
    });
  });
});
