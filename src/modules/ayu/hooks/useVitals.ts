import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import iconVitals from '../../../assets/icons/vitals.svg';
import { useGlobalModal } from '../../../components/modal/global-modal-context';
import { useConfig } from '../../../hooks/useConfig';
import { useStartVisitData } from '../context/start-visit.context';
import {
  calculateBMI,
  calculateWHR,
  createVitalsValidationSchema,
  getBMIStatus,
  isBPHigh,
} from '../components/start-visit/vitals/vitals.validation';
import type { VitalField, VitalsFormValues } from '../types/vitals.types';
// Fallback vitals configuration if API data is not available
const FALLBACK_VITALS_CONFIG: VitalField[] = [
  {
    name: 'Height (cm)',
    key: 'height_cm',
    uuid: '5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    is_mandatory: true,
    lang: {
      as: '',
      bn: '',
      en: 'Height Test (in cm)',
      gu: '',
      hi: '',
      kn: '',
      mr: '',
      or: '',
      ru: 'Рост (см)',
    },
    is_enabled: true,
  },
  {
    name: 'Weight (kg)',
    key: 'weight_kg',
    uuid: '5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    is_mandatory: true,
    lang: {
      as: '',
      bn: '',
      en: 'Weight(in kg)',
      gu: '',
      hi: 'test',
      kn: '',
      mr: '',
      or: '',
      ru: 'Вес (кг)',
    },
    is_enabled: true,
  },
  {
    name: 'BMI',
    key: 'bmi',
    uuid: '9d311fac-538f-11e6-9cfe-86f436325720',
    is_mandatory: true,
    lang: {
      as: '',
      bn: '',
      en: '',
      gu: '',
      hi: '',
      kn: '',
      mr: '',
      or: '',
      ru: '',
    },
    is_enabled: true,
  },
  {
    name: 'BP Systolic',
    key: 'bp_systolic',
    uuid: '5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    is_mandatory: false,
    lang: {
      as: '',
      bn: '',
      en: 'BP Systolic',
      gu: '',
      hi: '',
      kn: '',
      mr: '',
      or: '',
      ru: 'Систолическое АД',
    },
    is_enabled: true,
  },
  {
    name: 'BP Diastolic',
    key: 'bp_diastolic',
    uuid: '5086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    is_mandatory: false,
    lang: {
      as: '',
      bn: '',
      en: 'BP Diastolic',
      gu: '',
      hi: '',
      kn: '',
      mr: '',
      or: '',
      ru: '',
    },
    is_enabled: true,
  },
  {
    name: 'Pulse (bpm)',
    key: 'pulse_bpm',
    uuid: '5087AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    is_mandatory: true,
    lang: null,
    is_enabled: true,
  },
  {
    name: 'Temperature (F)',
    key: 'temprature_f',
    uuid: '5088AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    is_mandatory: false,
    lang: null,
    is_enabled: true,
  },
  {
    name: 'SpO2 (%)',
    key: 'spo2',
    uuid: '5092AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    is_mandatory: false,
    lang: null,
    is_enabled: true,
  },
  {
    name: 'Respiratory Rate',
    key: 'respiratory_rate',
    uuid: '5242AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    is_mandatory: true,
    lang: null,
    is_enabled: true,
  },
  {
    name: 'Fasting Blood Sugar (FBS) (mg/dl)',
    key: 'fbs_mg_per_dl',
    uuid: '2d6845e6-fa7a-4a80-a55a-c4fa6ff4e2af',
    is_mandatory: false,
    lang: {
      as: '',
      bn: '',
      en: 'Fasting Blood Sugar (FBS) (mg/dl)',
      gu: '',
      hi: '',
      kn: '',
      mr: '',
      or: '',
      ru: '',
    },
    is_enabled: true,
  },
  {
    name: 'Post Prandial Blood Sugar (PPBS) (mg/dl)',
    key: 'ppbs_mg_per_dl',
    uuid: 'e2d331f0-3132-4b66-9137-b1f9ace65443',
    is_mandatory: true,
    lang: null,
    is_enabled: true,
  },
  {
    name: 'RBS (mg/dl)',
    key: 'rbs_mg_per_dl',
    uuid: '056f3911-55ee-42c4-8078-5537a620a35a',
    is_mandatory: true,
    lang: null,
    is_enabled: true,
  },
  {
    name: 'Waist Circumference (cm)',
    key: 'waist_circumference_cm',
    uuid: '41e7d3ff-d24b-448f-a248-a4feb64ef700',
    is_mandatory: true,
    lang: null,
    is_enabled: true,
  },
  {
    name: 'Hip Circumference (cm)',
    key: 'hip_circumference_cm',
    uuid: '9f1b264f-2b9b-44f5-9d7a-c809e9f63c51',
    is_mandatory: true,
    lang: null,
    is_enabled: true,
  },
  {
    name: 'Waist to Hip Ratio (WHR)',
    key: 'waist_to_hip_ratio',
    uuid: '20d3e924-f379-443d-9033-c8d1cdfda2f0',
    is_mandatory: true,
    lang: null,
    is_enabled: true,
  },
  {
    name: '2 Hour Post Load Glucose Test (OGTT) (mg/dl)',
    key: 'ogtt_mg_per_dl',
    uuid: 'd7a564d7-f104-4186-8e36-68101c7c2952',
    is_mandatory: true,
    lang: null,
    is_enabled: true,
  },
  {
    name: 'HbA1c',
    key: 'hba1c',
    uuid: 'f0631271-e0b3-48ca-a4e5-70959a7b76d9',
    is_mandatory: true,
    lang: null,
    is_enabled: true,
  },
  {
    name: 'Blood Group',
    key: 'blood_group',
    uuid: '9d2df0c6-538f-11e6-9cfe-86f436325720',
    is_mandatory: false,
    lang: null,
    is_enabled: true,
  },
];

