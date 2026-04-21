import { describe, expect, it, vi } from 'vitest';

// Mock county.json with only one country (no empty dial_code)
vi.mock('../../assets/data/county.json', () => ({
  default: {
    countries: [
      { name: 'India', dial_code: '+91', code: 'IN' },
    ],
  },
}));

// Import after mock so DIAL_CODES is built from mocked data
const { getCountryCode } = await import('../../utils/countries');

describe('getCountryCode (no empty dial_code)', () => {
  it('should return null when no code matches', () => {
    expect(getCountryCode('0001234567890')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(getCountryCode('')).toBeNull();
  });
});
