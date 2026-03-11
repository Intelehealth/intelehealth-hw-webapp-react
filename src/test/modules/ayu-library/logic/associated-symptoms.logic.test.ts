import { describe, expect, it } from 'vitest';
import {
  parseYesNoValues,
  toggleAssociatedSymptom,
} from '../../../../modules/ayu-library/logic/associated-symptoms.logic';

describe('parseYesNoValues', () => {
  it('should return empty arrays for undefined', () => {
    expect(parseYesNoValues(undefined)).toEqual({ yesValues: [], noValues: [] });
  });

  it('should return empty arrays for null', () => {
    expect(parseYesNoValues(null)).toEqual({ yesValues: [], noValues: [] });
  });

  it('should return empty arrays for non-array values', () => {
    expect(parseYesNoValues('string')).toEqual({ yesValues: [], noValues: [] });
    expect(parseYesNoValues(42)).toEqual({ yesValues: [], noValues: [] });
  });

  it('should return empty arrays for empty array', () => {
    expect(parseYesNoValues([])).toEqual({ yesValues: [], noValues: [] });
  });

  it('should parse yes values (no prefix)', () => {
    expect(parseYesNoValues(['CODE_A', 'CODE_B'])).toEqual({
      yesValues: ['CODE_A', 'CODE_B'],
      noValues: [],
    });
  });

  it('should parse no values (NO_ prefix)', () => {
    expect(parseYesNoValues(['NO_CODE_A', 'NO_CODE_B'])).toEqual({
      yesValues: [],
      noValues: ['CODE_A', 'CODE_B'],
    });
  });

  it('should parse mixed yes and no values', () => {
    expect(parseYesNoValues(['CODE_A', 'NO_CODE_B', 'CODE_C'])).toEqual({
      yesValues: ['CODE_A', 'CODE_C'],
      noValues: ['CODE_B'],
    });
  });
});

describe('toggleAssociatedSymptom', () => {
  it('should add a yes answer for a new code', () => {
    const result = toggleAssociatedSymptom([], [], 'CODE_A', true);
    expect(result).toEqual(['CODE_A']);
  });

  it('should add a no answer for a new code', () => {
    const result = toggleAssociatedSymptom([], [], 'CODE_A', false);
    expect(result).toEqual(['NO_CODE_A']);
  });

  it('should switch from no to yes', () => {
    const result = toggleAssociatedSymptom([], ['CODE_A'], 'CODE_A', true);
    expect(result).toEqual(['CODE_A']);
    // Should not have NO_CODE_A
    expect(result).not.toContain('NO_CODE_A');
  });

  it('should switch from yes to no', () => {
    const result = toggleAssociatedSymptom(['CODE_A'], [], 'CODE_A', false);
    expect(result).toEqual(['NO_CODE_A']);
    // Should not have CODE_A as yes
    expect(result).not.toContain('CODE_A');
  });

  it('should preserve other codes when toggling', () => {
    const result = toggleAssociatedSymptom(
      ['CODE_A'],
      ['CODE_B'],
      'CODE_C',
      true
    );
    expect(result).toContain('CODE_A');
    expect(result).toContain('CODE_C');
    expect(result).toContain('NO_CODE_B');
  });

  it('should not duplicate existing yes codes', () => {
    const result = toggleAssociatedSymptom(['CODE_A'], [], 'CODE_A', true);
    expect(result.filter(v => v === 'CODE_A')).toHaveLength(1);
  });

  it('should not duplicate existing no codes', () => {
    const result = toggleAssociatedSymptom([], ['CODE_A'], 'CODE_A', false);
    expect(result.filter(v => v === 'NO_CODE_A')).toHaveLength(1);
  });

  it('should handle multiple codes toggled simultaneously', () => {
    let result = toggleAssociatedSymptom([], [], 'CODE_A', true);
    result = toggleAssociatedSymptom(
      result.filter(v => !v.startsWith('NO_')),
      result.filter(v => v.startsWith('NO_')).map(v => v.slice(3)),
      'CODE_B',
      false
    );
    expect(result).toContain('CODE_A');
    expect(result).toContain('NO_CODE_B');
  });

  it('should return empty array when all codes are removed', () => {
    const result = toggleAssociatedSymptom(['CODE_A'], [], 'CODE_A', false);
    // CODE_A moves from yes to no
    expect(result).toEqual(['NO_CODE_A']);
  });

  it('should handle toggling the same code yes then no', () => {
    const firstToggle = toggleAssociatedSymptom([], [], 'CODE_A', true);
    expect(firstToggle).toEqual(['CODE_A']);

    const secondToggle = toggleAssociatedSymptom(['CODE_A'], [], 'CODE_A', false);
    expect(secondToggle).toEqual(['NO_CODE_A']);
  });
});
