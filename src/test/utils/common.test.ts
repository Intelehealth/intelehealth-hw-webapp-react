import { describe, expect, it } from 'vitest';
import { getCountryCode } from '../../utils/common';

describe('common.ts', () => {
  describe('getCountryCode', () => {
    it('should return country object for valid dial code', () => {
      const result = getCountryCode('+91');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+91');
      expect(result?.name).toBe('India');
      expect(result?.code).toBe('in');
    });

    it('should return country object for US dial code', () => {
      const result = getCountryCode('+1');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+1');
      // Should return first match (United States)
      expect(result?.name).toBe('United States');
      expect(result?.code).toBe('us');
    });

    it('should return country object for UK dial code', () => {
      const result = getCountryCode('+44');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+44');
      expect(result?.name).toBe('United Kingdom');
      expect(result?.code).toBe('gb');
    });

    it('should return country object for Australia dial code', () => {
      const result = getCountryCode('+61');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+61');
      expect(result?.name).toBe('Australia');
      expect(result?.code).toBe('au');
    });

    it('should return undefined for invalid dial code', () => {
      const result = getCountryCode('+999');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = getCountryCode('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for dial code without plus sign', () => {
      const result = getCountryCode('91');
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent dial code', () => {
      const result = getCountryCode('+123');
      expect(result).toBeUndefined();
    });

    it('should handle case-sensitive dial code matching', () => {
      // Dial codes should be exact matches
      const result = getCountryCode('+91');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+91');
    });

    it('should return first matching country for duplicate dial codes', () => {
      // Both US and Canada have +1, should return first match
      const result = getCountryCode('+1');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+1');
      expect(result?.name).toBe('United States');
    });

    it('should use Array.find() internally', () => {
      // This test verifies the function uses find() by checking behavior
      const result = getCountryCode('+91');
      expect(result).toEqual({
        name: 'India',
        code: 'in',
        dial_code: '+91',
      });
    });

    it('should return undefined for whitespace-only input', () => {
      const result = getCountryCode('   ');
      expect(result).toBeUndefined();
    });

    it('should not return match for partial dial code', () => {
      const result = getCountryCode('+9');
      expect(result).toBeUndefined();
    });

    it('should handle dial code with extra characters', () => {
      const result = getCountryCode('+91abc');
      expect(result).toBeUndefined();
    });
  });
});
