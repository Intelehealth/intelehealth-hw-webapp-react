import { describe, expect, it } from 'vitest';
import {
  DURATION_DROPDOWN_CONFIGS,
  SELECT_ANY_ONE,
  SELECT_ONE_OR_MORE,
} from '../../../../modules/ayu-library/utils/constants';

describe('Constants', () => {
  describe('Nested Question Helper Text', () => {
    it('should export SELECT_ONE_OR_MORE constant', () => {
      expect(SELECT_ONE_OR_MORE).toBeDefined();
      expect(typeof SELECT_ONE_OR_MORE).toBe('string');
      expect(SELECT_ONE_OR_MORE).toBe('Select one or more');
    });

    it('should export SELECT_ANY_ONE constant', () => {
      expect(SELECT_ANY_ONE).toBeDefined();
      expect(typeof SELECT_ANY_ONE).toBe('string');
      expect(SELECT_ANY_ONE).toBe('Select any one');
    });
  });

  describe('DURATION_DROPDOWN_CONFIGS', () => {
    it('should export DURATION_DROPDOWN_CONFIGS array', () => {
      expect(DURATION_DROPDOWN_CONFIGS).toBeDefined();
      expect(Array.isArray(DURATION_DROPDOWN_CONFIGS)).toBe(true);
    });

    it('should have exactly 2 dropdown configs', () => {
      expect(DURATION_DROPDOWN_CONFIGS).toHaveLength(2);
    });

    describe('Number Dropdown Config', () => {
      const numberConfig = DURATION_DROPDOWN_CONFIGS![0];

      it('should have correct structure for number dropdown config', () => {
        expect(numberConfig).toBeDefined();
        expect(numberConfig).toHaveProperty('id');
        expect(numberConfig).toHaveProperty('placeholder');
        expect(numberConfig).toHaveProperty('options');
      });

      it('should have id "number"', () => {
        expect(numberConfig.id).toBe('number');
      });

      it('should have placeholder "Number"', () => {
        expect(numberConfig.placeholder).toBe('Number');
      });

      it('should have options array', () => {
        expect(Array.isArray(numberConfig.options)).toBe(true);
      });

      it('should generate number options from 1 to 100', () => {
        expect(numberConfig.options).toHaveLength(100);

        // Check first option
        expect(numberConfig.options[0]).toEqual({
          label: '1',
          value: 1,
        });

        // Check last option
        expect(numberConfig.options[99]).toEqual({
          label: '100',
          value: 100,
        });

        // Check a middle option
        expect(numberConfig.options[49]).toEqual({
          label: '50',
          value: 50,
        });
      });

      it('should have sequential number options', () => {
        for (let i = 0; i < numberConfig.options.length; i++) {
          expect(numberConfig.options[i].value).toBe(i + 1);
          expect(numberConfig.options[i].label).toBe(String(i + 1));
        }
      });
    });

    describe('Duration Type Dropdown Config', () => {
      const daysConfig = DURATION_DROPDOWN_CONFIGS![1];

      it('should have correct structure for days dropdown config', () => {
        expect(daysConfig).toBeDefined();
        expect(daysConfig).toHaveProperty('id');
        expect(daysConfig).toHaveProperty('placeholder');
        expect(daysConfig).toHaveProperty('options');
      });

      it('should have id "days"', () => {
        expect(daysConfig.id).toBe('days');
      });

      it('should have placeholder "Duration Type"', () => {
        expect(daysConfig.placeholder).toBe('Duration Type');
      });

      it('should have correct duration type options', () => {
        expect(daysConfig.options).toHaveLength(5);

        expect(daysConfig.options[0]).toEqual({
          label: 'Hours',
          value: 'hours',
        });

        expect(daysConfig.options[1]).toEqual({
          label: 'Days',
          value: 'days',
        });

        expect(daysConfig.options[2]).toEqual({
          label: 'Weeks',
          value: 'weeks',
        });

        expect(daysConfig.options[3]).toEqual({
          label: 'Months',
          value: 'months',
        });

        expect(daysConfig.options[4]).toEqual({
          label: 'Years',
          value: 'years',
        });
      });

      it('should have options in correct order', () => {
        const expectedOrder = ['hours', 'days', 'weeks', 'months', 'years'];
        const actualOrder = daysConfig.options.map(opt => opt.value);

        expect(actualOrder).toEqual(expectedOrder);
      });

      it('should have capitalized labels', () => {
        daysConfig.options.forEach(option => {
          expect(option.label[0]).toBe(option.label[0].toUpperCase());
        });
      });
    });

    describe('Option Structure Validation', () => {
      it('all options should have label and value properties', () => {
        DURATION_DROPDOWN_CONFIGS!.forEach(config => {
          config.options.forEach(option => {
            expect(option).toHaveProperty('label');
            expect(option).toHaveProperty('value');
          });
        });
      });

      it('all labels should be strings', () => {
        DURATION_DROPDOWN_CONFIGS!.forEach(config => {
          config.options.forEach(option => {
            expect(typeof option.label).toBe('string');
          });
        });
      });

      it('number config values should be numbers', () => {
        const numberConfig = DURATION_DROPDOWN_CONFIGS![0];
        numberConfig.options.forEach(option => {
          expect(typeof option.value).toBe('number');
        });
      });

      it('duration type config values should be strings', () => {
        const daysConfig = DURATION_DROPDOWN_CONFIGS![1];
        daysConfig.options.forEach(option => {
          expect(typeof option.value).toBe('string');
        });
      });
    });

    describe('Configuration Completeness', () => {
      it('should not have any undefined or null options', () => {
        DURATION_DROPDOWN_CONFIGS!.forEach(config => {
          expect(config).not.toBeNull();
          expect(config).not.toBeUndefined();
          expect(config.options).not.toBeNull();
          expect(config.options).not.toBeUndefined();

          config.options.forEach(option => {
            expect(option).not.toBeNull();
            expect(option).not.toBeUndefined();
            expect(option.label).not.toBeNull();
            expect(option.label).not.toBeUndefined();
            expect(option.value).not.toBeNull();
            expect(option.value).not.toBeUndefined();
          });
        });
      });

      it('should not have duplicate values in number options', () => {
        const numberConfig = DURATION_DROPDOWN_CONFIGS![0];
        const values = numberConfig.options.map(opt => opt.value);
        const uniqueValues = new Set(values);

        expect(uniqueValues.size).toBe(values.length);
      });

      it('should not have duplicate values in duration type options', () => {
        const daysConfig = DURATION_DROPDOWN_CONFIGS![1];
        const values = daysConfig.options.map(opt => opt.value);
        const uniqueValues = new Set(values);

        expect(uniqueValues.size).toBe(values.length);
      });
    });
  });
});
