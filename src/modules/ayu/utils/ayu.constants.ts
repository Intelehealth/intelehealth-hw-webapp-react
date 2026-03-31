// ========================
// Visit Reason Constants
// ========================

// --- Confirm Modal ---
export const CONFIRM_MODAL_TITLE = 'Confirm visit reason?';
export const CONFIRM_MODAL_DESCRIPTION =
  'Are you sure the patient has the following reasons for a visit?';
export const CONFIRM_MODAL_YES = 'Yes';
export const CONFIRM_MODAL_NO = 'No';

// --- Category List ---
export const RECENTLY_SEARCHED_LABEL = 'Recently searched';
export const MOST_COMMON_REASONS_LABEL = 'Most common reasons';
export const ALL_REASONS_LABEL = 'All reasons';
export const RECENTLY_SEARCHED_ITEMS = ['Headache', 'Fever', 'Diarrhea'];
export const MOST_COMMON_REASONS_ITEMS = ['Dizziness', 'Leg pain', 'Cough'];

// --- Search Input ---
export const VISIT_REASON_QUESTION = 'What is the reason for this visit?';
export const VISIT_REASON_HINT = 'Select one or multiple reasons';
export const SEARCH_PLACEHOLDER = 'Type or select reason eg. Fever';
export const NO_MATCHING_COMPLAINTS = 'No matching complaints found';
export const MAX_FILTERED_RESULTS = 8;

// --- Selected Reasons ---
export const SELECTED_REASONS_LABEL = 'Selected reasons';

// --- Footer ---
export const BUTTON_BACK = 'Back';
export const BUTTON_CONFIRM = 'Confirm';
export const BUTTON_NEXT = 'Next';

// --- Stepper ---
export const BUTTON_SUBMIT = 'Submit';
export const BUTTON_UPLOAD = 'Upload';
export const BUTTON_SKIP = 'Skip';
export const VALIDATION_ALL_COMPULSORY =
  'All questions are compulsory, please answer';
export const VALIDATION_ENTER_VALUE = 'Please enter a value';
export const VALIDATION_SELECT_OPTION = 'Please select any one option';

// ========================
// FHIR Stepper Constants
// ========================
export const DEFAULT_VISIT_REASON_TEXT = 'Visit reason';
export const ASSOCIATED_SYMPTOMS_LABEL = 'Associated symptoms';
export const VISIT_REASON_SUMMARY_TITLE = '2/4. Visit reason summary';
export const PHYSICAL_EXAM_SUMMARY_TITLE = '3/4. Physical exam summary';
export const MEDICAL_HISTORY_SUMMARY_TITLE = '4/4. Medical history summary';
export const SUMMARY_CONFIRM_TEXT = 'Confirm';
export const SUMMARY_CANCEL_TEXT = 'Back';
// ========================
// Visit Reasons Hook
// ========================
export const AYU_JSON_KEY_NAME = 'IDA6';

// ========================
// Validation
// ========================
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ========================
// Item Types
// ========================
export const ITEM_TYPES = {
  GROUP: 'group',
  LABEL_VALUE: 'labelValue',
  SUBHEADING: 'subheading',
} as const;
