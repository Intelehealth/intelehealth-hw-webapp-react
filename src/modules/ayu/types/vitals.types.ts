// Import and re-export VitalModel from config as VitalField for component use
import type { VitalModel } from '../../../types/config.types';

export type VitalField = VitalModel;

export interface VitalsFormValues {
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse_bpm?: number;
  temprature_f?: number;
  spo2?: number;
  respiratory_rate?: number;
  fbs_mg_per_dl?: number;
  ppbs_mg_per_dl?: number;
  rbs_mg_per_dl?: number;
  waist_circumference_cm?: number;
  hip_circumference_cm?: number;
  waist_to_hip_ratio?: number;
  ogtt_mg_per_dl?: number;
  hba1c?: number;
  blood_group?: string;
}

export interface VitalsSection {
  title: string;
  fields: VitalField[];
}
