import type { AyuQuestion } from '../../ayu-library/types/ayu.types';
import {
  EXT_URL_PE_CATEGORY_LABEL,
  EXT_URL_PE_OPTION_KIND,
  EXT_URL_PE_QUESTION_KEY,
  EXT_URL_PE_SECTION_KEY,
  PE_OPTION_KIND_CAMERA,
} from '../../ayu-library/utils/constants';
import type {
  PhysicalExamOption,
  PhysicalExamQuestion,
} from '../types/physical-exam.types';

/** Section that is always shown regardless of the protocol filter. */
export const ALWAYS_INCLUDED_SECTION_KEY = 'General Exams';

/**
 * Parse the perform-physical-exam string from the protocol extension.
 * Format: "Section1:QuestionA;Section2:QuestionB;Section3:"
 * An empty question part means "show all questions in that section".
 * Returns a map of { sectionKey → string[] of allowed questionKeys (empty = all) }
 */
export const parsePhysicalExamFilter = (
  filterString: string
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  if (!filterString) return result;
  filterString.split(';').forEach(entry => {
    const colonIdx = entry.indexOf(':');
    if (colonIdx === -1) return;
    const section = entry.substring(0, colonIdx).trim();
    const question = entry.substring(colonIdx + 1).trim();
    if (!section) return;
    if (!result[section]) result[section] = [];
    if (question) result[section].push(question);
  });
  return result;
};

/**
 * Filter the question list using a perform-physical-exam filter string.
 * If filterString is empty, all questions are returned.
 * Questions in the "General Exams" section are always included.
 */
export const filterPhysicalExamQuestions = (
  questions: PhysicalExamQuestion[],
  filterString: string
): PhysicalExamQuestion[] => {
  const filter = parsePhysicalExamFilter(filterString);
  const sectionKeys = Object.keys(filter);
  if (sectionKeys.length === 0) return questions;

  return questions.filter(q => {
    if (q.sectionKey === ALWAYS_INCLUDED_SECTION_KEY) return true;
    const allowedQuestions = filter[q.sectionKey];
    if (allowedQuestions === undefined) return false;
    if (allowedQuestions.length === 0) return true;
    return (
      q.questionKey !== undefined && allowedQuestions.includes(q.questionKey)
    );
  });
};

/**
 * FHIR-shaped sibling of filterPhysicalExamQuestions. Operates on the
 * AyuQuestion[] produced by transformFhirPhysExamToAyu, reading the PE
 * section-key and question-key from extensions instead of typed fields.
 */
export const filterAyuQuestionsForPhysExam = (
  questions: AyuQuestion[],
  filterString: string
): AyuQuestion[] => {
  const filter = parsePhysicalExamFilter(filterString);
  const sectionKeys = Object.keys(filter);
  if (sectionKeys.length === 0) return questions;

  const readExt = (q: AyuQuestion, url: string): string | undefined =>
    q.extension?.find(e => e.url === url)?.valueString;

  return questions.filter(q => {
    const sectionKey = readExt(q, EXT_URL_PE_SECTION_KEY);
    if (!sectionKey) return false;
    if (sectionKey === ALWAYS_INCLUDED_SECTION_KEY) return true;
    const allowedQuestions = filter[sectionKey];
    if (allowedQuestions === undefined) return false;
    if (allowedQuestions.length === 0) return true;
    const questionKey = readExt(q, EXT_URL_PE_QUESTION_KEY);
    return !!questionKey && allowedQuestions.includes(questionKey);
  });
};

const readQExt = (q: AyuQuestion, url: string): string | undefined =>
  q.extension?.find(e => e.url === url)?.valueString;

const ayuQuestionToLegacy = (q: AyuQuestion): PhysicalExamQuestion | null => {
  if (q.type !== 'choice') return null;

  const sectionKey = readQExt(q, EXT_URL_PE_SECTION_KEY) ?? '';
  const categoryLabel = readQExt(q, EXT_URL_PE_CATEGORY_LABEL) ?? q.text ?? '';
  const questionKey = readQExt(q, EXT_URL_PE_QUESTION_KEY);

  const options: PhysicalExamOption[] = [];
  for (const o of q.answerOption ?? []) {
    const id = o.valueCoding?.code ?? o.valueString;
    if (!id) continue;
    const isCamera = o.extension?.some(
      e =>
        e.url === EXT_URL_PE_OPTION_KIND &&
        e.valueString === PE_OPTION_KIND_CAMERA
    );
    options.push({
      id,
      text: o.valueCoding?.display ?? o.valueString ?? '',
      ...(isCamera ? { isCamera: true } : {}),
    });
  }

  return {
    id: q.linkId,
    sectionLabel: sectionKey ? `${sectionKey}:` : '',
    categoryLabel,
    questionText: q.text ?? '',
    isRequired: q.required === true,
    isMultiChoice: q.repeats === true,
    options,
    sectionKey,
    ...(questionKey !== undefined ? { questionKey } : {}),
  };
};

/**
 * Flatten the AyuQuestion tree produced by transformFhirPhysExamToAyu into the
 * legacy PhysicalExamQuestion[] shape consumed by buildPhysicalExamData.
 *
 * The visit-upload obs HTML must be built from the SAME question IDs / option
 * codes the stepper stored answers under. The stepper unwraps concept-tag
 * wrappers and collapses branching sub-forms, so re-parsing the raw FHIR with
 * the old parseFhirPhysExamQuestionnaire produces mismatched linkIds and the
 * obs comes out blank. Deriving the questions from the same transform keeps
 * them aligned. Branching follow-ups are nested under their parent question, so
 * recurse into `item[]` to surface their answers too.
 */
export const flattenAyuPhysExamQuestions = (
  root: AyuQuestion | null
): PhysicalExamQuestion[] => {
  const out: PhysicalExamQuestion[] = [];
  const walk = (items: AyuQuestion[] | undefined) => {
    for (const q of items ?? []) {
      const legacy = ayuQuestionToLegacy(q);
      if (legacy) out.push(legacy);
      if (q.item?.length) walk(q.item);
    }
  };
  walk(root?.item);
  return out;
};
