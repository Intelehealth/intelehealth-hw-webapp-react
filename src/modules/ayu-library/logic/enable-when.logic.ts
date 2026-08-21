import type { AyuAnswerValue, AyuEnableWhen } from '../types/ayu.types';

/**
 * Evaluate whether an item's enableWhen conditions are all met.
 * Returns true if the item should be visible (no enableWhen = always visible).
 * Supports operators: "=" (equality), "!=" (inequality), "exists" (presence check).
 */
export function evaluateEnableWhen(
  enableWhen: AyuEnableWhen[] | undefined,
  answers: Record<string, AyuAnswerValue>
): boolean {
  if (!enableWhen) return true;

  return enableWhen.every(rule => {
    const parentAnswer = answers[rule.question];

    if (rule.operator === 'exists') {
      const hasValue =
        parentAnswer !== undefined &&
        parentAnswer !== null &&
        parentAnswer !== '' &&
        !(Array.isArray(parentAnswer) && parentAnswer.length === 0);
      return rule.answerBoolean !== false ? hasValue : !hasValue;
    }

    const expected =
      rule.answerBoolean ??
      rule.answerString ??
      rule.answerInteger ??
      rule.answerCoding?.code;

    if (Array.isArray(parentAnswer)) {
      if (rule.operator === '!=') {
        return !parentAnswer.includes(expected as string);
      }
      return parentAnswer.includes(expected as string);
    }

    if (rule.operator === '!=') {
      return parentAnswer !== expected;
    }

    return parentAnswer === expected;
  });
}
