import { describe, expect, it } from 'vitest';
import { evaluateEnableWhen } from '../../../../modules/ayu-library/logic/enable-when.logic';

describe('evaluateEnableWhen', () => {
  it('should return true when enableWhen is undefined', () => {
    expect(evaluateEnableWhen(undefined, {})).toBe(true);
  });

  it('should return true when enableWhen is empty array', () => {
    expect(evaluateEnableWhen([], {})).toBe(true);
  });

  it('should match answerString condition', () => {
    const rules = [
      { question: 'q1', operator: '=', answerString: 'yes' },
    ];
    expect(evaluateEnableWhen(rules, { q1: 'yes' })).toBe(true);
    expect(evaluateEnableWhen(rules, { q1: 'no' })).toBe(false);
  });

  it('should match answerBoolean condition', () => {
    const rules = [
      { question: 'q1', operator: '=', answerBoolean: true },
    ];
    expect(evaluateEnableWhen(rules, { q1: true })).toBe(true);
    expect(evaluateEnableWhen(rules, { q1: false })).toBe(false);
  });

  it('should match answerInteger condition', () => {
    const rules = [
      { question: 'q1', operator: '=', answerInteger: 42 },
    ];
    expect(evaluateEnableWhen(rules, { q1: 42 })).toBe(true);
    expect(evaluateEnableWhen(rules, { q1: 0 })).toBe(false);
  });

  it('should match answerCoding code condition', () => {
    const rules = [
      {
        question: 'q1',
        operator: '=',
        answerCoding: { code: 'CODE_A', display: 'Code A' },
      },
    ];
    expect(evaluateEnableWhen(rules, { q1: 'CODE_A' })).toBe(true);
    expect(evaluateEnableWhen(rules, { q1: 'CODE_B' })).toBe(false);
  });

  it('should require ALL conditions to be met (AND logic)', () => {
    const rules = [
      { question: 'q1', operator: '=', answerString: 'yes' },
      { question: 'q2', operator: '=', answerString: 'no' },
    ];
    expect(evaluateEnableWhen(rules, { q1: 'yes', q2: 'no' })).toBe(true);
    expect(evaluateEnableWhen(rules, { q1: 'yes', q2: 'yes' })).toBe(false);
    expect(evaluateEnableWhen(rules, { q1: 'no', q2: 'no' })).toBe(false);
  });

  it('should return false when answer is missing', () => {
    const rules = [
      { question: 'q1', operator: '=', answerString: 'yes' },
    ];
    expect(evaluateEnableWhen(rules, {})).toBe(false);
  });

  it('should match against array parent answers (multi-select)', () => {
    const rules = [
      {
        question: 'q1',
        operator: '=',
        answerCoding: { code: 'CODE_A' },
      },
    ];
    expect(evaluateEnableWhen(rules, { q1: ['CODE_A', 'CODE_B'] })).toBe(true);
    expect(evaluateEnableWhen(rules, { q1: ['CODE_C'] })).toBe(false);
  });

  it('should prioritize answerBoolean over answerString', () => {
    // answerBoolean is checked first via ??
    const rules = [
      {
        question: 'q1',
        operator: '=',
        answerBoolean: false,
        answerString: 'yes',
      },
    ];
    expect(evaluateEnableWhen(rules, { q1: false })).toBe(true);
    expect(evaluateEnableWhen(rules, { q1: 'yes' })).toBe(false);
  });

  describe('operator: "!="', () => {
    it('should return true when scalar answer does not equal expected', () => {
      const rules = [{ question: 'q1', operator: '!=', answerCoding: { code: 'NO' } }];
      expect(evaluateEnableWhen(rules, { q1: 'YES' })).toBe(true);
      expect(evaluateEnableWhen(rules, { q1: 'NO' })).toBe(false);
    });

    it('should return true when answer is missing (undefined !== expected)', () => {
      const rules = [{ question: 'q1', operator: '!=', answerCoding: { code: 'NO' } }];
      expect(evaluateEnableWhen(rules, {})).toBe(true);
    });

    it('should return true for array answer when expected code is not included', () => {
      const rules = [{ question: 'q1', operator: '!=', answerCoding: { code: 'CODE_A' } }];
      expect(evaluateEnableWhen(rules, { q1: ['CODE_B', 'CODE_C'] })).toBe(true);
      expect(evaluateEnableWhen(rules, { q1: ['CODE_A', 'CODE_B'] })).toBe(false);
    });

    it('should return false when answerString inequality matches', () => {
      const rules = [{ question: 'q1', operator: '!=', answerString: 'no' }];
      expect(evaluateEnableWhen(rules, { q1: 'yes' })).toBe(true);
      expect(evaluateEnableWhen(rules, { q1: 'no' })).toBe(false);
    });
  });

  describe('operator: "exists"', () => {
    it('should return true when answer exists and answerBoolean is true', () => {
      const rules = [{ question: 'q1', operator: 'exists', answerBoolean: true }];
      expect(evaluateEnableWhen(rules, { q1: 'YES' })).toBe(true);
      expect(evaluateEnableWhen(rules, { q1: 'NO' })).toBe(true);
    });

    it('should return false when answer is missing and answerBoolean is true', () => {
      const rules = [{ question: 'q1', operator: 'exists', answerBoolean: true }];
      expect(evaluateEnableWhen(rules, {})).toBe(false);
    });

    it('should return true when answer is missing and answerBoolean is false (does not exist)', () => {
      const rules = [{ question: 'q1', operator: 'exists', answerBoolean: false }];
      expect(evaluateEnableWhen(rules, {})).toBe(true);
      expect(evaluateEnableWhen(rules, { q1: 'YES' })).toBe(false);
    });

    it('should treat empty string as not existing', () => {
      const rules = [{ question: 'q1', operator: 'exists', answerBoolean: true }];
      expect(evaluateEnableWhen(rules, { q1: '' })).toBe(false);
    });

    it('should treat empty array as not existing', () => {
      const rules = [{ question: 'q1', operator: 'exists', answerBoolean: true }];
      expect(evaluateEnableWhen(rules, { q1: [] })).toBe(false);
    });

    it('should treat non-empty array as existing', () => {
      const rules = [{ question: 'q1', operator: 'exists', answerBoolean: true }];
      expect(evaluateEnableWhen(rules, { q1: ['CODE_A'] })).toBe(true);
    });

    it('should show sibling fields when parent yes/no question is answered', () => {
      // Simulates Sleep Disorder Q8: To/Event have exists on Q8 linkId
      const rules = [{ question: 'q8', operator: 'exists', answerBoolean: true }];
      // After selecting Yes for Q8, both To and Event should become visible
      expect(evaluateEnableWhen(rules, { q8: 'YES' })).toBe(true);
      expect(evaluateEnableWhen(rules, { q8: 'NO' })).toBe(true);
      expect(evaluateEnableWhen(rules, {})).toBe(false);
    });
  });
});
