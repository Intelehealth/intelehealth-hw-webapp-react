import type { DropdownOption } from '../types/dropdown.types';

// ========================
// FHIR Extension URLs
// ========================
export const EXT_URL_ORIGINAL_QUESTION_TEXT =
  'urn:intelehealth:original-question-text';
export const EXT_URL_MUTUALLY_EXCLUSIVE =
  'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice';

export const EXT_URL_DISPLAY_TEXT =
  'https://intelehealth.org/fhir/StructureDefinition/display';

export const EXT_URL_LANGUGAE_TEXT =
  'https://intelehealth.org/fhir/StructureDefinition/language';

// ========================
// Associated Symptoms
// ========================
export const ASSOCIATED_SYMPTOMS_TEXT = 'Associated symptoms';
export const NEGATED_PREFIX = 'NO_';
export const NEGATED_ID_PREFIX = 'NO_ID_';

// ========================
// Visit Summary Labels
// ========================
export const PATIENT_REPORTS_LABEL = 'Patient reports';
export const PATIENT_DENIES_LABEL = 'Patient denies';

// Nested question helper text
export const SELECT_ONE_OR_MORE = 'Select one or more';
export const SELECT_ANY_ONE = 'Select any one';

//JSON name list to exclude to display on visit reason selection
export const EXCLUDED_JSON_NAMES = ['famHist', 'physExam', 'patHist'];
export interface AyuDurationConfig {
  dropdowns?: {
    id: string;
    placeholder?: string;
    options: DropdownOption[];
  }[];
}

// Generate number options from 1 to 100
const generateNumberOptions = (
  start: number,
  end: number
): DropdownOption[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    label: String(start + i),
    value: start + i,
  }));
};

export const DURATION_DROPDOWN_CONFIGS: AyuDurationConfig['dropdowns'] = [
  {
    id: 'number',
    placeholder: 'Number',
    options: generateNumberOptions(1, 100),
  },
  {
    id: 'days',
    placeholder: 'Duration Type',
    options: [
      { label: 'Hours', value: 'hours' },
      { label: 'Days', value: 'days' },
      { label: 'Weeks', value: 'weeks' },
      { label: 'Months', value: 'months' },
      { label: 'Years', value: 'years' },
    ],
  },
];
