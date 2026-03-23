import type { AyuAnswerValue, AyuQuestion } from '../types/ayu.types';
import { findMatchingOptionCode } from '../utils/question.utils';
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
 * Recurses into all nesting depths.
 */
export const hasVisibleRequiredNestedString = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  const check = (items: AyuQuestion[] | undefined): boolean => {
    if (!items) return false;
    return items.some((child: AyuQuestion) => {
      if (!evaluateEnableWhen(child.enableWhen, answers)) return false;
      if (child.type === 'string' && isEmpty(answers[child.linkId]))
        return true;
      return check(child.item);
    });
  };
  return check(question.item);
};

/**
 * Check if a question has any visible nested child that is still unanswered.
 * Checks: required children, repeats (multiselect) children, and visible
 * input-type children (string, integer, quantity) that have no value entered.
 * Fully recursive — handles N levels of nesting.
 */
export const hasUnansweredRequiredNestedChild = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  const check = (
    items: AyuQuestion[] | undefined,
    parent: AyuQuestion
  ): boolean => {
    if (!items) return false;
    return items.some((child: AyuQuestion) => {
      if (!evaluateEnableWhen(child.enableWhen, answers)) return false;

      // If child maps to a parent answerOption, only validate if that option is selected
      const matchedCode = findMatchingOptionCode(child, parent);
      if (matchedCode) {
        const parentAnswer = answers[parent.linkId];
        const selectedCodes: string[] = Array.isArray(parentAnswer)
          ? (parentAnswer as string[])
          : typeof parentAnswer === 'string'
            ? [parentAnswer as string]
            : [];
        if (!selectedCodes.includes(matchedCode)) return false;
      }

      // Required children must have an answer
      if (child.required && isEmpty(answers[child.linkId])) return true;
      // Visible repeats (multiselect) children must have at least one selection
      if (child.repeats && isEmpty(answers[child.linkId])) return true;
      // Visible input-type children must have a value entered
      if (
        (child.type === 'string' ||
          child.type === 'integer' ||
          child.type === 'date' ||
          child.type === 'quantity') &&
        isEmpty(answers[child.linkId])
      )
        return true;
      // Recurse into deeper levels
      return check(child.item, child);
    });
  };
  return check(question.item, question);
};

/**
 * Check if the unanswered nested child/grandchild is an input type (string, integer, quantity).
 * Returns true if the validation failure is due to a missing input value rather than a missing selection.
 * Fully recursive — handles N levels of nesting.
 */
export const isNestedInputValueMissing = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  const check = (
    items: AyuQuestion[] | undefined,
    parent: AyuQuestion
  ): boolean => {
    if (!items) return false;
    return items.some((child: AyuQuestion) => {
      if (!evaluateEnableWhen(child.enableWhen, answers)) return false;

      // If child maps to a parent answerOption, only validate if that option is selected
      const matchedCode = findMatchingOptionCode(child, parent);
      if (matchedCode) {
        const parentAnswer = answers[parent.linkId];
        const selectedCodes: string[] = Array.isArray(parentAnswer)
          ? (parentAnswer as string[])
          : typeof parentAnswer === 'string'
            ? [parentAnswer as string]
            : [];
        if (!selectedCodes.includes(matchedCode)) return false;
      }

      if (
        (child.type === 'string' ||
          child.type === 'integer' ||
          child.type === 'date' ||
          child.type === 'quantity') &&
        isEmpty(answers[child.linkId])
      )
        return true;
      // Recurse into deeper levels
      return check(child.item, child);
    });
  };
  return check(question.item, question);
};

/**
 * Check if a quantity/duration field is improperly filled (missing number or days).
 */
export const isQuantityInvalid = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  if (question.type !== 'quantity' && question.type !== 'choice') return false;

  // Recursively check all nested children for invalid duration structure
  if (question.type === 'choice' && question.item) {
    const checkDurationDeep = (items: AyuQuestion[]): boolean => {
      for (const child of items) {
        if (!evaluateEnableWhen(child.enableWhen, answers)) continue;
        const childAnswer = answers[child.linkId];
        if (
          childAnswer &&
          typeof childAnswer === 'object' &&
          'dropdownValues' in childAnswer
        ) {
          const hasNumber = !!childAnswer.dropdownValues?.number;
          const hasDays = !!childAnswer.dropdownValues?.days;
          if (!hasNumber || !hasDays) return true;
        }
        if (child.item && checkDurationDeep(child.item)) return true;
      }
      return false;
    };
    if (checkDurationDeep(question.item)) return true;
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
