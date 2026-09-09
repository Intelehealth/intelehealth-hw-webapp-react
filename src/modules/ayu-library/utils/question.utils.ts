import { evaluateEnableWhen } from '../logic/enable-when.logic';
import type { AyuAnswerValue, AyuQuestion } from '../types/ayu.types';
import { EXT_URL_DISPLAY_TEXT, FHIR_TYPE_CHOICE } from './constants';

const GENDER_LINK_ID_KEYWORDS = ['gender'];
const GENDER_SEX_KEYWORD = 'sex';
const FEMALE_OPTION_LABELS = new Set(['female', 'f', 'woman', 'feminine']);
const MALE_OPTION_LABELS = new Set(['male', 'm', 'man', 'masculine']);

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
  /* Strategy 1: linkId prefix match (existing convention) */
  const prefixMatch = parent.answerOption?.find(opt =>
    child.linkId.startsWith(opt.valueCoding?.code || '\0')
  );
  if (prefixMatch) return prefixMatch.valueCoding?.code;

  /* Strategy 2: enableWhen references parent question with a specific answer code */
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

export const isFieldLabelContainer = (q: AyuQuestion): boolean => {
  if (q.type !== 'choice' || !q.answerOption?.length || !q.item?.length) {
    return false;
  }

  const gatedCodes = new Set<string>();
  for (const child of q.item) {
    if (child.answerOption?.length) return false;
    const code = findMatchingOptionCode(child, q);
    if (!code) continue;
    if (gatedCodes.has(code)) return false;
    gatedCodes.add(code);
  }

  return q.item.length >= q.answerOption.length;
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
  const enriched: Record<string, AyuAnswerValue> = { ...updated };

  const clearAll = (children: AyuQuestion[]) => {
    for (const child of children) {
      delete updated[child.linkId];
      if (child.item) clearAll(child.item);
    }
  };

  const walk = (children: AyuQuestion[]) => {
    for (const child of children) {
      if (child.enableWhen) {
        const effectiveRules = child.enableWhen.filter(
          ew => !(enriched[ew.question] === true && ew.operator === '=')
        );
        const isVisible =
          effectiveRules.length > 0
            ? evaluateEnableWhen(effectiveRules, enriched)
            : true;
        if (!isVisible) {
          delete updated[child.linkId];
          if (child.item) clearAll(child.item);
          continue;
        }
      }
      if (enriched[child.linkId] === undefined) {
        enriched[child.linkId] = true;
      }
      if (
        child.type === FHIR_TYPE_CHOICE &&
        child.answerOption?.length &&
        child.item?.length
      ) {
        for (const sub of child.item) {
          if (enriched[sub.linkId] === undefined) {
            enriched[sub.linkId] = true;
          }
        }
      }
      if (child.item) walk(child.item);
    }
  };

  walk(items);
};

const isGenderQuestion = (q: AyuQuestion): boolean => {
  if (q.type !== FHIR_TYPE_CHOICE) return false;

  const lowerLinkId = q.linkId.toLowerCase();
  const lastSegment = lowerLinkId.includes(':')
    ? lowerLinkId.slice(lowerLinkId.lastIndexOf(':') + 1)
    : lowerLinkId;
  const lowerText = (q.text ?? '').toLowerCase().trim();

  if (
    GENDER_LINK_ID_KEYWORDS.some(k => lowerLinkId.includes(k)) ||
    lastSegment === GENDER_SEX_KEYWORD ||
    GENDER_LINK_ID_KEYWORDS.some(k => lowerText.includes(k)) ||
    lowerText === GENDER_SEX_KEYWORD
  ) {
    return true;
  }

  const opts = q.answerOption ?? [];
  if (opts.length < 2) return false;

  let hasFemale = false;
  let hasMale = false;

  for (const opt of opts) {
    const code = (opt.valueCoding?.code ?? '').trim().toLowerCase();
    const str = (opt.valueString ?? '').trim().toLowerCase();
    const display = (opt.valueCoding?.display ?? '').trim().toLowerCase();

    if (
      FEMALE_OPTION_LABELS.has(code) ||
      FEMALE_OPTION_LABELS.has(str) ||
      FEMALE_OPTION_LABELS.has(display)
    ) {
      hasFemale = true;
    }
    if (
      MALE_OPTION_LABELS.has(code) ||
      MALE_OPTION_LABELS.has(str) ||
      MALE_OPTION_LABELS.has(display)
    ) {
      hasMale = true;
    }
  }

  return hasFemale && hasMale;
};

export const extractGenderLinkIds = (items: AyuQuestion[]): string[] => {
  const result: string[] = [];
  for (const item of items) {
    if (isGenderQuestion(item)) {
      result.push(item.linkId);
    }
    if (item.item?.length) {
      result.push(...extractGenderLinkIds(item.item));
    }
  }
  return result;
};
