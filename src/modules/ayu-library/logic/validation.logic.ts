import type { AyuAnswerValue, AyuQuestion } from '../types/ayu.types';
import { evaluateEnableWhen } from './enable-when.logic';

/**
 * Check if a value is empty (undefined, null, empty string, or empty array).
 */
export const isEmpty = (val: unknown): boolean =>
  val === undefined ||
  val === null ||
  (typeof val === 'string' && val.trim() === '') ||
  (Array.isArray(val) && val.length === 0);

/**
 * Check if a question has a visible required nested string child that is still unanswered.
 */
export const hasVisibleRequiredNestedString = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  return !!question.item?.some((child: AyuQuestion) => {
    if (child.type !== 'string') return false;
    if (!evaluateEnableWhen(child.enableWhen, answers)) return false;
    return isEmpty(answers[child.linkId]);
  });
};

/**
 * Check if a question has any visible nested child (or grandchild) that is still unanswered.
 * Checks: required children, repeats (multiselect) children, and visible
 * input-type children (string, integer, quantity) that have no value entered.
 * Recurses into grandchildren for answerOption → item mappings.
 */
export const hasUnansweredRequiredNestedChild = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  if (!question.item) return false;
  return question.item.some((child: AyuQuestion) => {
    if (!evaluateEnableWhen(child.enableWhen, answers)) return false;
    // Required children must have an answer
    if (child.required && isEmpty(answers[child.linkId])) return true;
    // Visible repeats (multiselect) children must have at least one selection
    if (child.repeats && isEmpty(answers[child.linkId])) return true;
    // Visible input-type children must have a value entered
    if (
      (child.type === 'string' ||
        child.type === 'integer' ||
        child.type === 'quantity') &&
      isEmpty(answers[child.linkId])
    )
      return true;
    // Recurse into grandchildren (e.g. answerOption → item mappings)
    if (child.item) {
      const hasUnansweredGrandchild = child.item.some(
        (grandchild: AyuQuestion) => {
          // Only check grandchildren whose matching answerOption is selected
          const selectedCodes: string[] = Array.isArray(answers[child.linkId])
            ? (answers[child.linkId] as string[])
            : typeof answers[child.linkId] === 'string'
              ? [answers[child.linkId] as string]
              : [];

          const matchingOption = child.answerOption?.find(opt =>
            grandchild.linkId.startsWith(opt.valueCoding?.code || '')
          );

          // If this grandchild maps to an answerOption, only validate if that option is selected
          if (matchingOption) {
            if (!selectedCodes.includes(matchingOption.valueCoding?.code || ''))
              return false;
          }

          if (
            (grandchild.type === 'string' ||
              grandchild.type === 'integer' ||
              grandchild.type === 'quantity') &&
            isEmpty(answers[grandchild.linkId])
          )
            return true;

          return false;
        }
      );
      if (hasUnansweredGrandchild) return true;
    }
    return false;
  });
};

/**
 * Check if the unanswered nested child/grandchild is an input type (string, integer, quantity).
 * Returns true if the validation failure is due to a missing input value rather than a missing selection.
 */
export const isNestedInputValueMissing = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  if (!question.item) return false;
  return question.item.some((child: AyuQuestion) => {
    if (!evaluateEnableWhen(child.enableWhen, answers)) return false;
    // Direct child is an input type with no value
    if (
      (child.type === 'string' ||
        child.type === 'integer' ||
        child.type === 'quantity') &&
      isEmpty(answers[child.linkId])
    )
      return true;
    // Check grandchildren
    if (child.item) {
      return child.item.some((grandchild: AyuQuestion) => {
        const selectedCodes: string[] = Array.isArray(answers[child.linkId])
          ? (answers[child.linkId] as string[])
          : typeof answers[child.linkId] === 'string'
            ? [answers[child.linkId] as string]
            : [];
        const matchingOption = child.answerOption?.find(opt =>
          grandchild.linkId.startsWith(opt.valueCoding?.code || '')
        );
        if (matchingOption) {
          if (!selectedCodes.includes(matchingOption.valueCoding?.code || ''))
            return false;
        }
        return (
          (grandchild.type === 'string' ||
            grandchild.type === 'integer' ||
            grandchild.type === 'quantity') &&
          isEmpty(answers[grandchild.linkId])
        );
      });
    }
    return false;
  });
};

/**
 * Check if a quantity/duration field is improperly filled (missing number or days).
 */
export const isQuantityInvalid = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  if (question.type !== 'quantity' && question.type !== 'choice') return false;

  // Check nested children for duration structure
  if (question.type === 'choice' && question.item) {
    for (const child of question.item) {
      const childAnswer = answers[child.linkId];
      if (
        childAnswer &&
        typeof childAnswer === 'object' &&
        'dropdownValues' in childAnswer
      ) {
        const hasNumber = !!childAnswer.dropdownValues?.number;
        const hasDays = !!childAnswer.dropdownValues?.days;
        return !hasNumber || !hasDays;
      }
    }
    // Check grandchildren for duration structure (deeply nested items)
    for (const child of question.item) {
      if (child.item) {
        for (const grandchild of child.item) {
          const grandchildAnswer = answers[grandchild.linkId];
          if (
            grandchildAnswer &&
            typeof grandchildAnswer === 'object' &&
            'dropdownValues' in grandchildAnswer
          ) {
            const hasNumber = !!grandchildAnswer.dropdownValues?.number;
            const hasDays = !!grandchildAnswer.dropdownValues?.days;
            if (!hasNumber || !hasDays) return true;
          }
        }
      }
    }
  }

  // Check top-level answer
  const value = answers[question.linkId];
  if (!value) return question.type === 'quantity';

  // Only validate if it's an object with dropdownValues structure (duration component)
  if (typeof value === 'object' && 'dropdownValues' in value) {
    const hasNumber = !!value.dropdownValues?.number;
    const hasDays = !!value.dropdownValues?.days;
    return !hasNumber || !hasDays;
  }

  // For regular choice questions (string values), not invalid
  return false;
};
