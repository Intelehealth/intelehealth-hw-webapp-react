import type {
  AyuAnswerValue,
  AyuQuestion,
  DurationAnswer,
} from '../types/ayu.types';
import { evaluateEnableWhen } from './enable-when.logic';

export const isDurationAnswer = (value: unknown): value is DurationAnswer => {
  return (
    typeof value === 'object' && value !== null && 'dropdownValues' in value
  );
};

/**
 * Check if an answer option is marked as mutually exclusive via FHIR extension.
 */
export const isMutuallyExclusiveOption = (
  question: AyuQuestion,
  optionCode: string
): boolean => {
  const option = question.answerOption?.find(
    opt => opt.valueCoding?.code === optionCode
  );

  return !!option?.extension?.some(
    ext =>
      ext.url === 'urn:intelehealth:mutually-exclusive' &&
      ext.valueBoolean === true
  );
};

/**
 * Compute the new multi-select array after toggling an option,
 * respecting mutually exclusive rules.
 */
export const computeMultiSelectToggle = (
  question: AyuQuestion,
  currentArray: string[],
  selectedValue: string
): string[] => {
  const isExclusive = isMutuallyExclusiveOption(question, selectedValue);

  if (isExclusive) {
    // If already selected → unselect
    if (currentArray.includes(selectedValue)) {
      return [];
    }
    // Replace all with only this option
    return [selectedValue];
  }

  // Normal option clicked — remove any mutually exclusive options
  const filtered = currentArray.filter(
    code => !isMutuallyExclusiveOption(question, code)
  );

  if (filtered.includes(selectedValue)) {
    return filtered.filter(v => v !== selectedValue);
  }
  return [...filtered, selectedValue];
};

/**
 * Check whether a top-level question and all its visible nested children are complete.
 */
export const isTopLevelComplete = (
  question: AyuQuestion,
  updatedAnswers: Record<string, AyuAnswerValue>
): boolean => {
  // Parent must be answered
  const parentAnswer = updatedAnswers[question.linkId];

  if (
    question.repeats
      ? !Array.isArray(parentAnswer) || parentAnswer.length === 0
      : !parentAnswer
  ) {
    return false;
  }

  // For choice questions, check if any nested child has duration structure
  if (question.type === 'choice' && question.item?.length) {
    for (const child of question.item) {
      const childAnswer = updatedAnswers[child.linkId];
      if (isDurationAnswer(childAnswer)) {
        const hasNumber = !!childAnswer.dropdownValues?.number;
        const hasDays = !!childAnswer.dropdownValues?.days;
        if (!hasNumber || !hasDays) {
          return false;
        }
      }
    }
  }

  // Also check top-level for duration structure
  const answer = updatedAnswers[question.linkId];
  if (question.type === 'choice' && isDurationAnswer(answer)) {
    const hasNumber = !!answer.dropdownValues?.number;
    const hasDays = !!answer.dropdownValues?.days;
    if (!hasNumber || !hasDays) return false;
  }

  if (!question.item?.length) return true;

  // Check visible nested
  for (const child of question.item) {
    if (!evaluateEnableWhen(child.enableWhen, updatedAnswers)) continue;

    if (!updatedAnswers[child.linkId]) {
      return false;
    }
  }

  return true;
};
