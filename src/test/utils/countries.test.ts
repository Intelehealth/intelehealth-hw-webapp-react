import { describe, expect, it } from 'vitest';
import {
  getAllCountries,
  getCountryByDialCode,
  getCountryByName,
  getCountryCode,
} from '../../utils/countries';

describe('countries.ts', () => {
  describe('getAllCountries', () => {
    it('should return an array of countries', () => {
      const countries = getAllCountries();
      expect(Array.isArray(countries)).toBe(true);
      expect(countries.length).toBeGreaterThan(0);
    });

    it('should return countries with required properties', () => {
      const countries = getAllCountries();
      const firstCountry = countries[0];
      expect(firstCountry).toHaveProperty('name');
      expect(firstCountry).toHaveProperty('dial_code');
      expect(firstCountry).toHaveProperty('code');
    });
  });

  describe('getCountryByName', () => {
    it('should return country for valid name', () => {
      const result = getCountryByName('India');
      expect(result).toBeDefined();
      expect(result?.name).toBe('India');
    });

    it('should return country for case-insensitive name', () => {
      const result = getCountryByName('india');
      expect(result).toBeDefined();
      expect(result?.name).toBe('India');
    });

    it('should return country for uppercase name', () => {
      const result = getCountryByName('INDIA');
      expect(result).toBeDefined();
      expect(result?.name).toBe('India');
    });

    it('should return undefined for invalid country name', () => {
      const result = getCountryByName('NonExistentCountry');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = getCountryByName('');
      expect(result).toBeUndefined();
    });
  });

  describe('getCountryByDialCode', () => {
    it('should return country for valid dial code', () => {
      const result = getCountryByDialCode('+91');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+91');
      expect(result?.name).toBe('India');
    });

    it('should return country for US dial code', () => {
      const result = getCountryByDialCode('+1');
      expect(result).toBeDefined();
      expect(result?.dial_code).toBe('+1');
      expect(['Canada', 'United States']).toContain(result?.name);
    });

    it('should return undefined for invalid dial code', () => {
      const result = getCountryByDialCode('+999');
      expect(result).toBeUndefined();
    });

    it('should return country with empty dial code if exists', () => {
      const result = getCountryByDialCode('');
      // There's a country (Cote d'Ivoire) with empty dial_code in the data
      if (result) {
        expect(result.dial_code).toBe('');
      }
      // The function will return a country if one exists with empty dial_code
      expect(result).toBeDefined();
    });

    it('should return undefined for dial code without plus sign', () => {
      const result = getCountryByDialCode('91');
      expect(result).toBeUndefined();
    });
  });

  describe('getCountryCode', () => {
    it('should return country code for Indian number', () => {
      expect(getCountryCode('911234567890')).toBe('91');
    });

    it('should return country code for US number', () => {
      expect(getCountryCode('11234567890')).toBe('1');
    });

    it('should prefer longer code over shorter (e.g. +44 over +4)', () => {
      // 44 is UK; should match 44 not just 4
      expect(getCountryCode('441234567890')).toBe('44');
    });

    it('should match empty dial code for unrecognized prefix', () => {
      // Data includes a country with empty dial_code, so '' matches any input
      expect(getCountryCode('0001234567890')).toBe('');
    });

    it('should match empty dial code for empty string', () => {
      expect(getCountryCode('')).toBe('');
    });
  });
});

