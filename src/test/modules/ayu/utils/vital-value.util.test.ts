import { describe, expect, it } from 'vitest';
import { normalizeVitalValue } from '../../../../modules/ayu/utils/vital-value.util';

describe('normalizeVitalValue', () => {
  it.each<[unknown, string]>([
    [undefined, 'undefined'],
    [null, 'null'],
    ['', 'an empty string'],
  ])('returns null for %s (%s)', (value, _label) => {
    expect(normalizeVitalValue(value)).toBeNull();
  });

  it('returns finite numbers unchanged, including 0 and negatives', () => {
    expect(normalizeVitalValue(72)).toBe(72);
    expect(normalizeVitalValue(98.6)).toBe(98.6);
    expect(normalizeVitalValue(0)).toBe(0);
    expect(normalizeVitalValue(-1)).toBe(-1);
  });

  it('converts numeric strings to numbers', () => {
    expect(normalizeVitalValue('120')).toBe(120);
    expect(normalizeVitalValue('36.6')).toBe(36.6);
    expect(normalizeVitalValue('0')).toBe(0);
  });

  it('returns null for values that are not usable numbers', () => {
    expect(normalizeVitalValue('abc')).toBeNull();
    expect(normalizeVitalValue(NaN)).toBeNull();
    expect(normalizeVitalValue(Infinity)).toBeNull();
    expect(normalizeVitalValue({})).toBeNull();
  });
});
