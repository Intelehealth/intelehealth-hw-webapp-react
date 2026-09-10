import type { AyuAnswerValue, AyuQuestion } from '../types/ayu.types';
import {
  EXT_URL_MAX_VALUE,
  EXT_URL_MIN_VALUE,
  FHIR_TYPE_CHOICE,
  FHIR_TYPE_DATE,
  FHIR_TYPE_INTEGER,
  FHIR_TYPE_QUANTITY,
  FHIR_TYPE_STRING,
  getBPRangeFromText,
} from '../utils/constants';
import {
  findMatchingOptionCode,
  isFieldLabelContainer,
} from '../utils/question.utils';
import {
  hasExclusiveSelected,
  parseYesNoValues,
} from './associated-symptoms.logic';
import {
  ASSOCIATED_SYMPTOMS_COMPONENT,
  isPhysicalExamOptionsQuestion,
  isStrictAssociatedSymptoms,
  resolveAyuComponent,
} from './decision-matrix';
import { evaluateEnableWhen } from './enable-when.logic';

/**
 * Check if a value is empty (undefined, null, empty string, or empty array).
 */
export const isEmpty = (val: unknown): boolean =>
  val === undefined ||
  val === null ||
  (typeof val === 'string' && val.trim() === '') ||
  (Array.isArray(val) && val.length === 0);

const hasAnyAnswer = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean =>
  !isEmpty(answers[question.linkId]) ||
  (question.item ?? []).some(child => hasAnyAnswer(child, answers));

const isLeafInput = (q: AyuQuestion): boolean =>
  q.type === FHIR_TYPE_STRING ||
  q.type === FHIR_TYPE_INTEGER ||
  q.type === FHIR_TYPE_DATE ||
  q.type === FHIR_TYPE_QUANTITY;

const isSiblingBranchAnswered = (
  child: AyuQuestion,
  siblings: AyuQuestion[],
  parent: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  if (child.required) return false;
  const matchedCode = findMatchingOptionCode(child, parent);
  if (!matchedCode) return false;
  return siblings.some(
    sibling =>
      sibling.linkId !== child.linkId &&
      !isLeafInput(sibling) &&
      findMatchingOptionCode(sibling, parent) === matchedCode &&
      hasAnyAnswer(sibling, answers)
  );
};

/**
 * Check if a question has a visible required nested string child that is still unanswered.
 * Recurses into all nesting depths.
 */
export const hasVisibleRequiredNestedString = (
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
      if (
        child.type === FHIR_TYPE_STRING &&
        isEmpty(answers[child.linkId]) &&
        !isSiblingBranchAnswered(child, items, parent, answers)
      )
        return true;
      return check(child.item, child);
    });
  };
  return check(question.item, question);
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

      /* If child maps to a parent answerOption, only validate if that option is selected */
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

      const isIntermediateChoice = isFieldLabelContainer(child);
      const siblingBranchAnswered = isSiblingBranchAnswered(
        child,
        items,
        parent,
        answers
      );
      /* Required children must have an answer */
      if (
        child.required &&
        isEmpty(answers[child.linkId]) &&
        !isIntermediateChoice
      )
        return true;
      /* Visible repeats (multiselect) children must have at least one selection */
      if (
        child.repeats &&
        isEmpty(answers[child.linkId]) &&
        !isIntermediateChoice
      )
        return true;
      /* Visible input-type children must have a value entered */
      if (
        (child.type === FHIR_TYPE_STRING ||
          child.type === FHIR_TYPE_INTEGER ||
          child.type === FHIR_TYPE_DATE ||
          child.type === FHIR_TYPE_QUANTITY) &&
        isEmpty(answers[child.linkId]) &&
        !siblingBranchAnswered
      )
        return true;
      /* Recurse into deeper levels */
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

      /* If child maps to a parent answerOption, only validate if that option is selected */
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
        (child.type === FHIR_TYPE_STRING ||
          child.type === FHIR_TYPE_INTEGER ||
          child.type === FHIR_TYPE_DATE ||
          child.type === FHIR_TYPE_QUANTITY) &&
        isEmpty(answers[child.linkId])
      )
        return true;
      /* Recurse into deeper levels */
      return check(child.item, child);
    });
  };
  return check(question.item, question);
};

