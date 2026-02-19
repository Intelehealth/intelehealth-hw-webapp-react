import type { AyuQuestion } from '../types/ayu.types';

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
  | 'quantity';

export function resolveAyuComponent(q: AyuQuestion): AyuComponentType {
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
