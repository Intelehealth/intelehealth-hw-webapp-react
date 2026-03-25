import { describe, expect, it } from 'vitest';
import {
  calculateBMI,
  calculateWHR,
  createVitalsValidationSchema,
  getBMIStatus,
  isBPHigh,
  VITAL_RANGES,
} from '../../../../../modules/ayu/components/start-visit/vitals/vitals.validation';
import type { VitalField } from '../../../../../modules/ayu/types/vitals.types';

describe('vitals.validation', () => {
  describe('VITAL_RANGES', () => {
    it('should have correct ranges for all vital fields', () => {
      expect(VITAL_RANGES.height_cm).toEqual({ min: 50, max: 250 });
      expect(VITAL_RANGES.weight_kg).toEqual({ min: 2, max: 300 });
      expect(VITAL_RANGES.bmi).toEqual({ min: 10, max: 60 });
      expect(VITAL_RANGES.bp_systolic).toEqual({ min: 70, max: 200, warning_high: 140 });
      expect(VITAL_RANGES.bp_diastolic).toEqual({ min: 40, max: 130, warning_high: 90 });
      expect(VITAL_RANGES.pulse_bpm).toEqual({ min: 30, max: 200 });
      expect(VITAL_RANGES.temprature_f).toEqual({ min: 90, max: 110 });
      expect(VITAL_RANGES.spo2).toEqual({ min: 50, max: 100 });
      expect(VITAL_RANGES.respiratory_rate).toEqual({ min: 8, max: 60 });
    });
  });

  describe('calculateBMI', () => {
    it('should calculate BMI correctly', () => {
      const bmi = calculateBMI(170, 70);
      expect(bmi).toBeCloseTo(24.2, 1);
    });

    it('should return BMI with one decimal place', () => {
      const bmi = calculateBMI(180, 80);
      expect(bmi?.toString()).toMatch(/^\d+\.\d$/);
    });

    it('should return undefined when height is undefined', () => {
      expect(calculateBMI(undefined, 70)).toBeUndefined();
    });

    it('should return undefined when weight is undefined', () => {
      expect(calculateBMI(170, undefined)).toBeUndefined();
    });

    it('should return undefined when height is zero', () => {
      expect(calculateBMI(0, 70)).toBeUndefined();
    });

    it('should return undefined when height is negative', () => {
      expect(calculateBMI(-170, 70)).toBeUndefined();
    });

    it('should handle very tall person', () => {
      const bmi = calculateBMI(220, 100);
      expect(bmi).toBeCloseTo(20.7, 1);
    });

    it('should handle very short person', () => {
      const bmi = calculateBMI(100, 30);
      expect(bmi).toBeCloseTo(30.0, 1);
    });

    it('should calculate BMI for underweight person', () => {
      const bmi = calculateBMI(180, 60);
      expect(bmi).toBeCloseTo(18.5, 1);
    });

    it('should calculate BMI for obese person', () => {
      const bmi = calculateBMI(170, 100);
      expect(bmi).toBeCloseTo(34.6, 1);
    });
  });

  describe('calculateWHR', () => {
    it('should calculate waist to hip ratio correctly', () => {
      const whr = calculateWHR(80, 100);
      expect(whr).toBe(0.8);
    });

    it('should return ratio with two decimal places', () => {
      const whr = calculateWHR(85, 100);
      expect(whr?.toString()).toMatch(/^\d+\.\d{2}$/);
    });

    it('should return undefined when waist is undefined', () => {
      expect(calculateWHR(undefined, 100)).toBeUndefined();
    });

    it('should return undefined when hip is undefined', () => {
      expect(calculateWHR(80, undefined)).toBeUndefined();
    });

    it('should return undefined when hip is zero', () => {
      expect(calculateWHR(80, 0)).toBeUndefined();
    });

    it('should return undefined when hip is negative', () => {
      expect(calculateWHR(80, -100)).toBeUndefined();
    });

    it('should handle high WHR', () => {
      const whr = calculateWHR(100, 90);
      expect(whr).toBeCloseTo(1.11, 2);
    });

    it('should handle low WHR', () => {
      const whr = calculateWHR(70, 100);
      expect(whr).toBe(0.7);
    });
  });

  describe('getBMIStatus', () => {
    it('should return empty string for undefined BMI', () => {
      expect(getBMIStatus(undefined)).toBe('');
    });

    it('should return "Underweight" for BMI less than 18.5', () => {
      expect(getBMIStatus(15)).toBe('Underweight');
      expect(getBMIStatus(18)).toBe('Underweight');
      expect(getBMIStatus(18.4)).toBe('Underweight');
    });

    it('should return "Normal" for BMI between 18.5 and 24.9', () => {
      expect(getBMIStatus(18.5)).toBe('Normal');
      expect(getBMIStatus(20)).toBe('Normal');
      expect(getBMIStatus(24.9)).toBe('Normal');
    });

    it('should return "Overweight" for BMI between 25 and 29.9', () => {
      expect(getBMIStatus(25)).toBe('Overweight');
      expect(getBMIStatus(27)).toBe('Overweight');
      expect(getBMIStatus(29.9)).toBe('Overweight');
    });

    it('should return "Obese" for BMI 30 and above', () => {
      expect(getBMIStatus(30)).toBe('Obese');
      expect(getBMIStatus(35)).toBe('Obese');
      expect(getBMIStatus(40)).toBe('Obese');
    });

    it('should handle edge case at 18.5 boundary', () => {
      expect(getBMIStatus(18.49)).toBe('Underweight');
      expect(getBMIStatus(18.5)).toBe('Normal');
    });

    it('should handle edge case at 25 boundary', () => {
      expect(getBMIStatus(24.99)).toBe('Normal');
      expect(getBMIStatus(25)).toBe('Overweight');
    });

    it('should handle edge case at 30 boundary', () => {
      expect(getBMIStatus(29.99)).toBe('Overweight');
      expect(getBMIStatus(30)).toBe('Obese');
    });
  });

  describe('isBPHigh', () => {
    it('should return false when both values are undefined', () => {
      expect(isBPHigh(undefined, undefined)).toBe(false);
    });

    it('should return true when systolic is at warning threshold', () => {
      expect(isBPHigh(140, undefined)).toBe(true);
    });

    it('should return true when systolic is above warning threshold', () => {
      expect(isBPHigh(150, undefined)).toBe(true);
      expect(isBPHigh(180, undefined)).toBe(true);
    });

    it('should return false when systolic is below warning threshold', () => {
      expect(isBPHigh(139, undefined)).toBe(false);
      expect(isBPHigh(120, undefined)).toBe(false);
    });

    it('should return true when diastolic is at warning threshold', () => {
      expect(isBPHigh(undefined, 90)).toBe(true);
    });

    it('should return true when diastolic is above warning threshold', () => {
      expect(isBPHigh(undefined, 95)).toBe(true);
      expect(isBPHigh(undefined, 110)).toBe(true);
    });

    it('should return false when diastolic is below warning threshold', () => {
      expect(isBPHigh(undefined, 89)).toBe(false);
      expect(isBPHigh(undefined, 80)).toBe(false);
    });

    it('should return true when either value is high', () => {
      expect(isBPHigh(140, 80)).toBe(true);
      expect(isBPHigh(120, 90)).toBe(true);
      expect(isBPHigh(140, 90)).toBe(true);
    });

    it('should return false when both values are normal', () => {
      expect(isBPHigh(120, 80)).toBe(false);
      expect(isBPHigh(130, 85)).toBe(false);
    });
  });

  describe('createVitalsValidationSchema', () => {
    const mockNumberField: VitalField = {
      uuid: '1',
      key: 'height_cm',
      name: 'Height',
      is_enabled: true,
      is_mandatory: true,
      lang: null,
    };

    const mockBloodGroupField: VitalField = {
      uuid: '2',
      key: 'blood_group',
      name: 'Blood Group',
      is_enabled: true,
      is_mandatory: true,
      lang: null,
    };

    it('should create schema with required field', async () => {
      const schema = createVitalsValidationSchema([mockNumberField]);
      await expect(schema.validate({ height_cm: 170 })).resolves.toBeDefined();
      await expect(schema.validate({})).rejects.toThrow('Height is required');
    });

    it('should create schema with optional field', async () => {
      const optionalField: VitalField = {
        ...mockNumberField,
        is_mandatory: false,
      };
      const schema = createVitalsValidationSchema([optionalField]);
      await expect(schema.validate({})).resolves.toBeDefined();
    });

    it('should skip disabled fields', async () => {
      const disabledField: VitalField = {
        ...mockNumberField,
        is_enabled: false,
      };
      const schema = createVitalsValidationSchema([disabledField]);
      await expect(schema.validate({})).resolves.toBeDefined();
    });

    it('should validate number field with range', async () => {
      const schema = createVitalsValidationSchema([mockNumberField]);
      await expect(schema.validate({ height_cm: 170 })).resolves.toBeDefined();
      await expect(schema.validate({ height_cm: 40 })).rejects.toThrow('Height must be at least 50');
      await expect(schema.validate({ height_cm: 300 })).rejects.toThrow('Height must be at most 250');
    });

    it('should handle blood group as string', async () => {
      const schema = createVitalsValidationSchema([mockBloodGroupField]);
      await expect(schema.validate({ blood_group: 'A+' })).resolves.toBeDefined();
      await expect(schema.validate({})).rejects.toThrow('Blood Group is required');
    });

    it('should handle empty string as undefined', async () => {
      const optionalField: VitalField = {
        ...mockNumberField,
        is_mandatory: false,
      };
      const schema = createVitalsValidationSchema([optionalField]);
      await expect(schema.validate({ height_cm: '' as any })).resolves.toBeDefined();
    });

    it('should validate multiple fields', async () => {
      const fields: VitalField[] = [
        { uuid: '1', key: 'height_cm', name: 'Height', is_enabled: true, is_mandatory: true, lang: null },
        { uuid: '2', key: 'weight_kg', name: 'Weight', is_enabled: true, is_mandatory: true, lang: null },
      ];
      const schema = createVitalsValidationSchema(fields);
      await expect(schema.validate({ height_cm: 170, weight_kg: 70 })).resolves.toBeDefined();
      await expect(schema.validate({ height_cm: 170 })).rejects.toThrow('Weight is required');
    });

    it('should validate BP systolic with range', async () => {
      const field: VitalField = {
        uuid: '1',
        key: 'bp_systolic',
        name: 'BP Systolic',
        is_enabled: true,
        is_mandatory: true,
        lang: null,
      };
      const schema = createVitalsValidationSchema([field]);
      await expect(schema.validate({ bp_systolic: 120 })).resolves.toBeDefined();
      await expect(schema.validate({ bp_systolic: 60 })).rejects.toThrow();
      await expect(schema.validate({ bp_systolic: 210 })).rejects.toThrow();
    });

    it('should validate SpO2 with range', async () => {
      const field: VitalField = {
        uuid: '1',
        key: 'spo2',
        name: 'SpO2',
        is_enabled: true,
        is_mandatory: true,
        lang: null,
      };
      const schema = createVitalsValidationSchema([field]);
      await expect(schema.validate({ spo2: 98 })).resolves.toBeDefined();
      await expect(schema.validate({ spo2: 40 })).rejects.toThrow();
      await expect(schema.validate({ spo2: 110 })).rejects.toThrow();
    });

    it('should show type error for invalid number', async () => {
      const schema = createVitalsValidationSchema([mockNumberField]);
      await expect(schema.validate({ height_cm: 'abc' })).rejects.toThrow('Height must be a valid number');
    });
  });
});
