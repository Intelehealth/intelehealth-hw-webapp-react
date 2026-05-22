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
            url: 'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice',
            valueString: 'True',
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
          { url: 'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice', valueString: 'True' },
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

  it('should return true for top-level complete duration', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(
      isTopLevelComplete(q, {
        q1: { dropdownValues: { number: 5, days: 'days' } },
      })
    ).toBe(true);
  });

  it('should return false when top-level duration has only days', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice' };
    expect(
      isTopLevelComplete(q, {
        q1: { dropdownValues: { days: 'days' } },
      })
    ).toBe(false);
  });

  it('should return true when non-choice type has simple answer', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'string' };
    expect(
      isTopLevelComplete(q, { q1: 'some answer' })
    ).toBe(true);
  });

  it('should return false when parent answer is falsy for non-repeats', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'string' };
    expect(isTopLevelComplete(q, { q1: '' })).toBe(false);
  });

  it('should handle multiple visible nested children', () => {
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
        {
          linkId: 'q1.2',
          type: 'integer',
          enableWhen: [
            { question: 'q1', operator: '=', answerCoding: { code: 'yes' } },
          ],
        },
      ],
    };
    // Both children visible but only one answered
    expect(isTopLevelComplete(q, { q1: 'yes', 'q1.1': 'text' })).toBe(false);
    // Both answered
    expect(isTopLevelComplete(q, { q1: 'yes', 'q1.1': 'text', 'q1.2': 42 })).toBe(true);
  });

  it('should return false when visible date child is unanswered', () => {
    const q: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'date',
          enableWhen: [
            { question: 'q1', operator: '=', answerCoding: { code: 'yes' } },
          ],
        },
      ],
    };
    // Child visible but unanswered
    expect(isTopLevelComplete(q, { q1: 'yes' })).toBe(false);
    // Child visible and answered
    expect(isTopLevelComplete(q, { q1: 'yes', 'q1.1': '2026-01-01' })).toBe(true);
  });

  it('should return false for repeats with non-array answer', () => {
    const q: AyuQuestion = { linkId: 'q1', type: 'choice', repeats: true };
    expect(isTopLevelComplete(q, { q1: 'not-array' })).toBe(false);
  });

  describe('areNestedComplete with findMatchingOptionCode', () => {
    const makeParentWithChild = (childType: string = 'string'): AyuQuestion => ({
      linkId: 'q1',
      type: 'choice',
      answerOption: [
        { valueCoding: { code: 'optA', display: 'Option A' } },
        { valueCoding: { code: 'optB', display: 'Option B' } },
      ],
      item: [
        {
          linkId: 'q1.child',
          type: childType,
          enableWhen: [
            { question: 'q1', operator: '=', answerCoding: { code: 'optA' } },
          ],
        },
      ],
    });

    it('should validate child when parent answer is a string matching the option code', () => {
      const q = makeParentWithChild('string');
      // Parent answer is string 'optA' which matches the child's enableWhen code
      // Child is visible (enableWhen matches) and is unanswered → incomplete
      expect(isTopLevelComplete(q, { q1: 'optA' })).toBe(false);
      // Child answered → complete
      expect(isTopLevelComplete(q, { q1: 'optA', 'q1.child': 'some text' })).toBe(true);
    });

    it('should skip child when parent answer is a string not matching the option code', () => {
      const q = makeParentWithChild('string');
      // Parent answer is 'optB', child's enableWhen code is 'optA'
      // enableWhen still passes (operator '=' with 'optA' vs answer 'optB')
      // but matchedCode is 'optA' and selectedCodes is ['optB'], so child is skipped via continue
      expect(isTopLevelComplete(q, { q1: 'optB' })).toBe(true);
    });

    it('should skip child when parent answer is neither string nor array', () => {
      // Use linkId prefix strategy for findMatchingOptionCode so enableWhen
      // doesn't need to reference the parent (avoiding evaluateEnableWhen filtering)
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'optA', display: 'Option A' } },
        ],
        item: [
          {
            // linkId starts with 'optA' → findMatchingOptionCode matches via prefix
            linkId: 'optA.child',
            type: 'string',
            // No enableWhen → evaluateEnableWhen returns true (always visible)
          },
        ],
      };
      // Parent answer is a number — selectedCodes becomes [] so matchedCode is not included → continue
      expect(isTopLevelComplete(q, { q1: 42 as unknown as string })).toBe(true);
    });

    it('should validate child when parent answer is an array containing the option code', () => {
      const q = makeParentWithChild('string');
      q.repeats = true;
      // Parent answer is array containing 'optA' → child should be validated
      expect(isTopLevelComplete(q, { q1: ['optA', 'optB'] })).toBe(false);
      expect(isTopLevelComplete(q, { q1: ['optA', 'optB'], 'q1.child': 'text' })).toBe(true);
    });

    it('should skip child when parent answer is an array not containing the option code', () => {
      const q = makeParentWithChild('string');
      q.repeats = true;
      // Parent answer is array with only 'optB', child maps to 'optA' → skipped
      expect(isTopLevelComplete(q, { q1: ['optB'] })).toBe(true);
    });
  });

  describe('hasIncompleteDuration (nested recursive)', () => {
    it('should return false when nested child has incomplete duration', () => {
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'optA', display: 'Option A' } },
        ],
        item: [
          {
            linkId: 'q1.dur',
            type: 'quantity',
            enableWhen: [
              { question: 'q1', operator: '=', answerCoding: { code: 'optA' } },
            ],
          },
        ],
      };
      // Nested duration with only number, no days → incomplete
      expect(
        isTopLevelComplete(q, {
          q1: ['optA'],
          'q1.dur': { dropdownValues: { number: 5 } },
        })
      ).toBe(false);
    });

    it('should return false when deeply nested child has incomplete duration', () => {
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'optA', display: 'Option A' } },
        ],
        item: [
          {
            linkId: 'q1.group',
            type: 'group',
            enableWhen: [
              { question: 'q1', operator: '=', answerCoding: { code: 'optA' } },
            ],
            item: [
              {
                linkId: 'q1.group.dur',
                type: 'quantity',
              },
            ],
          },
        ],
      };
      // Deeply nested incomplete duration
      expect(
        isTopLevelComplete(q, {
          q1: ['optA'],
          'q1.group.dur': { dropdownValues: { number: 3 } },
        })
      ).toBe(false);
    });
  });

  describe('areNestedComplete - choice children and recursion', () => {
    it('should return false when nested choice child has no answer', () => {
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'optA', display: 'Option A' } },
        ],
        item: [
          {
            linkId: 'q1.choice',
            type: 'choice',
            answerOption: [
              { valueCoding: { code: 'sub1', display: 'Sub 1' } },
            ],
            enableWhen: [
              { question: 'q1', operator: '=', answerCoding: { code: 'optA' } },
            ],
          },
        ],
      };
      // Nested choice child with no answer → incomplete
      expect(isTopLevelComplete(q, { q1: 'optA' })).toBe(false);
      // With answer → complete
      expect(
        isTopLevelComplete(q, { q1: 'optA', 'q1.choice': 'sub1' })
      ).toBe(true);
    });

    it('should recurse into deeper nested levels and detect incomplete', () => {
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'optA', display: 'Option A' } },
        ],
        item: [
          {
            linkId: 'q1.child',
            type: 'choice',
            answerOption: [
              { valueCoding: { code: 'c1', display: 'Child 1' } },
            ],
            enableWhen: [
              { question: 'q1', operator: '=', answerCoding: { code: 'optA' } },
            ],
            item: [
              {
                linkId: 'q1.child.deep',
                type: 'string',
                enableWhen: [
                  {
                    question: 'q1.child',
                    operator: '=',
                    answerCoding: { code: 'c1' },
                  },
                ],
              },
            ],
          },
        ],
      };
      // Child answered but deep child unanswered → incomplete
      expect(
        isTopLevelComplete(q, { q1: 'optA', 'q1.child': 'c1' })
      ).toBe(false);
      // All answered → complete
      expect(
        isTopLevelComplete(q, {
          q1: 'optA',
          'q1.child': 'c1',
          'q1.child.deep': 'text',
        })
      ).toBe(true);
    });
  });

  describe('strict Associated Symptoms', () => {
    const makeAssociatedSymptoms = (): AyuQuestion => ({
      linkId: 'as1',
      type: 'choice',
      text: 'Associated symptoms',
      answerOption: [
        { valueCoding: { code: 'fever', display: 'Fever' } },
        { valueCoding: { code: 'cough', display: 'Cough' } },
        { valueCoding: { code: 'rash', display: 'Rash' } },
      ],
    });

    it('should return false when only some options are answered', () => {
      const q = makeAssociatedSymptoms();
      expect(isTopLevelComplete(q, { as1: ['fever'] })).toBe(false);
      expect(isTopLevelComplete(q, { as1: ['fever', 'NO_cough'] })).toBe(false);
    });

    it('should return true when every option has Yes or No answer', () => {
      const q = makeAssociatedSymptoms();
      expect(
        isTopLevelComplete(q, { as1: ['fever', 'NO_cough', 'NO_rash'] })
      ).toBe(true);
    });

    it('should return true when an exclusive option is selected', () => {
      const q: AyuQuestion = {
        linkId: 'as1',
        type: 'choice',
        text: 'Associated symptoms',
        answerOption: [
          {
            valueCoding: { code: 'none', display: 'None' },
            extension: [
              {
                url: 'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice',
                valueString: 'True',
              },
            ],
          },
          { valueCoding: { code: 'fever', display: 'Fever' } },
          { valueCoding: { code: 'cough', display: 'Cough' } },
        ],
      };
      // Only the exclusive option selected → complete even though others unanswered
      expect(isTopLevelComplete(q, { as1: ['none'] })).toBe(true);
    });

    it('should return false when answer is not an array', () => {
      const q = makeAssociatedSymptoms();
      expect(isTopLevelComplete(q, { as1: 'fever' as unknown as string })).toBe(
        false
      );
    });

    it('should not apply strict rule to non-AS choice questions with same shape', () => {
      // Same shape but text doesn't match — should fall back to default behavior (any non-empty array → complete)
      const q: AyuQuestion = {
        linkId: 'q1',
        type: 'choice',
        text: 'Some other question',
        answerOption: [
          { valueCoding: { code: 'a', display: 'A' } },
          { valueCoding: { code: 'b', display: 'B' } },
        ],
      };
      expect(isTopLevelComplete(q, { q1: ['a'] })).toBe(true);
    });

    it('should treat totalOptions as 0 when answerOption is undefined', () => {
      // Associated symptoms question without answerOption — triggers ?? 0 fallback on line 88
      const q: AyuQuestion = {
        linkId: 'as1',
        type: 'choice',
        text: 'Associated symptoms',
        // No answerOption defined
      };
      // codes.length (1) < totalOptions (0) is false, so the guard doesn't return false
      // The question is complete because the array is non-empty and no further nested checks apply
      expect(isTopLevelComplete(q, { as1: ['fever'] })).toBe(true);
    });
  });
});
