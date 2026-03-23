import type {
  AyuEnableWhen,
  AyuQuestion,
  AyuQuestionType,
} from '../types/ayu.types';
import type {
  FhirEnableWhen,
  FhirQuestionnaire,
} from '../types/fhir-raw.types';
import { EXT_URL_DISPLAY_TEXT } from './constants';

const ALLOWED_TYPES: AyuQuestionType[] = [
  'group',
  'display',
  'string',
  'integer',
  'decimal',
  'date',
  'choice',
  'quantity',
];
export function normalizeType(type: string): AyuQuestionType {
  if (ALLOWED_TYPES.includes(type as AyuQuestionType)) {
    return type as AyuQuestionType;
  }

  throw new Error(`Unsupported FHIR item type: ${type}`);
}

function normalizeEnableWhen(
  raw?: FhirEnableWhen[]
): AyuEnableWhen[] | undefined {
  if (!raw) return undefined;

  return raw.map(r => {
    if (r.operator !== '=' && r.operator !== '!=' && r.operator !== 'exists') {
      throw new Error(`Unsupported enableWhen operator: ${r.operator}`);
    }

    return {
      question: r.question,
      operator: r.operator,
      answerBoolean: r.answerBoolean,
      answerString: r.answerString,
      answerCoding: r.answerCoding,
    };
  });
}

function transformItem(item: AyuQuestion): AyuQuestion {
  return {
    linkId: item.linkId,
    text: item.text,
    _text: item._text,

    type: normalizeType(item.type),

    required: item.required,
    readOnly: item.readOnly,
    repeats: item.repeats,

    answerOption: item.answerOption,
    enableWhen: normalizeEnableWhen(item.enableWhen),
    extension: item.extension,
    item: item.item?.map(transformItem),
  };
}

export function transformFhirToAyu(
  questionnaire: FhirQuestionnaire
): AyuQuestion | null {
  if (!questionnaire.item || questionnaire.item.length === 0) {
    return null;
  }

  // Wrap multiple root items into a single AYU root group
  if (questionnaire.item.length >= 1) {
    return {
      linkId: 'root',
      type: 'group',
      text: questionnaire.title,
      item: questionnaire.item.map(transformItem),
    };
  }

  return transformItem(questionnaire.item[0]);
}

//resolve-label.ts
export function resolveLabel(
  question: AyuQuestion,
  parent?: AyuQuestion,
  previousSibling?: AyuQuestion
): string | undefined {
  // Question text itself
  if (question?.extension !== undefined) {
    return getLabel(question);
  }

  // Previous display item
  if (
    previousSibling?.type === 'display' &&
    previousSibling.extension !== undefined
  ) {
    return getLabel(question);
  }

  // Parent group text
  if (parent?.type === 'group' && parent.extension !== undefined) {
    return getLabel(question);
  }

  return question?.text;
}

function getLabel(question: AyuQuestion) {
  const valueString = question?.extension?.find(
    ext => ext.url === EXT_URL_DISPLAY_TEXT
  )?.valueString;
  return valueString ? valueString : question.text;
}
