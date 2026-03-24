import type { SectionProps } from '../../../../ayu-library/types/start-visit.types';
import { useVitals } from '../../../hooks/useVitals';
import type { VitalField, VitalsFormValues } from '../../../types/vitals.types';
import AyuButton from '../../common/ayu-button.component';
import { VITAL_RANGES } from './vitals.validation';

const TOTAL_QUESTIONS = 10;

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const getPlaceholder = (key: string): string => {
  const placeholders: Record<string, string> = {
    height_cm: '172 cm',
    weight_kg: '63 kg',
    bmi: '22.5',
    bp_systolic: '120 mmHg',
    bp_diastolic: '80 mmHg',
    pulse_bpm: '72 bpm',
    respiratory_rate: '18 breaths/min',
    temprature_f: '98.6 °F',
    spo2: '98%',
    fbs_mg_per_dl: '90 mg/dL',
    ppbs_mg_per_dl: '140 mg/dL',
    rbs_mg_per_dl: '110 mg/dL',
    waist_circumference_cm: '80 cm',
    hip_circumference_cm: '95 cm',
    waist_to_hip_ratio: '0.85',
    ogtt_mg_per_dl: '140 mg/dL',
    hba1c: '5.7%',
    blood_group: 'A+, B-, O+, AB+',
  };
  return placeholders[key] || '';
};

export const Vitals = ({ questionIndex, onNextQuestion }: SectionProps) => {
  const isLast = questionIndex === TOTAL_QUESTIONS - 1;

  const {
    register,
    handleSubmit,
    watch,
    errors,
    bodyMeasurementFields,
    vitalFields,
    otherFields,
    onSubmit,
    isLoading,
    bpSystolic,
    bpDiastolic,
    getBMIStatus,
    isBPHigh,
  } = useVitals(onNextQuestion);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-[--color-muted]">Loading vitals configuration...</p>
      </div>
    );
  }

  const renderField = (field: VitalField) => {
    const isReadOnly =
      field.key === 'bmi' || field.key === 'waist_to_hip_ratio';
    const error = errors[field.key as keyof VitalsFormValues];
    const fieldValue = watch(field.key as keyof VitalsFormValues);

    const showBMIStatus = field.key === 'bmi' && fieldValue;
    const bmiStatus = getBMIStatus(fieldValue as number);
    const showBPWarning =
      (field.key === 'bp_systolic' && isBPHigh(bpSystolic, undefined)) ||
      (field.key === 'bp_diastolic' && isBPHigh(undefined, bpDiastolic));

    // Show BMI/WHR out-of-range warning under the input fields users can change
    const bmiVal = Number(watch('bmi'));
    const whrVal = Number(watch('waist_to_hip_ratio'));
    const bmiRange = VITAL_RANGES.bmi;
    const showBMIWarning =
      field.key === 'weight_kg' &&
      !isNaN(bmiVal) &&
      bmiVal > 0 &&
      (bmiVal < bmiRange.min || bmiVal > bmiRange.max);
    const showWHRWarning =
      field.key === 'hip_circumference_cm' &&
      !isNaN(whrVal) &&
      whrVal > 0 &&
      (whrVal < 0.5 || whrVal > 1.5);

    return (
      <div key={field.uuid} className="relative">
        <label className="form-label block mb-1.5">
          {field.name}
          {field.is_mandatory && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          {field.key === 'blood_group' ? (
            <select
              {...register(field.key as keyof VitalsFormValues)}
              className={`form-input-base w-full px-3 py-2 ${error ? 'border-red-500' : ''}`}
            >
              <option value="">Select Blood Group</option>
              {BLOOD_GROUP_OPTIONS.map(bg => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              readOnly={isReadOnly}
              {...register(field.key as keyof VitalsFormValues)}
              maxLength={10}
              className={`form-input-base w-full px-3 py-2 ${
                error ? 'border-red-500' : ''
              } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder={`E.g., ${getPlaceholder(field.key)}`}
            />
          )}
          {showBMIStatus && (
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ${
                bmiStatus === 'Normal'
                  ? 'text-green-600'
                  : bmiStatus === 'Underweight' || bmiStatus === 'Overweight'
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              ({bmiStatus})
            </span>
          )}
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        {showBPWarning && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 font-medium">
              {field.key === 'bp_systolic' ? 'BP Sys' : 'BP Dia'} is too high.
              This should be a priority visit
            </p>
          </div>
        )}
        {showBMIWarning && (
          <p className="form-error-message mt-1">
            BMI must be between {bmiRange.min} and {bmiRange.max}
          </p>
        )}
        {showWHRWarning && (
          <p className="form-error-message mt-1">
            Waist to Hip Ratio (WHR) must be between 0.5 and 1.5
          </p>
        )}
        {error && (
          <p className="form-error-message mt-1">{error.message as string}</p>
        )}
      </div>
    );
  };

  const renderSection = (title: string, fields: VitalField[], key: string) => {
    if (fields.length === 0) return null;
    return (
      <div key={key}>
        <h3 className="text-base font-semibold text-[--color-primary] mb-4">
          {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map(renderField)}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        {renderSection(
          "Enter patient's body measurement details",
          bodyMeasurementFields,
          'body-measurements'
        )}
        {renderSection("Enter the patient's vitals", vitalFields, 'vitals')}
        {renderSection('Additional Measurements', otherFields, 'additional')}
      </div>

      <div className="flex gap-3 md:justify-end my-6">
        <AyuButton
          variant="primary"
          className="w-full md:w-[10%]"
          type="submit"
        >
          <span className="mx-auto w-full text-base">
            {isLast ? 'Confirm' : 'Next'}
          </span>
        </AyuButton>
      </div>
    </form>
  );
};
