import type {
  AyuEnableWhen,
  AyuQuestion,
  AyuQuestionType,
} from '../types/ayu.types';
import type {
  FhirEnableWhen,
  FhirExtension,
  FhirQuestionnaire,
} from '../types/fhir-raw.types';
import {
  EXT_URL_AGE_MAX,
  EXT_URL_AGE_MIN,
  EXT_URL_DISPLAY_TEXT,
  EXT_URL_GENDER,
  GENDER_CODE_FEMALE,
  GENDER_CODE_MALE,
  GENDER_CODE_OTHER,
} from './constants';

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

export interface PatientDemographics {
  age?: number | null;
  gender?: string | null;
}

export function parsePatientAgeYears(
  raw: string | number | null | undefined
): number | null {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

  const str = String(raw).trim();
  if (!str) return null;

  const numericMatch = str.match(
    /^(\d+(?:\.\d+)?)(?:\s*(?:y|yr|yrs|year|years))?$/i
  );
  if (numericMatch) return Number(numericMatch[1]);

  const date = new Date(str);
  if (!Number.isNaN(date.getTime())) {
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const m = now.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age--;
    return age >= 0 ? age : null;
  }
  return null;
}

// Normalize any gender representation to the canonical extension code; returns null when unclassifiable.
export function normalizePatientGenderCode(
  raw: string | null | undefined
): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (s === 'f' || s === 'female' || s === GENDER_CODE_FEMALE)
    return GENDER_CODE_FEMALE;
  if (s === 'm' || s === 'male' || s === GENDER_CODE_MALE)
    return GENDER_CODE_MALE;
  if (s === 'o' || s === 'other') return GENDER_CODE_OTHER;
  return null;
}

function readExt(
  extensions: FhirExtension[] | undefined,
  url: string
): string | undefined {
  return extensions?.find(e => e.url === url)?.valueString;
}

// True when an item's gender/age-min/age-max extensions allow the current patient; missing constraints fail open.
export function matchesDemographics(
  extensions: FhirExtension[] | undefined,
  demographics?: PatientDemographics
): boolean {
  if (!extensions || extensions.length === 0) return true;
  if (!demographics) return true;

  const requiredGenderRaw = readExt(extensions, EXT_URL_GENDER);
  if (requiredGenderRaw) {
    const requiredGender = normalizePatientGenderCode(requiredGenderRaw);
    const patientGender = normalizePatientGenderCode(demographics.gender);
    if (requiredGender && patientGender && patientGender !== requiredGender) {
      return false;
    }
  }

  const ageMinRaw = readExt(extensions, EXT_URL_AGE_MIN);
  const ageMaxRaw = readExt(extensions, EXT_URL_AGE_MAX);
  if (ageMinRaw || ageMaxRaw) {
    const age = demographics.age;
    if (age != null) {
      const min = ageMinRaw ? Number(ageMinRaw) : Number.NEGATIVE_INFINITY;
      const max = ageMaxRaw ? Number(ageMaxRaw) : Number.POSITIVE_INFINITY;
      if (!Number.isNaN(min) && age < min) return false;
      if (!Number.isNaN(max) && age > max) return false;
    }
  }

  return true;
}

function transformItem(
  item: AyuQuestion,
  demographics?: PatientDemographics
): AyuQuestion {
  const children = item.item
    ?.filter(child => matchesDemographics(child.extension, demographics))
    .map(child => transformItem(child, demographics));

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
    item: children,
  };
}

// True when the questionnaire's top-level demographic extensions match the patient.
export function questionnaireMatchesDemographics(
  questionnaire: FhirQuestionnaire | null | undefined,
  demographics?: PatientDemographics
): boolean {
  if (!questionnaire) return true;
  return matchesDemographics(questionnaire.extension, demographics);
}

export function transformFhirToAyu(
  questionnaire: FhirQuestionnaire,
  demographics?: PatientDemographics
): AyuQuestion | null {
  if (!questionnaire.item || questionnaire.item.length === 0) {
    return null;
  }

  // Wrap root items into a single AYU root group
  const items = questionnaire.item
    .filter(item => matchesDemographics(item.extension, demographics))
    .map(item => transformItem(item, demographics));

  return {
    linkId: 'root',
    type: 'group',
    text: questionnaire.title,
    item: items,
  };
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
  if (question.text) return question.text;
  return question?.extension?.find(ext => ext.url === EXT_URL_DISPLAY_TEXT)
    ?.valueString;
}
