// Types
export type {
  AyuApiResponse,
  AyuJsonItem,
  AyuJsonItemRaw,
} from './types/ayu-json.types';
export type { AyuRendererBaseProps } from './types/ayu-renderer-props.types';
export type {
  AyuAnswerOption,
  AyuAnswerValue,
  AyuEnableWhen,
  AyuQuestion,
  AyuQuestionType,
  DropdownValues,
  DurationAnswer,
  FhirQuestionnaire,
  QuantityAnswer,
} from './types/ayu.types';
export type { DropdownOption } from './types/dropdown.types';
export type {
  FhirEnableWhen,
  FhirExtension,
  FhirItem,
  FhirQuestionnaire as FhirRawQuestionnaire,
  FhirTranslatableElement,
} from './types/fhir-raw.types';
export type { SectionProps, SectionState } from './types/start-visit.types';

// Utils
export {
  DURATION_DROPDOWN_CONFIGS,
  EXCLUDED_JSON_NAMES,
  SELECT_ANY_ONE,
  SELECT_ONE_OR_MORE,
} from './utils/constants';
export type { AyuDurationConfig } from './utils/constants';
export {
  normalizeType,
  resolveLabel,
  transformFhirToAyu,
} from './utils/fhir-to-ayu.util';
export { safeJsonParse } from './utils/json.utils';
export {
  clearHiddenDescendantAnswers,
  collectDescendantLinkIds,
} from './utils/question.utils';

// Logic
export {
  parseYesNoValues,
  toggleAssociatedSymptom,
} from './logic/associated-symptoms.logic';
export { resolveAyuComponent } from './logic/decision-matrix';
export type { AyuComponentType } from './logic/decision-matrix';
export { evaluateEnableWhen } from './logic/enable-when.logic';
export {
  computeMultiSelectToggle,
  isDurationAnswer,
  isMutuallyExclusiveOption,
  isTopLevelComplete,
} from './logic/stepper.logic';
export {
  hasVisibleRequiredNestedString,
  isEmpty,
  isQuantityInvalid,
} from './logic/validation.logic';
export {
  extractVisitReasonNames,
  filterNamesBySearch,
  groupByFirstLetter,
} from './logic/visit-reasons.logic';
export { buildVisitSummary } from './logic/visit-summary.logic';
export type { SummaryItem, SummarySection } from './logic/visit-summary.logic';
