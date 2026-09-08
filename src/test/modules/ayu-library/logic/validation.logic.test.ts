import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AyuQuestion } from '../../../../modules/ayu-library/types/ayu.types';
// Mock decision-matrix and associated-symptoms — only used by validateQuestion
vi.mock('../../../../modules/ayu-library/logic/decision-matrix', () => ({
  ASSOCIATED_SYMPTOMS_COMPONENT: 'associatedSymptoms',
  resolveAyuComponent: vi.fn(() => 'select'),
  isStrictAssociatedSymptoms: vi.fn(() => false),
  isPhysicalExamOptionsQuestion: vi.fn(() => false),
}));

vi.mock(
  '../../../../modules/ayu-library/logic/associated-symptoms.logic',
  async importOriginal => ({
    ...(await importOriginal<
      typeof import('../../../../modules/ayu-library/logic/associated-symptoms.logic')
    >()),
    hasExclusiveSelected: vi.fn(() => false),
  })
);

import { hasExclusiveSelected } from '../../../../modules/ayu-library/logic/associated-symptoms.logic';
import {
  isPhysicalExamOptionsQuestion,
  isStrictAssociatedSymptoms,
  resolveAyuComponent,
} from '../../../../modules/ayu-library/logic/decision-matrix';
import {
  findOutOfRangeQuestionText,
  hasMissingNestedBPInput,
  hasNestedOutOfRangeValue,
  hasUnansweredRequiredNestedChild,
  hasVisibleRequiredNestedString,
  isEmpty,
  isNestedInputValueMissing,
  isNumericOutOfRange,
  isQuantityInvalid,
  validateQuestion,
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

  it('should return false when repeats child has an answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'choice', repeats: true }],
    };
    expect(hasUnansweredRequiredNestedChild(q, { q1: 'yes', 'q1.1': ['opt1'] })).toBe(false);
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

  it('should return true when visible input-type child (date) has no answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'date' }],
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

  describe('isIntermediateChoice (single-option gateway bypass)', () => {
    it('should skip required/repeats validation for a single-option non-repeats gateway child', () => {
      const q: AyuQuestion = {
        linkId: 'parent',
        type: 'choice',
        item: [
          {
            linkId: 'gateway',
            type: 'choice',
            required: true,
            repeats: false,
            answerOption: [{ valueCoding: { code: 'event', display: 'Event' } }],
            item: [{ linkId: 'gateway-detail', type: 'string' }],
          },
        ],
      };
      expect(hasUnansweredRequiredNestedChild(q, { parent: 'yes' })).toBe(true);
      expect(hasUnansweredRequiredNestedChild(q, { parent: 'yes', 'gateway-detail': 'filled' })).toBe(false);
    });

    it('should validate normally for a multi-option (2+) non-repeats choice child', () => {
      const q: AyuQuestion = {
        linkId: 'parent',
        type: 'choice',
        item: [
          {
            linkId: 'age-question',
            type: 'choice',
            required: true,
            repeats: false,
            answerOption: [
              { valueCoding: { code: 'lt40', display: 'Less than 40' } },
              { valueCoding: { code: 'gt40', display: 'More than 40' } },
            ],
          },
        ],
      };
      expect(hasUnansweredRequiredNestedChild(q, { parent: 'yes' })).toBe(true);
      expect(hasUnansweredRequiredNestedChild(q, { parent: 'yes', 'age-question': 'lt40' })).toBe(false);
    });

    it('should validate normally for a repeats:true child regardless of answerOption count', () => {
      const q: AyuQuestion = {
        linkId: 'parent',
        type: 'choice',
        item: [
          {
            linkId: 'medication',
            type: 'choice',
            required: true,
            repeats: true,
            answerOption: [{ valueCoding: { code: 'MED1', display: 'Medication 1' } }],
            item: [{ linkId: 'med1-start', type: 'date' }],
          },
        ],
      };
      expect(hasUnansweredRequiredNestedChild(q, { parent: 'yes' })).toBe(true);
    });
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

  it('should return true when visible date child has no answer', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'date' }],
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

describe('isNumericOutOfRange', () => {
  it('should return false for non-integer/non-string types', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(isNumericOutOfRange(q, { q1: 'text' })).toBe(false);
  });

  it('should return false for string type with non-numeric answer', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'string' };
    expect(isNumericOutOfRange(q, { q1: 'abc' })).toBe(false);
  });

  it('should return false for string type with empty string answer', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'string' };
    expect(isNumericOutOfRange(q, { q1: '' })).toBe(false);
  });

  it('should return false for string type with whitespace-only answer', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'string', text: 'Enter systolic BP' };
    expect(isNumericOutOfRange(q, { q1: '  ' })).toBe(false);
  });

  it('should return false when answer is not a number', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'integer' };
    expect(isNumericOutOfRange(q, { q1: 'text' })).toBe(false);
  });

  it('should return false when no extensions are set', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'integer' };
    expect(isNumericOutOfRange(q, { q1: 120 })).toBe(false);
  });

  it('should return false when value is within range', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'integer',
      extension: [
        { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
        { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
      ],
    };
    expect(isNumericOutOfRange(q, { q1: 120 })).toBe(false);
  });

  it('should return false when value equals min boundary', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'integer',
      extension: [
        { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
        { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
      ],
    };
    expect(isNumericOutOfRange(q, { q1: 60 })).toBe(false);
  });

  it('should return false when value equals max boundary', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'integer',
      extension: [
        { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
        { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
      ],
    };
    expect(isNumericOutOfRange(q, { q1: 260 })).toBe(false);
  });

  it('should return true when value is below min', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'integer',
      extension: [
        { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
        { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
      ],
    };
    expect(isNumericOutOfRange(q, { q1: 50 })).toBe(true);
  });

  it('should return true when value is above max', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'integer',
      extension: [
        { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
        { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
      ],
    };
    expect(isNumericOutOfRange(q, { q1: 300 })).toBe(true);
  });

  it('should check only min when max is not set', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'integer',
      extension: [
        { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
      ],
    };
    expect(isNumericOutOfRange(q, { q1: 50 })).toBe(true);
    expect(isNumericOutOfRange(q, { q1: 999 })).toBe(false);
  });

  it('should check only max when min is not set', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'integer',
      extension: [
        { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
      ],
    };
    expect(isNumericOutOfRange(q, { q1: 300 })).toBe(true);
    expect(isNumericOutOfRange(q, { q1: -10 })).toBe(false);
  });

  describe('BP text-based fallback', () => {
    it('should return true for integer systolic value below 60 (no extensions)', () => {
      const q: AyuQuestion = { linkId: 's1', type: 'integer', text: 'Enter systolic BP' };
      expect(isNumericOutOfRange(q, { s1: 50 })).toBe(true);
    });

    it('should return true for integer systolic value above 260 (no extensions)', () => {
      const q: AyuQuestion = { linkId: 's1', type: 'integer', text: 'Enter systolic BP' };
      expect(isNumericOutOfRange(q, { s1: 300 })).toBe(true);
    });

    it('should return false for integer systolic value within range (no extensions)', () => {
      const q: AyuQuestion = { linkId: 's1', type: 'integer', text: 'Enter systolic BP' };
      expect(isNumericOutOfRange(q, { s1: 120 })).toBe(false);
    });

    it('should return true for integer diastolic value above 150 (no extensions)', () => {
      const q: AyuQuestion = { linkId: 'd1', type: 'integer', text: 'Enter diastolic BP' };
      expect(isNumericOutOfRange(q, { d1: 160 })).toBe(true);
    });

    it('should return false for integer diastolic value within range (no extensions)', () => {
      const q: AyuQuestion = { linkId: 'd1', type: 'integer', text: 'Enter diastolic BP' };
      expect(isNumericOutOfRange(q, { d1: 80 })).toBe(false);
    });

    it('should return true for string systolic value below 60 (no extensions)', () => {
      const q: AyuQuestion = { linkId: 's1', type: 'string', text: 'Enter systolic BP' };
      expect(isNumericOutOfRange(q, { s1: '50' })).toBe(true);
    });

    it('should return false for string systolic value within range (no extensions)', () => {
      const q: AyuQuestion = { linkId: 's1', type: 'string', text: 'Enter systolic BP' };
      expect(isNumericOutOfRange(q, { s1: '120' })).toBe(false);
    });

    it('should return true for string diastolic value above 150 (no extensions)', () => {
      const q: AyuQuestion = { linkId: 'd1', type: 'string', text: 'Enter diastolic BP' };
      expect(isNumericOutOfRange(q, { d1: '160' })).toBe(true);
    });

    it('should not apply BP fallback when FHIR extensions exist', () => {
      const q: AyuQuestion = {
        linkId: 's1',
        type: 'integer',
        text: 'Enter systolic BP',
        extension: [
          { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 10 },
          { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 100 },
        ],
      };
      // Value 50 is within extension range (10-100) even though below BP systolic min (60)
      expect(isNumericOutOfRange(q, { s1: 50 })).toBe(false);
    });

    it('should return false for non-BP text with no extensions', () => {
      const q: AyuQuestion = { linkId: 'q1', type: 'integer', text: 'Enter pulse rate' };
      expect(isNumericOutOfRange(q, { q1: 999 })).toBe(false);
    });
  });
});

