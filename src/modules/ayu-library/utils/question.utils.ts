import type { AyuAnswerValue, AyuQuestion } from '../types/ayu.types';

/**
 * Recursively collect all descendant linkIds from a question's nested items.
 */
export const collectDescendantLinkIds = (item: AyuQuestion): string[] => {
  const result: string[] = [];
  if (item.item) {
    for (const child of item.item) {
      result.push(child.linkId);
      result.push(...collectDescendantLinkIds(child));
    }
  }
  return result;
};

/**
 * Given answers and a list of questions, delete answers for all items
 * whose enableWhen conditions are no longer met, plus all their descendants.
 */
export const clearHiddenDescendantAnswers = (
  items: AyuQuestion[],
  updated: Record<string, AyuAnswerValue>
) => {
  const clearAll = (children: AyuQuestion[]) => {
    for (const child of children) {
      delete updated[child.linkId];
      if (child.item) clearAll(child.item);
    }
  };

  const walk = (children: AyuQuestion[]) => {
    for (const child of children) {
      if (child.enableWhen) {
        const isVisible = child.enableWhen.every(rule => {
          const expected =
            rule.answerBoolean ??
            rule.answerString ??
            rule.answerInteger ??
            rule.answerCoding?.code;
          const parentVal = updated[rule.question];
          if (Array.isArray(parentVal)) {
            return parentVal.includes(expected as string);
          }
          return parentVal === expected;
        });
        if (!isVisible) {
          delete updated[child.linkId];
          if (child.item) clearAll(child.item);
          continue;
        }
      }
      if (child.item) walk(child.item);
    }
  };

  walk(items);
};
