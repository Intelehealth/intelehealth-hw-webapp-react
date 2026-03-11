import type { AyuAnswerValue } from '../types/ayu.types';
import { NEGATED_PREFIX } from '../utils/constants';

/**
 * Parse the stored associated symptoms value array into yes/no code lists.
 * Yes codes are stored as-is; No codes are stored with a "NO_" prefix.
 */
export function parseYesNoValues(value: AyuAnswerValue): {
  yesValues: string[];
  noValues: string[];
} {
  const yesValues: string[] = [];
  const noValues: string[] = [];

  if (Array.isArray(value)) {
    for (const v of value) {
      if (typeof v === 'string' && v.startsWith(NEGATED_PREFIX)) {
        noValues.push(v.slice(NEGATED_PREFIX.length));
      } else if (typeof v === 'string') {
        yesValues.push(v);
      }
    }
  }

  return { yesValues, noValues };
}

/**
 * Toggle an associated symptom answer and return the new combined value array.
 */
export function toggleAssociatedSymptom(
  yesValues: string[],
  noValues: string[],
  code: string,
  isYes: boolean
): string[] {
  const newYes = isYes
    ? [...yesValues.filter(c => c !== code), code]
    : yesValues.filter(c => c !== code);
  const newNo = isYes
    ? noValues.filter(c => c !== code)
    : [...noValues.filter(c => c !== code), code];

  return [...newYes, ...newNo.map(c => `${NEGATED_PREFIX}${c}`)];
}
