import type { DropdownOption } from '../components/common/ayu-dropdown.component';

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