export const hasMissingNestedBPInput = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  const isBPField = (child: AyuQuestion): boolean => {
    if (child.type !== FHIR_TYPE_INTEGER && child.type !== FHIR_TYPE_STRING)
      return false;
    const hasRangeExt =
      child.extension?.some(e => e.url === EXT_URL_MIN_VALUE) ||
      child.extension?.some(e => e.url === EXT_URL_MAX_VALUE);
    if (hasRangeExt) return true;
    return getBPRangeFromText(child.text) !== undefined;
  };

  const check = (items: AyuQuestion[] | undefined): boolean => {
    if (!items) return false;
    return items.some(child => {
      if (!evaluateEnableWhen(child.enableWhen, answers)) return false;
      if (isBPField(child) && isEmpty(answers[child.linkId])) return true;
      return check(child.item);
    });
  };
  return check(question.item);
};

/**
 * Check if a question's answer is outside its valid numeric range.
 * Checks FHIR extension min/max first, then falls back to known BP ranges
 * derived from the question text. Also handles string-type BP fields whose
 * answers are parseable numbers.
 */
export const isNumericOutOfRange = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  const rawValue = answers[question.linkId];

  /*
   * Resolve the numeric value: integer type stores a number directly,
   * string type may store a numeric string (e.g. "120" for BP).
   */
  let numValue: number | undefined;
  if (question.type === FHIR_TYPE_INTEGER) {
    if (typeof rawValue !== 'number') return false;
    numValue = rawValue;
  } else if (question.type === FHIR_TYPE_STRING) {
    if (typeof rawValue !== 'string' || rawValue.trim() === '') return false;
    const parsed = parseFloat(rawValue);
    if (isNaN(parsed)) return false;
    numValue = parsed;
  } else {
    return false;
  }

  /* Check FHIR extensions first */
  const minExt = question.extension?.find(
    e => e.url === EXT_URL_MIN_VALUE
  )?.valueInteger;
  const maxExt = question.extension?.find(
    e => e.url === EXT_URL_MAX_VALUE
  )?.valueInteger;

  if (minExt !== undefined && numValue < minExt) return true;
  if (maxExt !== undefined && numValue > maxExt) return true;

  /* Fallback: check known BP ranges based on question text */
  if (minExt === undefined && maxExt === undefined) {
    const bpRange = getBPRangeFromText(question.text);
    if (bpRange) {
      if (numValue < bpRange.min || numValue > bpRange.max) return true;
    }
  }

  return false;
};

/**
 * Recursively check nested children for out-of-range integer values.
 */
export const hasNestedOutOfRangeValue = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  const check = (items: AyuQuestion[] | undefined): boolean => {
    if (!items) return false;
    return items.some(child => {
      if (!evaluateEnableWhen(child.enableWhen, answers)) return false;
      if (isNumericOutOfRange(child, answers)) return true;
      return check(child.item);
    });
  };
  return check(question.item);
};

/**
 * Find the text of the first out-of-range question (top-level or nested child).
 * Returns the question text or undefined if no out-of-range field is found.
 */
export const findOutOfRangeQuestionText = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): string | undefined => {
  if (isNumericOutOfRange(question, answers)) return question.text;
  const find = (items: AyuQuestion[] | undefined): string | undefined => {
    if (!items) return undefined;
    for (const child of items) {
      if (!evaluateEnableWhen(child.enableWhen, answers)) continue;
      if (isNumericOutOfRange(child, answers)) return child.text;
      const nested = find(child.item);
      if (nested) return nested;
    }
    return undefined;
  };
  return find(question.item);
};

/**
 * Check if a quantity/duration field is improperly filled (missing number or days).
 */
export const isQuantityInvalid = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  if (
    question.type !== FHIR_TYPE_QUANTITY &&
    question.type !== FHIR_TYPE_CHOICE
  )
    return false;

  /* Recursively check all nested children for invalid duration structure */
  if (question.type === FHIR_TYPE_CHOICE && question.item) {
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

  /* Check top-level answer */
  const value = answers[question.linkId];
  if (!value) return question.type === FHIR_TYPE_QUANTITY;

  /* Only validate if it's an object with dropdownValues structure (duration component) */
  if (typeof value === 'object' && 'dropdownValues' in value) {
    const hasNumber = !!value.dropdownValues?.number;
    const hasDays = !!value.dropdownValues?.days;
    return !hasNumber || !hasDays;
  }

  /* For regular choice questions (string values), not invalid */
  return false;
};

