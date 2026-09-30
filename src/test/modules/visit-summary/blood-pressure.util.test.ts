import { describe, expect, it } from 'vitest';
import { formatBloodPressure } from '../../../modules/visit-summary/blood-pressure.util';

describe('formatBloodPressure', () => {
  it('shows both readings as systolic/diastolic', () => {
    expect(formatBloodPressure({ systolic: 120, diastolic: 80 })).toBe('120/80');
  });

  it('shows "No information" when neither reading was recorded', () => {
    expect(formatBloodPressure({ systolic: null, diastolic: null })).toBe(
      'No information'
    );
  });

  it('marks a single missing reading with "-"', () => {
    expect(formatBloodPressure({ systolic: 120, diastolic: null })).toBe('120/-');
    expect(formatBloodPressure({ systolic: null, diastolic: 80 })).toBe('-/80');
  });

  it('treats 0 as a recorded reading, not as missing', () => {
    expect(formatBloodPressure({ systolic: 0, diastolic: 0 })).toBe('0/0');
  });
});