// Group fields into sections
const BODY_MEASUREMENT_KEYS = ['height_cm', 'weight_kg', 'bmi'];
const VITAL_KEYS = [
  'bp_systolic',
  'bp_diastolic',
  'pulse_bpm',
  'respiratory_rate',
  'temprature_f',
  'spo2',
];

export const useVitals = (onNextQuestion: () => void) => {
  // Get vitals configuration from Redux store (populated by getPublishedConfig API)
  const { config } = useConfig();
  const { setVitalsData } = useStartVisitData();

  // Use patient_vitals from API config, fallback to hardcoded config if API data is not available
  const vitalsConfig = useMemo(() => {
    const apiVitals = config?.patient_vitals || [];
    const sourceVitals =
      apiVitals.length > 0 ? apiVitals : FALLBACK_VITALS_CONFIG;
    return sourceVitals.filter((field: VitalField) => field.is_enabled);
  }, [config?.patient_vitals]);

  // Organize fields into sections
  const bodyMeasurementFields = vitalsConfig.filter((field: VitalField) =>
    BODY_MEASUREMENT_KEYS.includes(field.key)
  );
  const vitalFields = vitalsConfig.filter((field: VitalField) =>
    VITAL_KEYS.includes(field.key)
  );
  const otherFields = vitalsConfig.filter(
    (field: VitalField) =>
      !BODY_MEASUREMENT_KEYS.includes(field.key) &&
      !VITAL_KEYS.includes(field.key)
  );

  // Setup form with validation
  // Only create validation schema if we have config
  const validationSchema = useMemo(() => {
    if (vitalsConfig.length === 0) return undefined;
    return createVitalsValidationSchema(vitalsConfig);
  }, [vitalsConfig]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<VitalsFormValues>({
    resolver: validationSchema ? yupResolver(validationSchema) : undefined,
    mode: 'onChange',
  });

  const { showVitalConfirmationModal } = useGlobalModal();
  // Watch values for auto-calculation
  const height = watch('height_cm');
  const weight = watch('weight_kg');
  const waist = watch('waist_circumference_cm');
  const hip = watch('hip_circumference_cm');
  const bpSystolic = watch('bp_systolic');
  const bpDiastolic = watch('bp_diastolic');
  const bmi = watch('bmi');

  // Auto-calculate BMI when height or weight changes
  useEffect(() => {
    const calculatedBMI = calculateBMI(height, weight);
    if (calculatedBMI !== undefined && calculatedBMI !== bmi) {
      setValue('bmi', calculatedBMI);
      trigger('bmi');
    }
  }, [height, weight, bmi, setValue, trigger]);

  // Auto-calculate WHR when waist or hip changes
  useEffect(() => {
    const calculatedWHR = calculateWHR(waist, hip);
    if (calculatedWHR !== undefined) {
      setValue('waist_to_hip_ratio', calculatedWHR);
      trigger('waist_to_hip_ratio');
    }
  }, [waist, hip, setValue, trigger]);

  const onSubmit = () => {
    // TODO: Send vitals data to API
    // The form data will be available via getValues() when needed
    //onNextQuestion();
    showVitalConfirmationModal({
      icon: iconVitals,
      title: '1/4. Vitals summary',
      description: 'Details', //  Global Change button
      onChange: () => {
        // TODO: Implement navigation back to edit vitals
      },
      items: [
        { label: 'Height (cm)', value: watch('height_cm') || null },
        { label: 'Weight (kg)', value: watch('weight_kg') || null },
        { label: 'BMI', value: watch('bmi')?.toString() || null },
        {
          label: 'BP',
          value:
            watch('bp_systolic') && watch('bp_diastolic')
              ? `${watch('bp_systolic') || ''}/${watch('bp_diastolic') || ''}`
              : null,
        },
        { label: 'Pulse (bpm)', value: watch('pulse_bpm') || null },
        { label: 'Respiratory Rate', value: watch('respiratory_rate') || null },
        { label: 'Temperature (F)', value: watch('temprature_f') || null },
        { label: 'SpO2 (%)', value: watch('spo2') || null },
        {
          label: 'Fasting Blood Sugar (FBS) (mg/dl)',
          value: watch('fbs_mg_per_dl') || null,
        },
        {
          label: 'Post Prandial Blood Sugar (PPBS) (mg/dl)',
          value: watch('ppbs_mg_per_dl') || null,
        },
        { label: 'RBS (mg/dl)', value: watch('rbs_mg_per_dl') || null },
        {
          label: 'Waist Circumference (cm)',
          value: watch('waist_circumference_cm') || null,
        },
        {
          label: 'Hip Circumference (cm)',
          value: watch('hip_circumference_cm') || null,
        },
        {
          label: 'Waist to Hip Ratio (WHR)',
          value: watch('waist_to_hip_ratio')?.toString() || null,
        },
        {
          label: '2 Hour Post Load Glucose Test (OGTT) (mg/dl)',
          value: watch('ogtt_mg_per_dl') || null,
        },
        { label: 'HbA1c', value: watch('hba1c') || null },
        { label: 'Blood Group', value: watch('blood_group') || null },
      ],
      confirmText: 'Confirm',
      cancelText: 'Back',
      open: false,
      type: 'vitalConfirm',
      onConfirm: () => {
        const formValues = watch() as VitalsFormValues;
        setVitalsData(formValues, vitalsConfig);
        onNextQuestion();
      },
    });
  };

  // Check if config is loaded - with fallback data, we should always have vitals
  // Only show loading if vitalsConfig is somehow empty (shouldn't happen with fallback)
  const isLoading = vitalsConfig.length === 0;

  return {
    // Form state
    register,
    handleSubmit,
    watch,
    errors,

    // Field groups
    bodyMeasurementFields,
    vitalFields,
    otherFields,

    // Handlers
    onSubmit,

    // Loading state
    isLoading,

    // Watched values for conditional rendering
    bpSystolic,
    bpDiastolic,

    // Utility functions (re-exported for component use)
    getBMIStatus,
    isBPHigh,
  };
};
