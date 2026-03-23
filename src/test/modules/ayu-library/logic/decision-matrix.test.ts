import { describe, expect, it } from 'vitest';
import type { AyuQuestion } from '../../../../modules/ayu-library/types/ayu.types';
import { resolveAyuComponent, isStrictAssociatedSymptoms } from '../../../../modules/ayu-library/logic/decision-matrix';
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
    it('should return "associatedSymptoms" when text matches "Associated symptoms"', () => {
      const q = makeQuestion({
        type: 'choice',
        text: 'Associated symptoms',
      });
      expect(resolveAyuComponent(q)).toBe('associatedSymptoms');
    });

    it('should return "associatedSymptoms" for family history text', () => {
      const q = makeQuestion({
        type: 'choice',
        text: 'Do you have a family history of any of the following?*',
      });
      expect(resolveAyuComponent(q)).toBe('associatedSymptoms');
    });

    it('should return "associatedSymptoms" for patient history text', () => {
      const q = makeQuestion({
        type: 'choice',
        text: 'Do you have a history of any of the following?*',
      });
      expect(resolveAyuComponent(q)).toBe('associatedSymptoms');
    });

    it('should not return "associatedSymptoms" for non-matching text', () => {
      const q = makeQuestion({
        type: 'choice',
        text: 'Other text',
      });
      expect(resolveAyuComponent(q)).toBe('selectableOptionGroup');
    });

    it('should not return "associatedSymptoms" for non-choice type', () => {
      const q = makeQuestion({
        type: 'string',
        text: 'Associated symptoms',
      });
      expect(resolveAyuComponent(q)).toBe('text');
    });

    it('should not return "associatedSymptoms" when no text', () => {
      const q = makeQuestion({ type: 'choice' });
      expect(resolveAyuComponent(q)).toBe('selectableOptionGroup');
    });
  });

  describe('isStrictAssociatedSymptoms', () => {
    it('should return true for choice type with "Associated symptoms" text', () => {
      const q = makeQuestion({ type: 'choice', text: 'Associated symptoms' });
      expect(isStrictAssociatedSymptoms(q)).toBe(true);
    });

    it('should return false for family history text', () => {
      const q = makeQuestion({
        type: 'choice',
        text: 'Do you have a family history of any of the following?*',
      });
      expect(isStrictAssociatedSymptoms(q)).toBe(false);
    });

    it('should return false for patient history text', () => {
      const q = makeQuestion({
        type: 'choice',
        text: 'Do you have a history of any of the following?*',
      });
      expect(isStrictAssociatedSymptoms(q)).toBe(false);
    });

    it('should return false for non-choice type', () => {
      const q = makeQuestion({ type: 'string', text: 'Associated symptoms' });
      expect(isStrictAssociatedSymptoms(q)).toBe(false);
    });

    it('should return false for choice without matching text', () => {
      const q = makeQuestion({ type: 'choice', text: 'Other question' });
      expect(isStrictAssociatedSymptoms(q)).toBe(false);
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
