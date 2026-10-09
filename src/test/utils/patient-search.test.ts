import { describe, expect, it } from 'vitest';
import { matchesPatientSearch } from '../../utils/patient-search';

const patient = { patientName: 'Ravi Kumar', openMrsId: '100GL-1' };

describe('matchesPatientSearch', () => {
  it('matches by name, case-insensitive', () => {
    expect(matchesPatientSearch(patient, 'RAVI')).toBe(true);
  });

  it('matches by OpenMRS ID, case-insensitive and partial', () => {
    expect(matchesPatientSearch(patient, '100gl')).toBe(true);
    expect(matchesPatientSearch(patient, 'gl-1')).toBe(true);
  });

  it('trims the search term', () => {
    expect(matchesPatientSearch(patient, '  100GL-1  ')).toBe(true);
  });

  it('matches everything on empty search', () => {
    expect(matchesPatientSearch(patient, '')).toBe(true);
    expect(matchesPatientSearch(patient, '   ')).toBe(true);
  });

  it('returns false when neither name nor ID matches', () => {
    expect(matchesPatientSearch(patient, 'ZZZ-999')).toBe(false);
  });

  it('does not throw when openMrsId is null, as the backend can send, and cannot match on it', () => {
    const p = { patientName: 'Priya Singh', openMrsId: null };
    expect(matchesPatientSearch(p, 'priya')).toBe(true);
    expect(matchesPatientSearch(p, '100GL')).toBe(false);
    expect(matchesPatientSearch(p, '')).toBe(true);
  });

  it('does not throw when openMrsId is missing', () => {
    const p = { patientName: 'Priya Singh' };
    expect(matchesPatientSearch(p, 'priya')).toBe(true);
    expect(matchesPatientSearch(p, '100GL')).toBe(false);
  });
});
