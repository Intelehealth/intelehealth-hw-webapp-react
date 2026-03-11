import { describe, expect, it } from 'vitest';
import * as ayuLibrary from '../../../modules/ayu-library/index';

describe('ayu-library barrel export', () => {
  describe('Utils', () => {
    it('should export safeJsonParse', () => {
      expect(typeof ayuLibrary.safeJsonParse).toBe('function');
    });

    it('should export collectDescendantLinkIds', () => {
      expect(typeof ayuLibrary.collectDescendantLinkIds).toBe('function');
    });

    it('should export clearHiddenDescendantAnswers', () => {
      expect(typeof ayuLibrary.clearHiddenDescendantAnswers).toBe('function');
    });

    it('should export SELECT_ONE_OR_MORE', () => {
      expect(ayuLibrary.SELECT_ONE_OR_MORE).toBe('Select one or more');
    });

    it('should export SELECT_ANY_ONE', () => {
      expect(ayuLibrary.SELECT_ANY_ONE).toBe('Select any one');
    });

    it('should export EXCLUDED_JSON_NAMES', () => {
      expect(Array.isArray(ayuLibrary.EXCLUDED_JSON_NAMES)).toBe(true);
    });

    it('should export DURATION_DROPDOWN_CONFIGS', () => {
      expect(Array.isArray(ayuLibrary.DURATION_DROPDOWN_CONFIGS)).toBe(true);
    });

    it('should export normalizeType', () => {
      expect(typeof ayuLibrary.normalizeType).toBe('function');
    });

    it('should export transformFhirToAyu', () => {
      expect(typeof ayuLibrary.transformFhirToAyu).toBe('function');
    });

    it('should export resolveLabel', () => {
      expect(typeof ayuLibrary.resolveLabel).toBe('function');
    });
  });

  describe('Logic', () => {
    it('should export resolveAyuComponent', () => {
      expect(typeof ayuLibrary.resolveAyuComponent).toBe('function');
    });

    it('should export evaluateEnableWhen', () => {
      expect(typeof ayuLibrary.evaluateEnableWhen).toBe('function');
    });

    it('should export isDurationAnswer', () => {
      expect(typeof ayuLibrary.isDurationAnswer).toBe('function');
    });

    it('should export isMutuallyExclusiveOption', () => {
      expect(typeof ayuLibrary.isMutuallyExclusiveOption).toBe('function');
    });

    it('should export computeMultiSelectToggle', () => {
      expect(typeof ayuLibrary.computeMultiSelectToggle).toBe('function');
    });

    it('should export isTopLevelComplete', () => {
      expect(typeof ayuLibrary.isTopLevelComplete).toBe('function');
    });

    it('should export parseYesNoValues', () => {
      expect(typeof ayuLibrary.parseYesNoValues).toBe('function');
    });

    it('should export toggleAssociatedSymptom', () => {
      expect(typeof ayuLibrary.toggleAssociatedSymptom).toBe('function');
    });

    it('should export isEmpty', () => {
      expect(typeof ayuLibrary.isEmpty).toBe('function');
    });

    it('should export hasVisibleRequiredNestedString', () => {
      expect(typeof ayuLibrary.hasVisibleRequiredNestedString).toBe('function');
    });

    it('should export isQuantityInvalid', () => {
      expect(typeof ayuLibrary.isQuantityInvalid).toBe('function');
    });

    it('should export extractVisitReasonNames', () => {
      expect(typeof ayuLibrary.extractVisitReasonNames).toBe('function');
    });

    it('should export filterNamesBySearch', () => {
      expect(typeof ayuLibrary.filterNamesBySearch).toBe('function');
    });

    it('should export groupByFirstLetter', () => {
      expect(typeof ayuLibrary.groupByFirstLetter).toBe('function');
    });

    it('should export buildVisitSummary', () => {
      expect(typeof ayuLibrary.buildVisitSummary).toBe('function');
    });
  });

  describe('functional smoke tests via barrel', () => {
    it('safeJsonParse should work through barrel export', () => {
      expect(ayuLibrary.safeJsonParse('{"a":1}')).toEqual({ a: 1 });
      expect(ayuLibrary.safeJsonParse('invalid')).toBeNull();
    });

    it('evaluateEnableWhen should work through barrel export', () => {
      expect(ayuLibrary.evaluateEnableWhen(undefined, {})).toBe(true);
      expect(
        ayuLibrary.evaluateEnableWhen(
          [{ question: 'q1', operator: '=', answerString: 'yes' }],
          { q1: 'yes' }
        )
      ).toBe(true);
    });

    it('resolveAyuComponent should work through barrel export', () => {
      expect(
        ayuLibrary.resolveAyuComponent({ linkId: 'q', type: 'string' })
      ).toBe('text');
    });

    it('isEmpty should work through barrel export', () => {
      expect(ayuLibrary.isEmpty(undefined)).toBe(true);
      expect(ayuLibrary.isEmpty('hello')).toBe(false);
    });

    it('isDurationAnswer should work through barrel export', () => {
      expect(
        ayuLibrary.isDurationAnswer({ dropdownValues: { number: 1 } })
      ).toBe(true);
      expect(ayuLibrary.isDurationAnswer('string')).toBe(false);
    });
  });
});
