import { describe, expect, it } from 'vitest';
import type { AyuQuestion } from '../../../../modules/ayu-library/types/ayu.types';
import {
  isEmpty,
  hasVisibleRequiredNestedString,
  hasUnansweredRequiredNestedChild,
  isNestedInputValueMissing,
  isQuantityInvalid,
} from '../../../../modules/ayu-library/logic/validation.logic';

describe('isEmpty', () => {
  it('should return true for undefined', () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  it('should return true for null', () => {
    expect(isEmpty(null)).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isEmpty('')).toBe(true);
  });

  it('should return true for whitespace-only string', () => {
    expect(isEmpty('   ')).toBe(true);
    expect(isEmpty('\t\n')).toBe(true);
  });

  it('should return true for empty array', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('should return false for non-empty string', () => {
    expect(isEmpty('hello')).toBe(false);
  });

  it('should return false for non-empty array', () => {
    expect(isEmpty(['a'])).toBe(false);
  });

  it('should return false for numbers', () => {
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(42)).toBe(false);
  });

  it('should return false for boolean false', () => {
    expect(isEmpty(false)).toBe(false);
  });

  it('should return false for objects', () => {
    expect(isEmpty({})).toBe(false);
  });
});

describe('hasVisibleRequiredNestedString', () => {
  it('should return false for question with no children', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(hasVisibleRequiredNestedString(q, {})).toBe(false);
  });

  it('should return false when child is not a string type', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'integer' }],
    };
    expect(hasVisibleRequiredNestedString(q, {})).toBe(false);
  });

  it('should return true when visible string child has no answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'string' }],
    };
    expect(hasVisibleRequiredNestedString(q, { q1: 'yes' })).toBe(true);
  });

  it('should return false when visible string child has an answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'string' }],
    };
    expect(hasVisibleRequiredNestedString(q, { q1: 'yes', 'q1.1': 'filled' })).toBe(false);
  });

  it('should return false when string child is hidden by enableWhen', () => {
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
    // parent answer is 'no', child is hidden
    expect(hasVisibleRequiredNestedString(q, { q1: 'no' })).toBe(false);
  });

  it('should return true when string child is visible and empty', () => {
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
    expect(hasVisibleRequiredNestedString(q, { q1: 'yes' })).toBe(true);
  });
});

describe('hasUnansweredRequiredNestedChild', () => {
  it('should return false for question with no children', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(hasUnansweredRequiredNestedChild(q, {})).toBe(false);
  });

  it('should return true when required child has no answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'string', required: true }],
    };
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes' })).toBe(true);
  });

  it('should return false when required child has an answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'string', required: true }],
    };
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes', 'q1.1': 'filled' })).toBe(false);
  });

  it('should return true when repeats child has no answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'choice', repeats: true }],
    };
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes' })).toBe(true);
  });

  it('should return false when hidden child has no answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'string',
          required: true,
          enableWhen: [
            { question: 'q1', operator: '=', answerCoding: { code: 'yes' } },
          ],
        },
      ],
    };
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'no' })).toBe(false);
  });

  it('should return true when visible input-type child (integer) has no answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'integer' }],
    };
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes' })).toBe(true);
  });

  it('should return true when visible input-type child (quantity) has no answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'quantity' }],
    };
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes' })).toBe(true);
  });

  it('should recurse into grandchildren and return true when unanswered', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            { linkId: 'opt1-detail', type: 'string' },
          ],
        },
      ],
    };
    // q1.1 is answered with 'opt1', grandchild 'opt1-detail' is unanswered
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes', 'q1.1': 'opt1' })).toBe(true);
  });

  it('should not check grandchild when its matching answerOption is not selected', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
            { valueCoding: { code: 'opt2', display: 'Option 2' } },
          ],
          item: [
            { linkId: 'opt1-detail', type: 'string' },
          ],
        },
      ],
    };
    // opt2 is selected, grandchild 'opt1-detail' maps to opt1, so should not validate
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes', 'q1.1': 'opt2' })).toBe(false);
  });

  it('should handle array answer for selectedCodes in grandchild check', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            { linkId: 'opt1-detail', type: 'string' },
          ],
        },
      ],
    };
    // Array answer - covers the Array.isArray branch
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes', 'q1.1': ['opt1'] })).toBe(true);
  });

  it('should handle undefined/non-string answer for selectedCodes (empty array fallback)', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            { linkId: 'opt1-detail', type: 'string' },
          ],
        },
      ],
    };
    // No answer for q1.1 — selectedCodes is [], grandchild's matching option not selected, so skipped
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes' })).toBe(false);
  });

  it('should validate grandchild with no matching answerOption', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          // No answerOption defined, so matchingOption is undefined
          item: [
            { linkId: 'detail', type: 'integer' },
          ],
        },
      ],
    };
    // Grandchild has no matching answerOption, so it is always validated
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes', 'q1.1': 'val' })).toBe(true);
  });

  it('should return false when grandchild is answered', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            { linkId: 'opt1-detail', type: 'string' },
          ],
        },
      ],
    };
    expect(hasUnansweredRequiredNestedChild(q, {
      q1: 'yes',
      'q1.1': 'opt1',
      'opt1-detail': 'filled',
    })).toBe(false);
  });

  it('should return false for grandchild that is not an input type', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          item: [
            { linkId: 'q1.1.1', type: 'choice' }, // Not an input type
          ],
        },
      ],
    };
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes', 'q1.1': 'val' })).toBe(false);
  });
});

