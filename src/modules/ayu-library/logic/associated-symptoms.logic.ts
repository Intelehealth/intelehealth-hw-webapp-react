import type { AyuAnswerValue, AyuQuestion } from '../types/ayu.types';
import { NEGATED_PREFIX } from '../utils/constants';
import { isMutuallyExclusiveOption } from './stepper.logic';

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
 * Check if any of the given codes corresponds to a mutually exclusive option.
 */
export function hasExclusiveSelected(
  question: AyuQuestion,
  codes: string[]
): boolean {
  return codes.some(code => isMutuallyExclusiveOption(question, code));
}

/**
 * Toggle an associated symptom answer and return the new combined value array.
 * Respects mutually exclusive options: selecting "None" clears all others,
 * selecting any other option clears "None".
 */
export function toggleAssociatedSymptom(
  yesValues: string[],
  noValues: string[],
  code: string,
  isYes: boolean,
  question?: AyuQuestion
): string[] {
  // If a question is provided, handle mutually exclusive logic
  if (question && isYes) {
    const clickedIsExclusive = isMutuallyExclusiveOption(question, code);

    if (clickedIsExclusive) {
      // "None" clicked Yes → clear all other yes/no, only keep this as Yes
      return [code];
    }

    // Normal option clicked Yes → remove any exclusive options from yes values
    const filteredYes = yesValues.filter(
      c => !isMutuallyExclusiveOption(question, c)
    );
    const filteredNo = noValues.filter(
      c => !isMutuallyExclusiveOption(question, c)
    );

    const newYes = [...filteredYes.filter(c => c !== code), code];
    const newNo = filteredNo.filter(c => c !== code);

    return [...newYes, ...newNo.map(c => `${NEGATED_PREFIX}${c}`)];
  }

  const newYes = isYes
    ? [...yesValues.filter(c => c !== code), code]
    : yesValues.filter(c => c !== code);
  const newNo = isYes
    ? noValues.filter(c => c !== code)
    : [...noValues.filter(c => c !== code), code];

  return [...newYes, ...newNo.map(c => `${NEGATED_PREFIX}${c}`)];
}