describe('hasNestedOutOfRangeValue', () => {
  it('should return false when question has no children', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(hasNestedOutOfRangeValue(q, {})).toBe(false);
  });

  it('should return true when nested integer child is out of range', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'systolic',
          type: 'integer',
          extension: [
            { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
            { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
          ],
        },
      ],
    };
    expect(hasNestedOutOfRangeValue(q, { q1: 'yes', systolic: 300 })).toBe(true);
  });

  it('should return false when nested integer child is within range', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'systolic',
          type: 'integer',
          extension: [
            { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
            { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
          ],
        },
      ],
    };
    expect(hasNestedOutOfRangeValue(q, { q1: 'yes', systolic: 120 })).toBe(false);
  });

  it('should skip hidden children (enableWhen false)', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'systolic',
          type: 'integer',
          enableWhen: [
            { question: 'q1', operator: '=', answerCoding: { code: 'yes' } },
          ],
          extension: [
            { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
            { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
          ],
        },
      ],
    };
    expect(hasNestedOutOfRangeValue(q, { q1: 'no', systolic: 300 })).toBe(false);
  });

  it('should recurse into deeply nested children', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'group',
          type: 'choice',
          item: [
            {
              linkId: 'diastolic',
              type: 'integer',
              extension: [
                { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 30 },
                { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 150 },
              ],
            },
          ],
        },
      ],
    };
    expect(hasNestedOutOfRangeValue(q, { q1: 'yes', group: 'val', diastolic: 200 })).toBe(true);
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

  it('should skip hidden nested children in checkDurationDeep', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'quantity',
          enableWhen: [
            { question: 'q1', operator: '=', answerCoding: { code: 'yes' } },
          ],
        },
      ],
    };
    // Answer is 'no', so child is hidden → should not flag as invalid
    expect(
      isQuantityInvalid(q, {
        q1: 'no',
        'q1.1': { dropdownValues: { number: 5 } },
      })
    ).toBe(false);
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

  it('should return false when nested child has sub-items with no invalid duration', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          item: [{ linkId: 'q1.1.1', type: 'string' }],
        },
      ],
    };
    expect(
      isQuantityInvalid(q, {
        q1: 'yes',
        'q1.1.1': 'some text value',
      })
    ).toBe(false);
  });

  it('should return false when nested child has valid duration with both number and days', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'choice' }],
    };
    expect(
      isQuantityInvalid(q, {
        q1: 'yes',
        'q1.1': { dropdownValues: { number: 5, days: 'days' } },
      })
    ).toBe(false);
  });

  it('should return true when nested child duration is missing number', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'choice' }],
    };
    expect(
      isQuantityInvalid(q, {
        q1: 'yes',
        'q1.1': { dropdownValues: { days: 'days' } },
      })
    ).toBe(true);
  });
});

