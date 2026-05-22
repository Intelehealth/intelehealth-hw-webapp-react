import { describe, expect, it, vi } from 'vitest';

// Mock county.json with a country that has null dial_code
// This covers the `c.dial_code ?? ''` fallback branch at line 35
vi.mock('../../assets/data/county.json', () => ({
  default: {
    countries: [
      { name: 'India', dial_code: '+91', code: 'IN' },
      { name: 'NullDialCode', dial_code: null, code: 'XX' },
    ],
  },
}));

// Import after mock so DIAL_CODES is built from mocked data
const { getCountryCode } = await import('../../utils/countries');

describe('getCountryCode (null dial_code ?? fallback)', () => {
  it('should handle null dial_code via ?? operator (falls back to empty string)', () => {
    // null ?? '' => '' after replace('+', '') => ''
    // '' matches any string via startsWith, so unrecognized prefix returns ''
    expect(getCountryCode('0001234567890')).toBe('');
  });

  it('should still match India for recognized prefix', () => {
    expect(getCountryCode('911234567890')).toBe('91');
  });
});
