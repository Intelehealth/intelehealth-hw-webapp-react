import { describe, expect, it } from 'vitest';
import { countries } from './countries';

describe('countries data', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(countries)).toBe(true);
    expect(countries.length).toBeGreaterThan(0);
  });

  it('has entries with name, code, and dial_code fields', () => {
    for (const c of countries) {
      expect(typeof c.name).toBe('string');
      expect(c.name.length).toBeGreaterThan(0);
      expect(typeof c.code).toBe('string');
      expect(c.code.length).toBe(2); // ISO-3166 alpha-2
      expect(typeof c.dial_code).toBe('string');
      expect(c.dial_code.startsWith('+')).toBe(true);
      expect(/^[+][0-9]+$/.test(c.dial_code)).toBe(true);
    }
  });

  it('has unique country codes', () => {
    const codes = countries.map(c => c.code);
    const set = new Set(codes);
    expect(set.size).toBe(codes.length);
  });

  it('lookup by code returns the correct country', () => {
    const byCode = (code: string) => countries.find(c => c.code === code);

    expect(byCode('in')?.name).toBe('India');
    expect(byCode('us')?.name).toBe('United States');
    expect(byCode('gb')?.name).toBe('United Kingdom');
    expect(byCode('ca')?.name).toBe('Canada');
    expect(byCode('au')?.name).toBe('Australia');
  });

  it('allows multiple countries to share the same dial_code', () => {
    const codeMap = new Map<string, number>();
    for (const c of countries) {
      codeMap.set(c.dial_code, (codeMap.get(c.dial_code) || 0) + 1);
    }
    // Example: United States and Canada share +1
    expect((codeMap.get('+1') || 0) >= 2).toBe(true);
  });
});
