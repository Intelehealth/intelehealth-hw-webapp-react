import { describe, expect, it } from 'vitest';
import {
  SELECT_ONE_OR_MORE,
  SELECT_ANY_ONE,
  EXCLUDED_JSON_NAMES,
  DURATION_DROPDOWN_CONFIGS,
} from '../../../../modules/ayu-library/utils/constants';

describe('Constants', () => {
  describe('Nested Question Helper Text', () => {
    it('should export SELECT_ONE_OR_MORE constant', () => {
      expect(SELECT_ONE_OR_MORE).toBe('Select one or more');
    });

    it('should export SELECT_ANY_ONE constant', () => {
      expect(SELECT_ANY_ONE).toBe('Select any one');
    });

    it('should be string type', () => {
      expect(typeof SELECT_ONE_OR_MORE).toBe('string');
      expect(typeof SELECT_ANY_ONE).toBe('string');
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
