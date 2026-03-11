import type { AyuAnswerValue, AyuEnableWhen } from '../types/ayu.types';

/**
 * Evaluate whether an item's enableWhen conditions are all met.
 * Returns true if the item should be visible (no enableWhen = always visible).
 */
export function evaluateEnableWhen(
  enableWhen: AyuEnableWhen[] | undefined,
  answers: Record<string, AyuAnswerValue>
): boolean {
  if (!enableWhen) return true;

  return enableWhen.every(rule => {
    const expected =
      rule.answerBoolean ??
      rule.answerString ??
      rule.answerInteger ??
      rule.answerCoding?.code;

    const parentAnswer = answers[rule.question];

    if (Array.isArray(parentAnswer)) {
      return parentAnswer.includes(expected as string);
    }

    return parentAnswer === expected;
  });
}
