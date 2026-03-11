import { describe, expect, it } from 'vitest';
import type { AyuQuestion } from '../../../../modules/ayu-library/types/ayu.types';
import { resolveAyuComponent } from '../../../../modules/ayu-library/logic/decision-matrix';
import type { AyuComponentType } from '../../../../modules/ayu-library/logic/decision-matrix';

const makeQuestion = (overrides: Partial<AyuQuestion> = {}): AyuQuestion => ({
  linkId: 'test-q',
  type: 'string',
  ...overrides,
});

describe('resolveAyuComponent', () => {
  describe('basic type mapping', () => {
    it('should return "group" for group type', () => {
      expect(resolveAyuComponent(makeQuestion({ type: 'group' }))).toBe('group');
    });

    it('should return "display" for display type', () => {
      expect(resolveAyuComponent(makeQuestion({ type: 'display' }))).toBe('display');
    });

    it('should return "text" for string type', () => {
      expect(resolveAyuComponent(makeQuestion({ type: 'string' }))).toBe('text');
    });

    it('should return "repeatable-text" for string with repeats', () => {
      expect(
        resolveAyuComponent(makeQuestion({ type: 'string', repeats: true }))
      ).toBe('repeatable-text');
    });

    it('should return "number" for integer type', () => {
      expect(resolveAyuComponent(makeQuestion({ type: 'integer' }))).toBe('number');
    });

    it('should return "number" for decimal type', () => {
      expect(resolveAyuComponent(makeQuestion({ type: 'decimal' }))).toBe('number');
    });

    it('should return "date" for date type', () => {
      expect(resolveAyuComponent(makeQuestion({ type: 'date' }))).toBe('date');
    });

    it('should return "quantity" for quantity type', () => {
      expect(resolveAyuComponent(makeQuestion({ type: 'quantity' }))).toBe('quantity');
    });

    it('should return "selectableOptionGroup" for choice type', () => {
      expect(resolveAyuComponent(makeQuestion({ type: 'choice' }))).toBe(
        'selectableOptionGroup'
      );
    });

    it('should return "text" for unknown types (default)', () => {
      expect(resolveAyuComponent(makeQuestion({ type: 'unknown' }))).toBe('text');
    });
  });

  describe('associated symptoms detection', () => {
    it('should return "associatedSymptoms" when extension matches', () => {
      const q = makeQuestion({
        type: 'choice',
        extension: [
          {
            url: 'urn:intelehealth:original-question-text',
            valueString: 'Associated symptoms',
          },
        ],
      });
      expect(resolveAyuComponent(q)).toBe('associatedSymptoms');
    });

    it('should not return "associatedSymptoms" for wrong extension URL', () => {
      const q = makeQuestion({
        type: 'choice',
        extension: [
          {
            url: 'urn:other:extension',
            valueString: 'Associated symptoms',
          },
        ],
      });
      expect(resolveAyuComponent(q)).toBe('selectableOptionGroup');
    });

    it('should not return "associatedSymptoms" for wrong valueString', () => {
      const q = makeQuestion({
        type: 'choice',
        extension: [
          {
            url: 'urn:intelehealth:original-question-text',
            valueString: 'Other text',
          },
        ],
      });
      expect(resolveAyuComponent(q)).toBe('selectableOptionGroup');
    });

    it('should not return "associatedSymptoms" for non-choice type', () => {
      const q = makeQuestion({
        type: 'string',
        extension: [
          {
            url: 'urn:intelehealth:original-question-text',
            valueString: 'Associated symptoms',
          },
        ],
      });
      expect(resolveAyuComponent(q)).toBe('text');
    });

    it('should not return "associatedSymptoms" when no extensions', () => {
      const q = makeQuestion({ type: 'choice' });
      expect(resolveAyuComponent(q)).toBe('selectableOptionGroup');
    });
  });

  describe('type consistency', () => {
    it('should return valid AyuComponentType values', () => {
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
        'associatedSymptoms',
      ];

      const types = [
        'group',
        'display',
        'string',
        'integer',
        'decimal',
        'date',
        'choice',
        'quantity',
      ];

      for (const type of types) {
        const result = resolveAyuComponent(makeQuestion({ type }));
        expect(validTypes).toContain(result);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle question with empty extension array', () => {
      const q = makeQuestion({ type: 'choice', extension: [] });
      expect(resolveAyuComponent(q)).toBe('selectableOptionGroup');
    });

    it('should handle string with repeats=false', () => {
      const q = makeQuestion({ type: 'string', repeats: false });
      expect(resolveAyuComponent(q)).toBe('text');
    });

    it('should handle choice with repeats (still selectableOptionGroup)', () => {
      const q = makeQuestion({ type: 'choice', repeats: true });
      expect(resolveAyuComponent(q)).toBe('selectableOptionGroup');
    });
  });
});