describe('validateQuestion', () => {
  beforeEach(() => {
    vi.mocked(resolveAyuComponent).mockReturnValue('select' as never);
    vi.mocked(isStrictAssociatedSymptoms).mockReturnValue(false);
    vi.mocked(hasExclusiveSelected).mockReturnValue(false);
  });

  it('should return valid when no validation issues exist', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(validateQuestion(q, { q1: 'answer' })).toEqual({ valid: true });
  });

  it('should return valid with array answer when all conditions pass', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      answerOption: [{ valueCoding: { code: 'a', display: 'A' } }],
    };
    expect(validateQuestion(q, { q1: ['a'] })).toEqual({ valid: true });
  });

  it('should return valid for repeats choice with answer codes', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      repeats: true,
      answerOption: [{ valueCoding: { code: 'a', display: 'A' } }],
    };
    expect(validateQuestion(q, { q1: ['a'] })).toEqual({ valid: true });
  });

  it('should return uploadImage when camera answer is missing images', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    const cameraCheck = vi.fn(() => true);
    expect(validateQuestion(q, { q1: 'answer' }, cameraCheck)).toEqual({
      valid: false,
      reason: 'uploadImage',
    });
  });

  it('should not flag camera when check returns false', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    const cameraCheck = vi.fn(() => false);
    expect(validateQuestion(q, { q1: 'answer' }, cameraCheck)).toEqual({
      valid: true,
    });
  });

  it('should return uploadCapturedImage when images captured but not uploaded', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    const cameraCheck = vi.fn(() => false);
    const notUploadedCheck = vi.fn(() => true);
    expect(
      validateQuestion(q, { q1: 'answer' }, cameraCheck, notUploadedCheck)
    ).toEqual({
      valid: false,
      reason: 'uploadCapturedImage',
    });
  });

  it('should prioritize uploadCapturedImage over uploadImage when both fire', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    const cameraCheck = vi.fn(() => true);
    const notUploadedCheck = vi.fn(() => true);
    expect(
      validateQuestion(q, { q1: 'answer' }, cameraCheck, notUploadedCheck)
    ).toEqual({
      valid: false,
      reason: 'uploadCapturedImage',
    });
  });

  it('should not flag uploadCapturedImage when check returns false', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    const cameraCheck = vi.fn(() => false);
    const notUploadedCheck = vi.fn(() => false);
    expect(
      validateQuestion(q, { q1: 'answer' }, cameraCheck, notUploadedCheck)
    ).toEqual({ valid: true });
  });

  it('should return enterValue when nested string child is unanswered', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'string' }],
    };
    expect(validateQuestion(q, { q1: 'yes' })).toEqual({
      valid: false,
      reason: 'enterValue',
    });
  });

  it('should return enterValue when nested integer child is unanswered', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [{ linkId: 'q1.1', type: 'integer' }],
    };
    expect(validateQuestion(q, { q1: 'yes' })).toEqual({
      valid: false,
      reason: 'enterValue',
    });
  });

  it('should return enterValue when quantity is invalid', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'quantity' };
    expect(validateQuestion(q, {})).toEqual({
      valid: false,
      reason: 'enterValue',
    });
  });

  it('should return selectOption for unanswered repeats choice', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice', repeats: true };
    expect(validateQuestion(q, {})).toEqual({
      valid: false,
      reason: 'selectOption',
    });
  });

  it('should return selectOption for unanswered non-strict associated', () => {
    vi.mocked(resolveAyuComponent).mockReturnValue('associatedSymptoms' as never);
    vi.mocked(isStrictAssociatedSymptoms).mockReturnValue(false);
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      answerOption: [
        { valueCoding: { code: 'a', display: 'A' } },
        { valueCoding: { code: 'b', display: 'B' } },
      ],
    };
    expect(validateQuestion(q, {})).toEqual({
      valid: false,
      reason: 'selectOption',
    });
  });

  it('should not use repeats validation for associated symptoms', () => {
    vi.mocked(resolveAyuComponent).mockReturnValue('associatedSymptoms' as never);
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      repeats: true,
      answerOption: [
        { valueCoding: { code: 'a', display: 'A' } },
        { valueCoding: { code: 'b', display: 'B' } },
      ],
    };
    expect(validateQuestion(q, {})).toEqual({
      valid: false,
      reason: 'selectOption',
    });
  });

  it('should return allCompulsory for strict associated with partial answers', () => {
    vi.mocked(resolveAyuComponent).mockReturnValue('associatedSymptoms' as never);
    vi.mocked(isStrictAssociatedSymptoms).mockReturnValue(true);
    vi.mocked(hasExclusiveSelected).mockReturnValue(false);
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      answerOption: [
        { valueCoding: { code: 'a', display: 'A' } },
        { valueCoding: { code: 'b', display: 'B' } },
        { valueCoding: { code: 'c', display: 'C' } },
      ],
    };
    expect(validateQuestion(q, { q1: ['a'] })).toEqual({
      valid: false,
      reason: 'allCompulsory',
    });
  });

  it('should return valid when strict associated is fully answered', () => {
    vi.mocked(resolveAyuComponent).mockReturnValue('associatedSymptoms' as never);
    vi.mocked(isStrictAssociatedSymptoms).mockReturnValue(true);
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      answerOption: [
        { valueCoding: { code: 'a', display: 'A' } },
        { valueCoding: { code: 'b', display: 'B' } },
      ],
    };
    expect(validateQuestion(q, { q1: ['a', 'b'] })).toEqual({ valid: true });
  });

  it('should return valid when every strict associated row is answered with mixed Yes/No', () => {
    vi.mocked(resolveAyuComponent).mockReturnValue('associatedSymptoms' as never);
    vi.mocked(isStrictAssociatedSymptoms).mockReturnValue(true);
    vi.mocked(hasExclusiveSelected).mockReturnValue(false);
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      answerOption: [
        { valueCoding: { code: 'a', display: 'A' } },
        { valueCoding: { code: 'b', display: 'B' } },
        { valueCoding: { code: 'c', display: 'C' } },
      ],
    };
    expect(validateQuestion(q, { q1: ['a', 'NO_b', 'NO_c'] })).toEqual({
      valid: true,
    });
  });

  it('should not flag strict associated as incomplete when option codes are duplicated', () => {
    vi.mocked(resolveAyuComponent).mockReturnValue('associatedSymptoms' as never);
    vi.mocked(isStrictAssociatedSymptoms).mockReturnValue(true);
    vi.mocked(hasExclusiveSelected).mockReturnValue(false);
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      answerOption: [
        { valueCoding: { code: 'a', display: 'A' } },
        { valueCoding: { code: 'a', display: 'A again' } },
        { valueCoding: { code: 'b', display: 'B' } },
      ],
    };
    expect(validateQuestion(q, { q1: ['a', 'NO_b'] })).toEqual({ valid: true });
  });

  it('should not require strict associated rows that have an empty code', () => {
    vi.mocked(resolveAyuComponent).mockReturnValue('associatedSymptoms' as never);
    vi.mocked(isStrictAssociatedSymptoms).mockReturnValue(true);
    vi.mocked(hasExclusiveSelected).mockReturnValue(false);
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      answerOption: [
        { valueCoding: { code: 'a', display: 'A' } },
        { valueCoding: { code: '', display: 'Unstorable' } },
      ],
    };
    expect(validateQuestion(q, { q1: ['a'] })).toEqual({ valid: true });
  });

  it('should return valid when associated has exclusive option selected', () => {
    vi.mocked(resolveAyuComponent).mockReturnValue('associatedSymptoms' as never);
    vi.mocked(isStrictAssociatedSymptoms).mockReturnValue(true);
    vi.mocked(hasExclusiveSelected).mockReturnValue(true);
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      answerOption: [
        { valueCoding: { code: 'a', display: 'A' } },
        { valueCoding: { code: 'none', display: 'None' } },
      ],
    };
    expect(validateQuestion(q, { q1: ['none'] })).toEqual({ valid: true });
  });

  it('should handle answerOption being undefined for associated', () => {
    vi.mocked(resolveAyuComponent).mockReturnValue('associatedSymptoms' as never);
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(validateQuestion(q, {})).toEqual({
      valid: false,
      reason: 'selectOption',
    });
  });

  describe('Physical Exam question validation skip', () => {
    beforeEach(() => {
      vi.mocked(isPhysicalExamOptionsQuestion).mockReturnValue(true);
    });

    afterEach(() => {
      vi.mocked(isPhysicalExamOptionsQuestion).mockReturnValue(false);
    });

    it('should return valid for PE question with unanswered nested string child', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [{ linkId: 'pe1.1', type: 'string' }],
      };
      expect(validateQuestion(q, { pe1: 'yes' })).toEqual({ valid: true });
    });

    it('should return valid for PE question with unanswered nested integer child', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [{ linkId: 'pe1.1', type: 'integer' }],
      };
      expect(validateQuestion(q, { pe1: 'yes' })).toEqual({ valid: true });
    });

    it('should return valid for PE question with unanswered nested required child', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [{ linkId: 'pe1.1', type: 'string', required: true }],
      };
      expect(validateQuestion(q, { pe1: 'yes' })).toEqual({ valid: true });
    });

    it('should return valid for PE question with unanswered nested date child', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [{ linkId: 'pe1.1', type: 'date' }],
      };
      expect(validateQuestion(q, { pe1: 'yes' })).toEqual({ valid: true });
    });

    it('should return valid for PE question with unanswered nested quantity child', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [{ linkId: 'pe1.1', type: 'quantity' }],
      };
      expect(validateQuestion(q, { pe1: 'yes' })).toEqual({ valid: true });
    });

    it('should still check quantity validity at top level for PE questions', () => {
      const q: AyuQuestion = { linkId: 'pe1', type: 'quantity' };
      vi.mocked(isPhysicalExamOptionsQuestion).mockReturnValue(true);
      expect(validateQuestion(q, {})).toEqual({
        valid: false,
        reason: 'enterValue',
      });
    });

    it('should still check camera missing images for PE questions', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [{ linkId: 'pe1.1', type: 'string' }],
      };
      const cameraCheck = vi.fn(() => true);
      expect(validateQuestion(q, { pe1: 'yes' }, cameraCheck)).toEqual({
        valid: false,
        reason: 'uploadImage',
      });
    });

    it('should return valid for PE question with deeply nested unanswered children', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [
          {
            linkId: 'pe1.1',
            type: 'choice',
            item: [{ linkId: 'pe1.1.1', type: 'string' }],
          },
        ],
      };
      expect(validateQuestion(q, { pe1: 'yes' })).toEqual({ valid: true });
    });

    it('should still flag invalid repeats for PE questions with no answer', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        repeats: true,
      };
      expect(validateQuestion(q, {})).toEqual({
        valid: false,
        reason: 'selectOption',
      });
    });

    it('should return enterValue for PE question with empty nested BP integer (FHIR range extension)', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [
          {
            linkId: 'systolic',
            type: 'integer',
            text: 'Enter systolic BP',
            extension: [
              { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
              { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
            ],
          },
        ],
      };
      expect(validateQuestion(q, { pe1: 'yes' })).toEqual({
        valid: false,
        reason: 'enterValue',
      });
    });

    it('should return enterValue for PE question with empty nested BP integer detected by text keyword', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [
          {
            linkId: 'sys',
            type: 'integer',
            text: 'Systolic blood pressure',
          },
        ],
      };
      expect(validateQuestion(q, { pe1: 'yes' })).toEqual({
        valid: false,
        reason: 'enterValue',
      });
    });

    it('should return valid for PE BP question when both systolic and diastolic are filled', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [
          {
            linkId: 'systolic',
            type: 'integer',
            text: 'Enter systolic BP',
            extension: [
              { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
              { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
            ],
          },
          {
            linkId: 'diastolic',
            type: 'integer',
            text: 'Enter diastolic BP',
            extension: [
              { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 30 },
              { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 150 },
            ],
          },
        ],
      };
      expect(validateQuestion(q, { pe1: 'yes', systolic: 120, diastolic: 80 })).toEqual({ valid: true });
    });

    it('should return valid for PE question with non-BP integer child (no range info)', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [{ linkId: 'count', type: 'integer', text: 'Count of findings' }],
      };
      expect(validateQuestion(q, { pe1: 'yes' })).toEqual({ valid: true });
    });

    it('should return enterValue for PE question with BP field nested inside a container', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [
          {
            linkId: 'bp_container',
            type: 'group',
            item: [
              {
                linkId: 'systolic',
                type: 'integer',
                text: 'Systolic BP',
                extension: [
                  { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
                ],
              },
            ],
          },
        ],
      };
      expect(validateQuestion(q, { pe1: 'yes' })).toEqual({
        valid: false,
        reason: 'enterValue',
      });
    });

    it('should return valid for PE BP question when BP field is hidden by enableWhen', () => {
      const q: AyuQuestion = {
        linkId: 'pe1',
        type: 'choice',
        item: [
          {
            linkId: 'systolic',
            type: 'integer',
            text: 'Systolic BP',
            enableWhen: [
              { question: 'other', operator: '=', answerCoding: { code: 'show' } },
            ],
            extension: [
              { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
            ],
          },
        ],
      };
      expect(validateQuestion(q, { pe1: 'yes', other: 'hide' })).toEqual({ valid: true });
    });
  });

  describe('non-PE question validation (isPE=false)', () => {
    it('should still return enterValue for non-PE with unanswered nested string', () => {
      vi.mocked(isPhysicalExamOptionsQuestion).mockReturnValue(false);
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'choice',
        item: [{ linkId: 'q1.1', type: 'string' }],
      };
      expect(validateQuestion(q, { q1: 'yes' })).toEqual({
        valid: false,
        reason: 'enterValue',
      });
    });
  });

  describe('outOfRange validation', () => {
    it('should return outOfRange for top-level integer out of range', () => {
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'integer',
        text: 'Enter systolic BP',
        extension: [
          { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
          { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
        ],
      };
      expect(validateQuestion(q, { q1: 300 })).toEqual({
        valid: false,
        reason: 'outOfRange',
        outOfRangeText: 'Enter systolic BP',
      });
    });

    it('should return outOfRange for nested integer child out of range', () => {
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'choice',
        item: [
          {
            linkId: 'systolic',
            type: 'integer',
            text: 'Enter systolic BP',
            extension: [
              { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
              { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
            ],
          },
        ],
      };
      expect(validateQuestion(q, { q1: 'yes', systolic: 300 })).toEqual({
        valid: false,
        reason: 'outOfRange',
        outOfRangeText: 'Enter systolic BP',
      });
    });

    it('should return valid when integer value is within range', () => {
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'integer',
        extension: [
          { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
          { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
        ],
      };
      expect(validateQuestion(q, { q1: 120 })).toEqual({ valid: true });
    });

    it('should return outOfRangeText for nested string-type BP child', () => {
      const q: AyuQuestion = {
        linkId: 'bp1',
        type: 'choice',
        item: [
          { linkId: 'sys', type: 'string', text: 'Enter systolic BP' },
          { linkId: 'dia', type: 'string', text: 'Enter diastolic BP' },
        ],
      };
      expect(validateQuestion(q, { bp1: 'yes', sys: '300', dia: '80' })).toEqual({
        valid: false,
        reason: 'outOfRange',
        outOfRangeText: 'Enter systolic BP',
      });
    });

    it('should return diastolic outOfRangeText when diastolic is out of range', () => {
      const q: AyuQuestion = {
        linkId: 'bp1',
        type: 'choice',
        item: [
          { linkId: 'sys', type: 'string', text: 'Enter systolic BP' },
          { linkId: 'dia', type: 'string', text: 'Enter diastolic BP' },
        ],
      };
      expect(validateQuestion(q, { bp1: 'yes', sys: '120', dia: '20' })).toEqual({
        valid: false,
        reason: 'outOfRange',
        outOfRangeText: 'Enter diastolic BP',
      });
    });
  });

  describe('findOutOfRangeQuestionText', () => {
    it('should return top-level question text when it is out of range', () => {
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'string',
        text: 'Enter systolic BP',
      };
      expect(findOutOfRangeQuestionText(q, { q1: '300' })).toBe('Enter systolic BP');
    });

    it('should return nested child text when child is out of range', () => {
      const q: AyuQuestion = {
        linkId: 'bp1',
        type: 'choice',
        item: [
          { linkId: 'dia', type: 'string', text: 'Enter diastolic BP' },
        ],
      };
      expect(findOutOfRangeQuestionText(q, { bp1: 'yes', dia: '20' })).toBe('Enter diastolic BP');
    });

    it('should return undefined when no field is out of range', () => {
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'string',
        text: 'Enter systolic BP',
      };
      expect(findOutOfRangeQuestionText(q, { q1: '120' })).toBeUndefined();
    });

    it('should return undefined when question has no items and is in range', () => {
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'integer',
        text: 'Enter pulse',
      };
      expect(findOutOfRangeQuestionText(q, { q1: 72 })).toBeUndefined();
    });

    it('should return first out-of-range child in deeply nested structure', () => {
      const q: AyuQuestion = {
        linkId: 'root',
        type: 'choice',
        item: [
          {
            linkId: 'group1',
            type: 'choice',
            item: [
              { linkId: 'sys', type: 'string', text: 'Enter systolic BP' },
            ],
          },
        ],
      };
      expect(findOutOfRangeQuestionText(q, { root: 'yes', group1: 'yes', sys: '300' })).toBe('Enter systolic BP');
    });

    it('should return undefined when children exist but all values are in range', () => {
      const q: AyuQuestion = {
        linkId: 'bp1',
        type: 'choice',
        item: [
          { linkId: 'sys', type: 'string', text: 'Enter systolic BP' },
          { linkId: 'dia', type: 'string', text: 'Enter diastolic BP' },
        ],
      };
      expect(findOutOfRangeQuestionText(q, { bp1: 'yes', sys: '120', dia: '80' })).toBeUndefined();
    });

    it('should skip children whose enableWhen evaluates to false', () => {
      const q: AyuQuestion = {
        linkId: 'bp1',
        type: 'choice',
        item: [
          {
            linkId: 'sys',
            type: 'string',
            text: 'Enter systolic BP',
            enableWhen: [
              { question: 'bp1', operator: '=', answerCoding: { code: 'HIDDEN' } },
            ],
          },
        ],
      };
      // sys has out-of-range value 300, but enableWhen hides it
      expect(findOutOfRangeQuestionText(q, { bp1: 'yes', sys: '300' })).toBeUndefined();
    });
  });
});

