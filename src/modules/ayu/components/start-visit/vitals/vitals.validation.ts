import * as yup from 'yup';
import type { VitalField, VitalsFormValues } from '../../../types/vitals.types';
import { VITAL_FIELD_KEYS } from './vitals.constants';

// Normal ranges for validation
export const VITAL_RANGES = {
  height_cm: { min: 50, max: 250 },
  weight_kg: { min: 2, max: 300 },
  bmi: { min: 10, max: 60 },
  bp_systolic: { min: 70, max: 200, warning_high: 140 },
  bp_diastolic: { min: 40, max: 130, warning_high: 90 },
  pulse_bpm: { min: 30, max: 200 },
  temprature_f: { min: 90, max: 110 },
  spo2: { min: 50, max: 100 },
  respiratory_rate: { min: 8, max: 60 },
  waist_to_hip_ratio: { min: 0.5, max: 1.5 },
};

export const createVitalsValidationSchema = (
  fields: VitalField[]
): yup.ObjectSchema<VitalsFormValues> => {
  const schemaShape: Record<string, yup.NumberSchema | yup.StringSchema> = {};

  fields.forEach(field => {
    if (!field.is_enabled) return;

    // Handle coded fields (e.g. Blood Typing) as string, others as number
    if (field.key === VITAL_FIELD_KEYS.BLOOD_GROUP) {
      let fieldSchema = yup.string();
      if (field.is_mandatory) {
        fieldSchema = fieldSchema.required(`${field.name} is required`);
      }
      schemaShape[field.key] = fieldSchema;
    } else {
      let fieldSchema = yup
        .number()
        .transform((value, originalValue) => {
          // Handle empty string as undefined
          return originalValue === '' ? undefined : value;
        })
        .typeError(`${field.name} must be a valid number`);

      // Auto-calculated fields (BMI, WHR) are set programmatically via
      // setValue — skip required validation but still enforce range checks
      // so that out-of-range values block form submission.
      const isAutoCalculated =
        field.key === 'bmi' || field.key === 'waist_to_hip_ratio';

      // Add range validation if available
      const range = VITAL_RANGES[field.key as keyof typeof VITAL_RANGES];
      if (range) {
        fieldSchema = fieldSchema
          .min(range.min, `${field.name} must be at least ${range.min}`)
          .max(range.max, `${field.name} must be at most ${range.max}`);
      }

      if (!isAutoCalculated) {
        // Add required validation for mandatory fields
        if (field.is_mandatory) {
          fieldSchema = fieldSchema.required(`${field.name} is required`);
        }
      }

      schemaShape[field.key] = fieldSchema;
    }
  });

  return yup.object(schemaShape) as yup.ObjectSchema<VitalsFormValues>;
};

// Calculate BMI from height and weight
export const calculateBMI = (
  height_cm?: number,
  weight_kg?: number
): number | undefined => {
  if (!height_cm || !weight_kg || height_cm <= 0) return undefined;
  const heightInMeters = height_cm / 100;
  return Number((weight_kg / (heightInMeters * heightInMeters)).toFixed(1));
};

// Calculate Waist to Hip Ratio
export const calculateWHR = (
  waist_cm?: number,
  hip_cm?: number
): number | undefined => {
  if (!waist_cm || !hip_cm || hip_cm <= 0) return undefined;
  return Number((waist_cm / hip_cm).toFixed(2));
};

// Get BMI status
export const getBMIStatus = (bmi?: number): string => {
  if (!bmi) return '';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

// Check if a specific BP field is high
export const isBPSystolicHigh = (systolic?: number): boolean => {
  const val = Number(systolic);
  return !isNaN(val) && val > 0 && val >= VITAL_RANGES.bp_systolic.warning_high;
};

export const isBPDiastolicHigh = (diastolic?: number): boolean => {
  const val = Number(diastolic);
  return (
    !isNaN(val) && val > 0 && val >= VITAL_RANGES.bp_diastolic.warning_high
  );
};

export const isBPHigh = (systolic?: number, diastolic?: number): boolean =>
  isBPSystolicHigh(systolic) || isBPDiastolicHigh(diastolic);
