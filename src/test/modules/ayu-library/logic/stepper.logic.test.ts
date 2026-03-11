import { describe, expect, it } from 'vitest';
import type { AyuQuestion } from '../../../../modules/ayu-library/types/ayu.types';
import {
  isDurationAnswer,
  isMutuallyExclusiveOption,
  computeMultiSelectToggle,
  isTopLevelComplete,
} from '../../../../modules/ayu-library/logic/stepper.logic';

describe('isDurationAnswer', () => {
  it('should return true for objects with dropdownValues', () => {
    expect(isDurationAnswer({ dropdownValues: { number: 5, days: 'days' } })).toBe(true);
  });

  it('should return true for objects with empty dropdownValues', () => {
    expect(isDurationAnswer({ dropdownValues: {} })).toBe(true);
  });

  it('should return false for null', () => {
    expect(isDurationAnswer(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isDurationAnswer(undefined)).toBe(false);
  });

  it('should return false for strings', () => {
    expect(isDurationAnswer('hello')).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isDurationAnswer(['a', 'b'])).toBe(false);
  });

  it('should return false for objects without dropdownValues', () => {
    expect(isDurationAnswer({ value: 5 })).toBe(false);
  });
});

describe('isMutuallyExclusiveOption', () => {
  const question: AyuQuestion = {
    linkId: 'q1',
    type: 'choice',
    repeats: true,
    answerOption: [
      {
        valueCoding: { code: 'normal', display: 'Normal' },
        extension: [
          {
            url: 'urn:intelehealth:mutually-exclusive',
            valueBoolean: true,
          },
        ],
      },
      {
        valueCoding: { code: 'optA', display: 'Option A' },
      },
      {
        valueCoding: { code: 'optB', display: 'Option B' },
      },
    ],
  };

  it('should return true for options with mutually-exclusive extension', () => {
    expect(isMutuallyExclusiveOption(question, 'normal')).toBe(true);
  });

  it('should return false for options without mutually-exclusive extension', () => {
    expect(isMutuallyExclusiveOption(question, 'optA')).toBe(false);
    expect(isMutuallyExclusiveOption(question, 'optB')).toBe(false);
  });

  it('should return false for unknown option codes', () => {
    expect(isMutuallyExclusiveOption(question, 'unknown')).toBe(false);
  });

  it('should return false when question has no answerOptions', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(isMutuallyExclusiveOption(q, 'any')).toBe(false);
  });
});

describe('computeMultiSelectToggle', () => {
  const question: AyuQuestion = {
    linkId: 'q1',
    type: 'choice',
    repeats: true,
    answerOption: [
      {
        valueCoding: { code: 'none', display: 'None' },
        extension: [
          { url: 'urn:intelehealth:mutually-exclusive', valueBoolean: true },
        ],
      },
      { valueCoding: { code: 'a', display: 'A' } },
      { valueCoding: { code: 'b', display: 'B' } },
      { valueCoding: { code: 'c', display: 'C' } },
    ],
  };

  it('should add a normal option to empty array', () => {
    expect(computeMultiSelectToggle(question, [], 'a')).toEqual(['a']);
  });

  it('should add a normal option to existing array', () => {
    expect(computeMultiSelectToggle(question, ['a'], 'b')).toEqual(['a', 'b']);
  });

  it('should remove a normal option if already selected', () => {
    expect(computeMultiSelectToggle(question, ['a', 'b'], 'a')).toEqual(['b']);
  });

  it('should replace all with exclusive option', () => {
    expect(computeMultiSelectToggle(question, ['a', 'b'], 'none')).toEqual(['none']);
  });

  it('should deselect exclusive option if already selected', () => {
    expect(computeMultiSelectToggle(question, ['none'], 'none')).toEqual([]);
  });

  it('should remove exclusive options when normal option is selected', () => {
    expect(computeMultiSelectToggle(question, ['none'], 'a')).toEqual(['a']);
  });
});

describe('isTopLevelComplete', () => {
  it('should return false when parent has no answer', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(isTopLevelComplete(q, {})).toBe(false);
  });

  it('should return true for simple answered question with no children', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(isTopLevelComplete(q, { q1: 'code1' })).toBe(true);
  });

  it('should return false for repeats question with empty array', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice', repeats: true };
    expect(isTopLevelComplete(q, { q1: [] })).toBe(false);
  });

  it('should return true for repeats question with values', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice', repeats: true };
    expect(isTopLevelComplete(q, { q1: ['a', 'b'] })).toBe(true);
  });

  it('should check visible nested children are answered', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'string',
          enableWhen: [
            { question: 'q1', operator: '=', answerCoding: { code: 'yes' } },
          ],
        },
      ],
    };
    // Child visible but unanswered
    expect(isTopLevelComplete(q, { q1: 'yes' })).toBe(false);
    // Child visible and answered
    expect(isTopLevelComplete(q, { q1: 'yes', 'q1.1': 'answer' })).toBe(true);
  });

  it('should skip hidden nested children', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'string',
          enableWhen: [
            { question: 'q1', operator: '=', answerCoding: { code: 'yes' } },
          ],
        },
      ],
    };
    // Answer is 'no', so child is hidden → complete
    expect(isTopLevelComplete(q, { q1: 'no' })).toBe(true);
  });

  it('should return false when duration child is incomplete', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        { linkId: 'q1.1', type: 'choice' },
      ],
    };
    // Duration child with only number, missing days
    expect(
      isTopLevelComplete(q, {
        q1: 'yes',
        'q1.1': { dropdownValues: { number: 5 } },
      })
    ).toBe(false);
  });

  it('should return true when duration child is complete', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        { linkId: 'q1.1', type: 'choice' },
      ],
    };
    expect(
      isTopLevelComplete(q, {
        q1: 'yes',
        'q1.1': { dropdownValues: { number: 5, days: 'days' } },
      })
    ).toBe(true);
  });

  it('should return false when top-level is incomplete duration', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(
      isTopLevelComplete(q, {
        q1: { dropdownValues: { number: 5 } },
      })
    ).toBe(false);
  });
});