describe('hasMissingNestedBPInput', () => {
  it('should return false when question has no nested items', () => {
    const q: AyuQuestion = { linkId: 'pe1', type: 'choice' };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes' })).toBe(false);
  });

  it('should return false for nested choice child (concept-tag, not a BP field)', () => {
    const q: AyuQuestion = {
      linkId: 'pe1',
      type: 'choice',
      item: [{ linkId: 'tag', type: 'choice' }],
    };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes' })).toBe(false);
  });

  it('should return false for nested integer child with no range info', () => {
    const q: AyuQuestion = {
      linkId: 'pe1',
      type: 'choice',
      item: [{ linkId: 'count', type: 'integer', text: 'Count of findings' }],
    };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes' })).toBe(false);
  });

  it('should return true for empty nested integer with FHIR minValue extension', () => {
    const q: AyuQuestion = {
      linkId: 'pe1',
      type: 'choice',
      item: [
        {
          linkId: 'systolic',
          type: 'integer',
          extension: [
            { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
          ],
        },
      ],
    };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes' })).toBe(true);
  });

  it('should return true for empty nested integer with FHIR maxValue extension', () => {
    const q: AyuQuestion = {
      linkId: 'pe1',
      type: 'choice',
      item: [
        {
          linkId: 'diastolic',
          type: 'integer',
          extension: [
            { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 150 },
          ],
        },
      ],
    };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes' })).toBe(true);
  });

  it('should return false when nested BP integer is filled', () => {
    const q: AyuQuestion = {
      linkId: 'pe1',
      type: 'choice',
      item: [
        {
          linkId: 'systolic',
          type: 'integer',
          extension: [
            { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
            { url: 'http://hl7.org/fhir/StructureDefinition/maxValue', valueInteger: 260 },
          ],
        },
      ],
    };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes', systolic: 120 })).toBe(false);
  });

  it('should return true when second BP integer (diastolic) is missing', () => {
    const q: AyuQuestion = {
      linkId: 'pe1',
      type: 'choice',
      item: [
        {
          linkId: 'systolic',
          type: 'integer',
          text: 'Systolic BP',
          extension: [
            { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
          ],
        },
        {
          linkId: 'diastolic',
          type: 'integer',
          text: 'Diastolic BP',
          extension: [
            { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 30 },
          ],
        },
      ],
    };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes', systolic: 120 })).toBe(true);
  });

  it('should return true for empty nested string BP field detected by text keyword', () => {
    const q: AyuQuestion = {
      linkId: 'pe1',
      type: 'choice',
      item: [{ linkId: 'sys', type: 'string', text: 'Enter systolic BP value' }],
    };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes' })).toBe(true);
  });

  it('should return false for nested string BP field that is filled', () => {
    const q: AyuQuestion = {
      linkId: 'pe1',
      type: 'choice',
      item: [{ linkId: 'sys', type: 'string', text: 'Diastolic reading' }],
    };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes', sys: '80' })).toBe(false);
  });

  it('should return true for BP field nested inside a container group', () => {
    const q: AyuQuestion = {
      linkId: 'pe1',
      type: 'choice',
      item: [
        {
          linkId: 'container',
          type: 'group',
          item: [
            {
              linkId: 'systolic',
              type: 'integer',
              text: 'Systolic',
              extension: [
                { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
              ],
            },
          ],
        },
      ],
    };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes' })).toBe(true);
  });

  it('should skip a BP field whose enableWhen is not met', () => {
    const q: AyuQuestion = {
      linkId: 'pe1',
      type: 'choice',
      item: [
        {
          linkId: 'systolic',
          type: 'integer',
          text: 'Systolic BP',
          enableWhen: [
            { question: 'flag', operator: '=', answerCoding: { code: 'show' } },
          ],
          extension: [
            { url: 'http://hl7.org/fhir/StructureDefinition/minValue', valueInteger: 60 },
          ],
        },
      ],
    };
    expect(hasMissingNestedBPInput(q, { pe1: 'yes', flag: 'hide' })).toBe(false);
  });
});
