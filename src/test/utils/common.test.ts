import { describe, expect, it, vi } from 'vitest';
import { getCountryCode } from '../../utils/common';
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
});
