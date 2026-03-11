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
});
