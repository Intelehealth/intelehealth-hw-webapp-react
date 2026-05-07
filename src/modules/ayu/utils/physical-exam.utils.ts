import type { PhysicalExamQuestion } from '../types/physical-exam.types';

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
