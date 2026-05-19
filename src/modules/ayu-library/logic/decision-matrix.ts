import type { AyuQuestion } from '../types/ayu.types';
import type { FhirExtension } from '../types/fhir-raw.types';
import {
  ASSOCIATED_SYMPTOMS_TEXT,
  EXT_URL_MAX_VALUE,
  EXT_URL_MIN_VALUE,
  EXT_URL_PE_SECTION_KEY,
  FREQUENCY_MAX_VALUE,
} from '../utils/constants';

export type AyuComponentType =
  | 'group'
  | 'display'
  | 'text'
  | 'repeatable-text'
  | 'number'
  | 'decimal'
  | 'date'
  | 'select'
  | 'multi-select'
  | 'radio'
  | 'selectableOptionGroup'
  | 'quantity'
  | 'area'
  | 'frequency'
  | 'range'
  | 'associatedSymptoms'
  | 'physicalExamOptions';

export const ASSOCIATED_SYMPTOMS_COMPONENT: Extract<
  AyuComponentType,
  'associatedSymptoms'
> = 'associatedSymptoms';

export const PHYSICAL_EXAM_OPTIONS_COMPONENT: Extract<
  AyuComponentType,
  'physicalExamOptions'
> = 'physicalExamOptions';

/**
 * Detect a Physical Exam question by the EXT_URL_PE_SECTION_KEY marker that
 * transformFhirPhysExamToAyu attaches. Visit Reason questionnaires never carry
 * this extension, so this is a safe no-op for them.
 */
export function isPhysicalExamOptionsQuestion(q: AyuQuestion): boolean {
  return (
    q.type === 'choice' &&
    !!q.extension?.some(ext => ext.url === EXT_URL_PE_SECTION_KEY)
  );
}

/**
 * Returns true only for the actual "Associated symptoms" question,
 * which requires ALL options to be answered (yes/no for each).
 * Family history and patient history allow partial answers.
 */
export function isStrictAssociatedSymptoms(q: AyuQuestion): boolean {
  return q.type === 'choice' && q.text === ASSOCIATED_SYMPTOMS_TEXT;
}

export function resolveAyuComponent(q: AyuQuestion): AyuComponentType {
  if (isPhysicalExamOptionsQuestion(q)) {
    return 'physicalExamOptions';
  }

  const isAssociatedSymptoms =
    q.type === 'choice' &&
    (q.text === ASSOCIATED_SYMPTOMS_TEXT ||
      q.text === 'Do you have a family history of any of the following?*' ||
      q.text === 'Do you have a history of any of the following?*');
  // q.extension?.some(
  //   ext =>
  //     ext.url === EXT_URL_ORIGINAL_QUESTION_TEXT &&
  //     ext.valueString === ASSOCIATED_SYMPTOMS_TEXT
  // );

  if (isAssociatedSymptoms) {
    return 'associatedSymptoms';
  }

  switch (q.type) {
    case 'group':
      return 'group';

    case 'display':
      return 'display';

    case 'string':
    case 'area':
      return q.repeats ? 'repeatable-text' : 'text';

    case 'integer': {
      const min = findExtValueInteger(q.extension, EXT_URL_MIN_VALUE);
      const max = findExtValueInteger(q.extension, EXT_URL_MAX_VALUE);
      if (min !== undefined && max !== undefined) {
        return max <= FREQUENCY_MAX_VALUE ? 'frequency' : 'range';
      }
      return 'number';
    }

    case 'decimal':
      return 'decimal';

    case 'date':
      return 'date';

    case 'choice':
      return 'selectableOptionGroup';

    case 'quantity':
      return 'quantity';

    default:
      return 'text';
  }
}

function findExtValueInteger(
  extensions: FhirExtension[] | undefined,
  url: string
): number | undefined {
  return extensions?.find(e => e.url === url)?.valueInteger;
}