export type QuestionValidationReason =
  | 'uploadImage'
  | 'uploadCapturedImage'
  | 'allCompulsory'
  | 'enterValue'
  | 'selectOption'
  | 'outOfRange'
  | 'uploadInProgress'
  | 'uploadFailed';

export type CameraUploadIssue = 'uploading' | 'failed';

export const UPLOAD_ISSUE_REASON: Record<
  CameraUploadIssue,
  QuestionValidationReason
> = {
  uploading: 'uploadInProgress',
  failed: 'uploadFailed',
};

export interface QuestionValidationResult {
  valid: boolean;
  /** Only set when `valid` is false. */
  reason?: QuestionValidationReason;
  /** Text of the question whose value is out of range (only set when reason is 'outOfRange'). */
  outOfRangeText?: string;
}

export const validateQuestion = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>,
  isCameraAnswerMissingImages?: (
    q: AyuQuestion,
    a: Record<string, AyuAnswerValue>
  ) => boolean,
  cameraUploadIssue?: (q: AyuQuestion) => CameraUploadIssue | null
): QuestionValidationResult => {
  const rawAnswer = answers[question.linkId];
  const answerCodes: string[] = Array.isArray(rawAnswer)
    ? (rawAnswer as string[])
    : [];

  const cameraMissingImages =
    isCameraAnswerMissingImages?.(question, answers) ?? false;
  const uploadIssue = cameraUploadIssue?.(question) ?? null;
  const isAssociated =
    resolveAyuComponent(question) === ASSOCIATED_SYMPTOMS_COMPONENT;
  const { yesValues, noValues } = parseYesNoValues(rawAnswer);
  const answeredOptionCodes = new Set([...yesValues, ...noValues]);
  const optionCodes = (question.answerOption ?? [])
    .map(o => o.valueCoding?.code || o.valueString)
    .filter((c): c is string => !!c);
  const allOptionsAnswered =
    optionCodes.length > 0 &&
    optionCodes.every(code => answeredOptionCodes.has(code));
  const isAssociatedIncomplete =
    isAssociated &&
    !allOptionsAnswered &&
    !hasExclusiveSelected(question, yesValues);

  /*
   * PE branching questions: sub-questions are optional selectable concept-tags;
   * skip nested child validation — the question is valid once Yes/No is answered.
   */
  const isPE = isPhysicalExamOptionsQuestion(question);

  const numericOutOfRange =
    isNumericOutOfRange(question, answers) ||
    hasNestedOutOfRangeValue(question, answers);

  const isInvalid =
    cameraMissingImages ||
    uploadIssue !== null ||
    (!isPE && hasVisibleRequiredNestedString(question, answers)) ||
    (!isPE && hasUnansweredRequiredNestedChild(question, answers)) ||
    (isPE && hasMissingNestedBPInput(question, answers)) ||
    isQuantityInvalid(question, answers) ||
    numericOutOfRange ||
    (question.type === FHIR_TYPE_CHOICE &&
      !!question.repeats &&
      !isAssociated &&
      answerCodes.length === 0) ||
    (isAssociated && answerCodes.length === 0) ||
    (isStrictAssociatedSymptoms(question) && isAssociatedIncomplete);

  if (!isInvalid) return { valid: true };

  const reason: QuestionValidationReason = uploadIssue
    ? UPLOAD_ISSUE_REASON[uploadIssue]
    : cameraMissingImages
      ? 'uploadImage'
      : isAssociatedIncomplete && isStrictAssociatedSymptoms(question)
        ? 'allCompulsory'
        : numericOutOfRange
          ? 'outOfRange'
          : (!isPE && hasVisibleRequiredNestedString(question, answers)) ||
              (!isPE && isNestedInputValueMissing(question, answers)) ||
              (isPE && hasMissingNestedBPInput(question, answers)) ||
              isQuantityInvalid(question, answers)
            ? 'enterValue'
            : 'selectOption';

  if (reason === 'outOfRange') {
    return {
      valid: false,
      reason,
      outOfRangeText: findOutOfRangeQuestionText(question, answers),
    };
  }

  return { valid: false, reason };
};
