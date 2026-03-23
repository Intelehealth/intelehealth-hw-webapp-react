import { describe, expect, it } from 'vitest';
import {
  hasExclusiveSelected,
  parseYesNoValues,
  toggleAssociatedSymptom,
} from '../../../../modules/ayu-library/logic/associated-symptoms.logic';
import type { AyuQuestion } from '../../../../modules/ayu-library/types/ayu.types';

const EXCLUSIVE_EXT_URL =
  'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice';

/** Helper to build a question with answer options, some marked mutually exclusive. */
function makeQuestion(
  options: { code: string; exclusive?: boolean }[]
): AyuQuestion {
  return {
    linkId: 'test-q',
    type: 'choice',
    answerOption: options.map(opt => ({
      valueCoding: { code: opt.code, display: opt.code },
      ...(opt.exclusive
        ? {
            extension: [
              { url: EXCLUSIVE_EXT_URL, valueString: 'True' },
            ],
          }
        : {}),
    })),
  };
}

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

  describe('mutually exclusive option logic', () => {
    const question = makeQuestion([
      { code: 'HEADACHE' },
      { code: 'FEVER' },
      { code: 'NONE', exclusive: true },
    ]);

    it('should return only the exclusive code when a mutually exclusive option is clicked Yes', () => {
      // Previously had normal options selected; clicking exclusive "NONE" should clear everything
      const result = toggleAssociatedSymptom(
        ['HEADACHE', 'FEVER'],
        [],
        'NONE',
        true,
        question
      );
      expect(result).toEqual(['NONE']);
    });

    it('should remove the exclusive option when a normal option is clicked Yes', () => {
      // Exclusive "NONE" is currently selected; clicking normal "HEADACHE" should remove "NONE"
      const result = toggleAssociatedSymptom(
        ['NONE'],
        [],
        'HEADACHE',
        true,
        question
      );
      expect(result).toContain('HEADACHE');
      expect(result).not.toContain('NONE');
    });

    it('should clear exclusive option and keep existing normal options when a normal option is clicked Yes', () => {
      // Both exclusive and normal options selected; clicking another normal option
      // should clear exclusive but preserve existing normal
      const result = toggleAssociatedSymptom(
        ['NONE', 'HEADACHE'],
        ['FEVER'],
        'FEVER',
        true,
        question
      );
      expect(result).toContain('HEADACHE');
      expect(result).toContain('FEVER');
      expect(result).not.toContain('NONE');
      // FEVER should no longer be negated
      expect(result).not.toContain('NO_FEVER');
    });

    it('should return only the exclusive code even when there are existing no values', () => {
      const result = toggleAssociatedSymptom(
        ['HEADACHE'],
        ['FEVER'],
        'NONE',
        true,
        question
      );
      expect(result).toEqual(['NONE']);
    });

    it('should not apply exclusive logic when isYes is false', () => {
      // Clicking "No" on the exclusive option should use normal toggle logic
      const result = toggleAssociatedSymptom(
        ['HEADACHE'],
        [],
        'NONE',
        false,
        question
      );
      expect(result).toContain('HEADACHE');
      expect(result).toContain('NO_NONE');
    });

    it('should not apply exclusive logic when question is not provided', () => {
      const result = toggleAssociatedSymptom(
        ['HEADACHE', 'FEVER'],
        [],
        'NONE',
        true
      );
      // Without question, it just adds NONE normally
      expect(result).toContain('HEADACHE');
      expect(result).toContain('FEVER');
      expect(result).toContain('NONE');
    });
  });
});

describe('hasExclusiveSelected', () => {
  const question = makeQuestion([
    { code: 'HEADACHE' },
    { code: 'FEVER' },
    { code: 'NONE', exclusive: true },
  ]);

  it('should return true when an exclusive code is in the list', () => {
    expect(hasExclusiveSelected(question, ['HEADACHE', 'NONE'])).toBe(true);
  });

  it('should return true when only the exclusive code is in the list', () => {
    expect(hasExclusiveSelected(question, ['NONE'])).toBe(true);
  });

  it('should return false when no exclusive code is in the list', () => {
    expect(hasExclusiveSelected(question, ['HEADACHE', 'FEVER'])).toBe(false);
  });

  it('should return false for an empty list', () => {
    expect(hasExclusiveSelected(question, [])).toBe(false);
  });

  it('should return false when codes do not match any answer option', () => {
    expect(hasExclusiveSelected(question, ['UNKNOWN_CODE'])).toBe(false);
  });
});