describe('isNestedInputValueMissing', () => {
  it('should return false for question with no children', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(isNestedInputValueMissing(q, {})).toBe(false);
  });

  it('should return true when visible string child has no answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'string' }],
    };
    expect(isNestedInputValueMissing(q, { q1: 'yes' })).toBe(true);
  });

  it('should return true when visible integer child has no answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'integer' }],
    };
    expect(isNestedInputValueMissing(q, { q1: 'yes' })).toBe(true);
  });

  it('should return false when hidden child has no answer', () => {
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
    expect(isNestedInputValueMissing(q, { q1: 'no' })).toBe(false);
  });

  it('should check grandchildren for missing input values', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            { linkId: 'opt1-detail', type: 'string' },
          ],
        },
      ],
    };
    expect(isNestedInputValueMissing(q, { q1: 'yes', 'q1.1': 'opt1' })).toBe(true);
  });

  it('should not check grandchild when matching answerOption is not selected', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            { linkId: 'opt1-detail', type: 'string' },
          ],
        },
      ],
    };
    expect(isNestedInputValueMissing(q, { q1: 'yes', 'q1.1': 'opt2' })).toBe(false);
  });

  it('should handle array answer for selectedCodes in grandchild check', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            { linkId: 'opt1-detail', type: 'string' },
          ],
        },
      ],
    };
    // Array answer - covers Array.isArray branch
    expect(isNestedInputValueMissing(q, { q1: 'yes', 'q1.1': ['opt1'] })).toBe(true);
  });

  it('should handle undefined answer for selectedCodes (empty array fallback)', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            { linkId: 'opt1-detail', type: 'string' },
          ],
        },
      ],
    };
    // No answer for q1.1 — selectedCodes is [], grandchild's matching option not selected, so skipped
    expect(isNestedInputValueMissing(q, { q1: 'yes' })).toBe(false);
  });

  it('should validate grandchild with no matching answerOption', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          // No answerOption — matchingOption is undefined, grandchild always validated
          item: [
            { linkId: 'detail', type: 'quantity' },
          ],
        },
      ],
    };
    expect(isNestedInputValueMissing(q, { q1: 'yes', 'q1.1': 'val' })).toBe(true);
  });

  it('should return false when grandchild is answered', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            { linkId: 'opt1-detail', type: 'string' },
          ],
        },
      ],
    };
    expect(isNestedInputValueMissing(q, {
      q1: 'yes',
      'q1.1': 'opt1',
      'opt1-detail': 'filled',
    })).toBe(false);
  });

  it('should return false for grandchild that is not an input type', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          item: [
            { linkId: 'q1.1.1', type: 'choice' }, // Not an input type
          ],
        },
      ],
    };
    expect(isNestedInputValueMissing(q, { q1: 'yes', 'q1.1': 'val' })).toBe(false);
  });

  it('should return false when child has no nested items', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice', // Not an input type, no child.item
        },
      ],
    };
    expect(isNestedInputValueMissing(q, { q1: 'yes', 'q1.1': 'val' })).toBe(false);
  });
});

describe('isQuantityInvalid', () => {
  it('should return false for non-quantity/choice types', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'string' };
    expect(isQuantityInvalid(q, { q1: 'text' })).toBe(false);
  });

  it('should return true when quantity has no answer', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'quantity' };
    expect(isQuantityInvalid(q, {})).toBe(true);
  });

  it('should return false for choice with no answer', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(isQuantityInvalid(q, {})).toBe(false);
  });

  it('should return false for choice with plain string answer', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(isQuantityInvalid(q, { q1: 'code1' })).toBe(false);
  });

  it('should return true when duration is missing days', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'quantity' };
    expect(
      isQuantityInvalid(q, {
        q1: { dropdownValues: { number: 5 } },
      })
    ).toBe(true);
  });

  it('should return true when duration is missing number', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'quantity' };
    expect(
      isQuantityInvalid(q, {
        q1: { dropdownValues: { days: 'days' } },
      })
    ).toBe(true);
  });

  it('should return false when duration has both number and days', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'quantity' };
    expect(
      isQuantityInvalid(q, {
        q1: { dropdownValues: { number: 5, days: 'days' } },
      })
    ).toBe(false);
  });

  it('should check nested child duration validity for choice type', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'choice' }],
    };
    expect(
      isQuantityInvalid(q, {
        q1: 'yes',
        'q1.1': { dropdownValues: { number: 5 } },
      })
    ).toBe(true);
  });

  it('should check grandchild duration validity', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          item: [{ linkId: 'q1.1.1', type: 'choice' }],
        },
      ],
    };
    expect(
      isQuantityInvalid(q, {
        q1: 'yes',
        'q1.1.1': { dropdownValues: { number: 5 } },
      })
    ).toBe(true);
  });
});
