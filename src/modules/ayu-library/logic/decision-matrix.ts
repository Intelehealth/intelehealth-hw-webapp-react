import type { AyuQuestion } from '../types/ayu.types';
import {
  EXT_URL_ORIGINAL_QUESTION_TEXT,
  ASSOCIATED_SYMPTOMS_TEXT,
} from '../utils/constants';

export type AyuComponentType =
  | 'group'
  | 'display'
  | 'text'
  | 'repeatable-text'
  | 'number'
  | 'date'
  | 'select'
  | 'multi-select'
  | 'radio'
  | 'selectableOptionGroup'
  | 'quantity'
  | 'associatedSymptoms';

export function resolveAyuComponent(q: AyuQuestion): AyuComponentType {
  const isAssociatedSymptoms =
    q.type === 'choice' &&
    q.extension?.some(
      ext =>
        ext.url === EXT_URL_ORIGINAL_QUESTION_TEXT &&
        ext.valueString === ASSOCIATED_SYMPTOMS_TEXT
    );

  if (isAssociatedSymptoms) {
    return 'associatedSymptoms';
  }

  switch (q.type) {
    case 'group':
      return 'group';

    case 'display':
      return 'display';

    case 'string':
      return q.repeats ? 'repeatable-text' : 'text';

    case 'integer':
    case 'decimal':
      return 'number';

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
