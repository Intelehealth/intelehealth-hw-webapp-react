import { describe, expect, it } from 'vitest';
import {
  EXT_URL_ORIGINAL_QUESTION_TEXT,
  EXT_URL_MUTUALLY_EXCLUSIVE,
  ASSOCIATED_SYMPTOMS_TEXT,
  NEGATED_PREFIX,
  NEGATED_ID_PREFIX,
  PATIENT_REPORTS_LABEL,
  PATIENT_DENIES_LABEL,
  SELECT_ONE_OR_MORE,
  SELECT_ANY_ONE,
  SELECT_YES_OR_NO,
  EXCLUDED_JSON_NAMES,
  DURATION_DROPDOWN_CONFIGS,
  PE_BP_FIELD_RANGES,
  getBPRangeFromText,
} from '../../../../modules/ayu-library/utils/constants';

describe('Constants', () => {
  describe('FHIR Extension URLs', () => {
    it('should export EXT_URL_ORIGINAL_QUESTION_TEXT', () => {
      expect(EXT_URL_ORIGINAL_QUESTION_TEXT).toBe('urn:intelehealth:original-question-text');
    });

    it('should export EXT_URL_MUTUALLY_EXCLUSIVE', () => {
      expect(EXT_URL_MUTUALLY_EXCLUSIVE).toBe('https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice');
    });
  });

  describe('Associated Symptoms Constants', () => {
    it('should export ASSOCIATED_SYMPTOMS_TEXT', () => {
      expect(ASSOCIATED_SYMPTOMS_TEXT).toBe('Associated symptoms');
    });

    it('should export NEGATED_PREFIX', () => {
      expect(NEGATED_PREFIX).toBe('NO_');
    });

    it('should export NEGATED_ID_PREFIX', () => {
      expect(NEGATED_ID_PREFIX).toBe('NO_ID_');
    });
  });

  describe('Visit Summary Labels', () => {
    it('should export PATIENT_REPORTS_LABEL', () => {
      expect(PATIENT_REPORTS_LABEL).toBe('Patient reports');
    });

    it('should export PATIENT_DENIES_LABEL', () => {
      expect(PATIENT_DENIES_LABEL).toBe('Patient denies');
    });
  });

  describe('Nested Question Helper Text', () => {
    it('should export SELECT_ONE_OR_MORE constant', () => {
      expect(SELECT_ONE_OR_MORE).toBe('Select one or more');
    });

    it('should export SELECT_ANY_ONE constant', () => {
      expect(SELECT_ANY_ONE).toBe('Select any one');
    });

    it('should export SELECT_YES_OR_NO constant', () => {
      expect(SELECT_YES_OR_NO).toBe('Select yes or no');
    });

    it('should be string type', () => {
      expect(typeof SELECT_ONE_OR_MORE).toBe('string');
      expect(typeof SELECT_ANY_ONE).toBe('string');
      expect(typeof SELECT_YES_OR_NO).toBe('string');
    });
  });

  describe('EXCLUDED_JSON_NAMES', () => {
    it('should contain famHist', () => {
      expect(EXCLUDED_JSON_NAMES).toContain('famHist');
    });

    it('should contain physExam', () => {
      expect(EXCLUDED_JSON_NAMES).toContain('physExam');
    });

    it('should contain patHist', () => {
      expect(EXCLUDED_JSON_NAMES).toContain('patHist');
    });

    it('should have exactly 3 entries', () => {
      expect(EXCLUDED_JSON_NAMES).toHaveLength(3);
    });
  });

  describe('PE_BP_FIELD_RANGES', () => {
    it('should have systolic range 60–260', () => {
      expect(PE_BP_FIELD_RANGES.systolic).toEqual({ min: 60, max: 260 });
    });

    it('should have diastolic range 30–150', () => {
      expect(PE_BP_FIELD_RANGES.diastolic).toEqual({ min: 30, max: 150 });
    });

    it('should have exactly 2 entries', () => {
      expect(Object.keys(PE_BP_FIELD_RANGES)).toHaveLength(2);
    });
  });

  describe('getBPRangeFromText', () => {
    it('should return systolic range for text containing "systolic"', () => {
      expect(getBPRangeFromText('Enter systolic BP')).toEqual({ min: 60, max: 260 });
    });

    it('should return diastolic range for text containing "diastolic"', () => {
      expect(getBPRangeFromText('Enter diastolic BP')).toEqual({ min: 30, max: 150 });
    });

    it('should be case-insensitive', () => {
      expect(getBPRangeFromText('Enter Systolic BP')).toEqual({ min: 60, max: 260 });
      expect(getBPRangeFromText('DIASTOLIC reading')).toEqual({ min: 30, max: 150 });
    });

    it('should return undefined for text without BP keywords', () => {
      expect(getBPRangeFromText('Enter pulse rate')).toBeUndefined();
    });

    it('should return undefined for undefined text', () => {
      expect(getBPRangeFromText(undefined)).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(getBPRangeFromText('')).toBeUndefined();
    });
  });

  describe('DURATION_DROPDOWN_CONFIGS', () => {
    it('should be an array of 2 configs', () => {
      expect(DURATION_DROPDOWN_CONFIGS).toHaveLength(2);
    });

    describe('Number config', () => {
      it('should have id "number"', () => {
        expect(DURATION_DROPDOWN_CONFIGS![0].id).toBe('number');
      });

      it('should have placeholder "Number"', () => {
        expect(DURATION_DROPDOWN_CONFIGS![0].placeholder).toBe('Number');
      });

      it('should have 100 options (1-100)', () => {
        const options = DURATION_DROPDOWN_CONFIGS![0].options;
        expect(options).toHaveLength(100);
      });

      it('should start at 1', () => {
        expect(DURATION_DROPDOWN_CONFIGS![0].options[0]).toEqual({
          label: '1',
          value: 1,
        });
      });

      it('should end at 100', () => {
        expect(DURATION_DROPDOWN_CONFIGS![0].options[99]).toEqual({
          label: '100',
          value: 100,
        });
      });

      it('should have sequential values', () => {
        const options = DURATION_DROPDOWN_CONFIGS![0].options;
        for (let i = 0; i < options.length; i++) {
          expect(options[i].value).toBe(i + 1);
          expect(options[i].label).toBe(String(i + 1));
        }
      });
    });

    describe('Duration Type config', () => {
      it('should have id "days"', () => {
        expect(DURATION_DROPDOWN_CONFIGS![1].id).toBe('days');
      });

      it('should have placeholder "Duration Type"', () => {
        expect(DURATION_DROPDOWN_CONFIGS![1].placeholder).toBe('Duration Type');
      });

      it('should have 5 duration options', () => {
        expect(DURATION_DROPDOWN_CONFIGS![1].options).toHaveLength(5);
      });

      it('should contain hours, days, weeks, months, years', () => {
        const values = DURATION_DROPDOWN_CONFIGS![1].options.map(o => o.value);
        expect(values).toEqual(['hours', 'days', 'weeks', 'months', 'years']);
      });

      it('should have capitalized labels', () => {
        const labels = DURATION_DROPDOWN_CONFIGS![1].options.map(o => o.label);
        expect(labels).toEqual([
          'Hours',
          'Days',
          'Weeks',
          'Months',
          'Years',
        ]);
      });
    });
  });
});
