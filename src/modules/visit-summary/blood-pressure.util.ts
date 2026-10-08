import type { BP } from '../../assets/data/visit-summary.data';

const NO_INFORMATION = 'No information';
const MISSING_READING = '-';

/**
 * Display text for a blood pressure reading, shared by the Start Visit summary
 * and the uploaded-visit summary so both render a missing value the same way:
 * "No information" when neither reading was recorded, otherwise "120/80", with
 * "-" standing in for a single missing reading.
 */
export const formatBloodPressure = (bp: BP): string => {
  if (bp.systolic == null && bp.diastolic == null) return NO_INFORMATION;
  return `${bp.systolic ?? MISSING_READING}/${bp.diastolic ?? MISSING_READING}`;
};
