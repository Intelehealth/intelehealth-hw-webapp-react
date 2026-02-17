import { describe, expect, it } from 'vitest';
import {
  type AyuComponentType,
  resolveAyuComponent,
} from '../../../../modules/ayu/pages/decision-matrix';
import type { AyuQuestion } from '../../../../modules/ayu/types/ayu.types';

describe('decision-matrix', () => {
  describe('resolveAyuComponent', () => {
    describe('Function Definition', () => {
      it('should be defined', () => {
        expect(resolveAyuComponent).toBeDefined();
      });

      it('should be a function', () => {
        expect(typeof resolveAyuComponent).toBe('function');
      });

      it('should accept a question parameter', () => {
        expect(resolveAyuComponent.length).toBe(1);
      });
    });

    describe('Group Type Resolution', () => {
      it('should return "group" for group type questions', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'group',
          text: 'Test Group',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('group');
      });

      it('should return "group" for group type with nested items', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'group',
          text: 'Test Group',
          item: [
            {
              linkId: 'q1.1',
              type: 'string',
              text: 'Nested Question',
            },
          ],
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('group');
      });
    });

    describe('Display Type Resolution', () => {
      it('should return "display" for display type questions', () => {
        const question: AyuQuestion = {
          linkId: 'q2',
          type: 'display',
          text: 'Display Text',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('display');
      });

      it('should return "display" for display type with readOnly flag', () => {
        const question: AyuQuestion = {
          linkId: 'q2',
          type: 'display',
          text: 'Display Text',
          readOnly: true,
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('display');
      });
    });

    describe('String Type Resolution', () => {
      it('should return "text" for string type questions without repeats', () => {
        const question: AyuQuestion = {
          linkId: 'q3',
          type: 'string',
          text: 'Enter text',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('text');
      });

      it('should return "repeatable-text" for string type with repeats true', () => {
        const question: AyuQuestion = {
          linkId: 'q4',
          type: 'string',
          text: 'Enter multiple values',
          repeats: true,
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('repeatable-text');
      });

      it('should return "text" for string type with repeats false', () => {
        const question: AyuQuestion = {
          linkId: 'q5',
          type: 'string',
          text: 'Enter text',
          repeats: false,
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('text');
      });

      it('should return "text" for string type with undefined repeats', () => {
        const question: AyuQuestion = {
          linkId: 'q6',
          type: 'string',
          text: 'Enter text',
          repeats: undefined,
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('text');
      });
    });

    describe('Integer Type Resolution', () => {
      it('should return "number" for integer type questions', () => {
        const question: AyuQuestion = {
          linkId: 'q7',
          type: 'integer',
          text: 'Enter number',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('number');
      });

      it('should return "number" for integer type with required flag', () => {
        const question: AyuQuestion = {
          linkId: 'q8',
          type: 'integer',
          text: 'Enter number',
          required: true,
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('number');
      });
    });

    describe('Decimal Type Resolution', () => {
      it('should return "number" for decimal type questions', () => {
        const question: AyuQuestion = {
          linkId: 'q9',
          type: 'decimal',
          text: 'Enter decimal',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('number');
      });

      it('should return "number" for decimal type with required flag', () => {
        const question: AyuQuestion = {
          linkId: 'q10',
          type: 'decimal',
          text: 'Enter decimal',
          required: true,
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('number');
      });
    });

    describe('Date Type Resolution', () => {
      it('should return "date" for date type questions', () => {
        const question: AyuQuestion = {
          linkId: 'q11',
          type: 'date',
          text: 'Select date',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('date');
      });

      it('should return "date" for date type with required flag', () => {
        const question: AyuQuestion = {
          linkId: 'q12',
          type: 'date',
          text: 'Select date',
          required: true,
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('date');
      });
    });

    describe('Quantity Type Resolution', () => {
      it('should return "quantity" for quantity type questions', () => {
        const question: AyuQuestion = {
          linkId: 'q12-a',
          type: 'quantity',
          text: 'Enter quantity',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('quantity');
      });

      it('should return "quantity" for quantity type with required flag', () => {
        const question: AyuQuestion = {
          linkId: 'q12-b',
          type: 'quantity',
          text: 'Enter quantity',
          required: true,
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('quantity');
      });

      it('should return "quantity" for quantity type with repeats', () => {
        const question: AyuQuestion = {
          linkId: 'q12-c',
          type: 'quantity',
          text: 'Enter multiple quantities',
          repeats: true,
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('quantity');
      });

      it('should return "quantity" for quantity type without text', () => {
        const question: AyuQuestion = {
          linkId: 'q12-d',
          type: 'quantity',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('quantity');
      });

      it('should return "quantity" for quantity type with all properties', () => {
        const question: AyuQuestion = {
          linkId: 'q12-e',
          type: 'quantity',
          text: 'Enter quantity with units',
          required: true,
          readOnly: false,
          repeats: false,
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('quantity');
      });
    });

    describe('Choice Type Resolution', () => {
      it('should return "selectableOptionGroup" for choice type questions', () => {
        const question: AyuQuestion = {
          linkId: 'q13',
          type: 'choice',
          text: 'Select option',
          answerOption: [
            {
              valueCoding: { code: 'opt1', display: 'Option 1' },
            },
          ],
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('selectableOptionGroup');
      });

      it('should return "selectableOptionGroup" for choice type without repeats', () => {
        const question: AyuQuestion = {
          linkId: 'q14',
          type: 'choice',
          text: 'Select option',
          repeats: false,
          answerOption: [
            {
              valueCoding: { code: 'opt1', display: 'Option 1' },
            },
          ],
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('selectableOptionGroup');
      });

      it('should return "selectableOptionGroup" for choice type with repeats', () => {
        const question: AyuQuestion = {
          linkId: 'q15',
          type: 'choice',
          text: 'Select multiple',
          repeats: true,
          answerOption: [
            {
              valueCoding: { code: 'opt1', display: 'Option 1' },
            },
          ],
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('selectableOptionGroup');
      });

      it('should return "selectableOptionGroup" for choice type with multiple answer options', () => {
        const question: AyuQuestion = {
          linkId: 'q16',
          type: 'choice',
          text: 'Select option',
          answerOption: [
            {
              valueCoding: { code: 'opt1', display: 'Option 1' },
            },
            {
              valueCoding: { code: 'opt2', display: 'Option 2' },
            },
            {
              valueCoding: { code: 'opt3', display: 'Option 3' },
            },
          ],
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('selectableOptionGroup');
      });
    });

    describe('Default Type Resolution', () => {
      it('should return "text" for unknown type', () => {
        const question: AyuQuestion = {
          linkId: 'q17',
          type: 'unknown-type',
          text: 'Unknown',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('text');
      });

      it('should return "text" for empty type string', () => {
        const question: AyuQuestion = {
          linkId: 'q18',
          type: '',
          text: 'Empty type',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('text');
      });

      it('should return "text" for custom type', () => {
        const question: AyuQuestion = {
          linkId: 'q19',
          type: 'custom',
          text: 'Custom type',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('text');
      });
    });

    describe('Return Type Validation', () => {
      it('should return valid AyuComponentType for group', () => {
        const question: AyuQuestion = {
          linkId: 'q20',
          type: 'group',
        };

        const result: AyuComponentType = resolveAyuComponent(question);
        expect(result).toBe('group');
      });

      it('should return valid AyuComponentType for display', () => {
        const question: AyuQuestion = {
          linkId: 'q21',
          type: 'display',
        };

        const result: AyuComponentType = resolveAyuComponent(question);
        expect(result).toBe('display');
      });

      it('should return valid AyuComponentType for text', () => {
        const question: AyuQuestion = {
          linkId: 'q22',
          type: 'string',
        };

        const result: AyuComponentType = resolveAyuComponent(question);
        expect(result).toBe('text');
      });

      it('should return valid AyuComponentType for repeatable-text', () => {
        const question: AyuQuestion = {
          linkId: 'q23',
          type: 'string',
          repeats: true,
        };

        const result: AyuComponentType = resolveAyuComponent(question);
        expect(result).toBe('repeatable-text');
      });

      it('should return valid AyuComponentType for number', () => {
        const question: AyuQuestion = {
          linkId: 'q24',
          type: 'integer',
        };

        const result: AyuComponentType = resolveAyuComponent(question);
        expect(result).toBe('number');
      });

      it('should return valid AyuComponentType for date', () => {
        const question: AyuQuestion = {
          linkId: 'q25',
          type: 'date',
        };

        const result: AyuComponentType = resolveAyuComponent(question);
        expect(result).toBe('date');
      });

      it('should return valid AyuComponentType for selectableOptionGroup', () => {
        const question: AyuQuestion = {
          linkId: 'q26',
          type: 'choice',
        };

        const result: AyuComponentType = resolveAyuComponent(question);
        expect(result).toBe('selectableOptionGroup');
      });

      it('should return valid AyuComponentType for quantity', () => {
        const question: AyuQuestion = {
          linkId: 'q26-a',
          type: 'quantity',
        };

        const result: AyuComponentType = resolveAyuComponent(question);
        expect(result).toBe('quantity');
      });
    });

    describe('Edge Cases', () => {
      it('should handle question with only linkId and type', () => {
        const question: AyuQuestion = {
          linkId: 'q27',
          type: 'string',
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('text');
      });

      it('should handle question with all optional properties', () => {
        const question: AyuQuestion = {
          linkId: 'q28',
          type: 'string',
          text: 'Full question',
          required: true,
          readOnly: false,
          repeats: false
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('text');
      });

      it('should handle question with nested items', () => {
        const question: AyuQuestion = {
          linkId: 'q29',
          type: 'group',
          item: [
            {
              linkId: 'q29.1',
              type: 'string',
            },
            {
              linkId: 'q29.2',
              type: 'integer',
            },
          ],
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('group');
      });

      it('should handle question with UI overrides', () => {
        const question: AyuQuestion = {
          linkId: 'q30',
          type: 'string',
          ui: {
            inputType: 'radio',
            placeholder: 'Enter value',
          },
        };

        const result = resolveAyuComponent(question);
        expect(result).toBe('text');
      });
    });

    describe('Type Combinations', () => {
      it('should prioritize repeats flag for string types', () => {
        const questionWithRepeats: AyuQuestion = {
          linkId: 'q31',
          type: 'string',
          repeats: true,
        };

        const questionWithoutRepeats: AyuQuestion = {
          linkId: 'q32',
          type: 'string',
          repeats: false,
        };

        expect(resolveAyuComponent(questionWithRepeats)).toBe('repeatable-text');
        expect(resolveAyuComponent(questionWithoutRepeats)).toBe('text');
      });

      it('should treat integer and decimal the same way', () => {
        const integerQuestion: AyuQuestion = {
          linkId: 'q33',
          type: 'integer',
        };

        const decimalQuestion: AyuQuestion = {
          linkId: 'q34',
          type: 'decimal',
        };

        expect(resolveAyuComponent(integerQuestion)).toBe('number');
        expect(resolveAyuComponent(decimalQuestion)).toBe('number');
        expect(resolveAyuComponent(integerQuestion)).toBe(
          resolveAyuComponent(decimalQuestion)
        );
      });

      it('should always return selectableOptionGroup for choice type regardless of repeats', () => {
        const singleChoice: AyuQuestion = {
          linkId: 'q35',
          type: 'choice',
          repeats: false,
        };

        const multiChoice: AyuQuestion = {
          linkId: 'q36',
          type: 'choice',
          repeats: true,
        };

        expect(resolveAyuComponent(singleChoice)).toBe('selectableOptionGroup');
        expect(resolveAyuComponent(multiChoice)).toBe('selectableOptionGroup');
      });
    });

    describe('Consistency', () => {
      it('should return consistent results for the same input', () => {
        const question: AyuQuestion = {
          linkId: 'q37',
          type: 'string',
          repeats: true,
        };

        const result1 = resolveAyuComponent(question);
        const result2 = resolveAyuComponent(question);
        const result3 = resolveAyuComponent(question);

        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
        expect(result1).toBe('repeatable-text');
      });

      it('should be deterministic for all question types', () => {
        const types = ['group', 'display', 'string', 'integer', 'decimal', 'date', 'choice', 'quantity'];

        types.forEach(type => {
          const question: AyuQuestion = {
            linkId: `q-${type}`,
            type,
          };

          const result1 = resolveAyuComponent(question);
          const result2 = resolveAyuComponent(question);

          expect(result1).toBe(result2);
        });
      });
    });

    describe('Complete Coverage', () => {
      it('should handle all FHIR question types', () => {
        const testCases: Array<{ type: string; expected: AyuComponentType }> = [
          { type: 'group', expected: 'group' },
          { type: 'display', expected: 'display' },
          { type: 'string', expected: 'text' },
          { type: 'integer', expected: 'number' },
          { type: 'decimal', expected: 'number' },
          { type: 'date', expected: 'date' },
          { type: 'choice', expected: 'selectableOptionGroup' },
          { type: 'quantity', expected: 'quantity' },
        ];

        testCases.forEach(({ type, expected }) => {
          const question: AyuQuestion = {
            linkId: `test-${type}`,
            type,
          };

          const result = resolveAyuComponent(question);
          expect(result).toBe(expected);
        });
      });

      it('should return string types for text inputs', () => {
        const result = resolveAyuComponent({
          linkId: 'text-test',
          type: 'string',
        });

        expect(typeof result).toBe('string');
      });
    });
  });

  describe('AyuComponentType', () => {
    it('should export AyuComponentType type', () => {
      // This test ensures the type is exported
      const testType: AyuComponentType = 'text';
      expect(testType).toBe('text');
    });

    it('should include all valid component types', () => {
      const validTypes: AyuComponentType[] = [
        'group',
        'display',
        'text',
        'repeatable-text',
        'number',
        'date',
        'select',
        'multi-select',
        'radio',
        'selectableOptionGroup',
        'quantity',
      ];

      validTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });
});
