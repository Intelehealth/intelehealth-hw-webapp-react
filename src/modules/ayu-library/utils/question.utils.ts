import type { AyuAnswerValue, AyuQuestion } from '../types/ayu.types';
import { EXT_URL_DISPLAY_TEXT } from './constants';

export const getRowLabel = (item: AyuQuestion | undefined): string => {
  const displayExt = item?.extension?.find(
    e => e.url === EXT_URL_DISPLAY_TEXT
  )?.valueString;
  return displayExt || item?.text || '';
};

/**
 * Find which parent answerOption code a child item maps to.
 * Tries linkId prefix match first, then falls back to enableWhen reference.
 */
export const findMatchingOptionCode = (
  child: AyuQuestion,
  parent: AyuQuestion
): string | undefined => {
  // Strategy 1: linkId prefix match (existing convention)
  const prefixMatch = parent.answerOption?.find(opt =>
    child.linkId.startsWith(opt.valueCoding?.code || '\0')
  );
  if (prefixMatch) return prefixMatch.valueCoding?.code;

  // Strategy 2: enableWhen references parent question with a specific answer code
  const ewMatch = child.enableWhen?.find(
    ew => ew.question === parent.linkId && ew.answerCoding?.code
  );
  if (ewMatch) {
    const code = ewMatch.answerCoding!.code!;
    const optionExists = parent.answerOption?.some(
      opt => opt.valueCoding?.code === code
    );
    if (optionExists) return code;
  }

  return undefined;
};

/**
 * Check whether a linkId belongs to any descendant of the given question (recursive).
 */
export const isDescendantLinkId = (
  question: AyuQuestion,
  linkId: string
): boolean => {
  if (!question.item) return false;
  for (const child of question.item) {
    if (child.linkId === linkId) return true;
    if (isDescendantLinkId(child, linkId)) return true;
  }
  return false;
};

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
