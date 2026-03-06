import type {
  PhysicalExamQuestion,
  PhysicalExamOption,
} from '../data/physical-exam.data';

interface PhysExamRawOption {
  id: string;
  text: string;
  'input-type'?: string;
  'is-exclusive-option'?: string | boolean;
  'exclude-from-multi-choice'?: boolean;
  language?: string;
}

interface PhysExamRawQuestion {
  id: string;
  text: string;
  'job-aid-type'?: 'image' | 'video';
  'job-aid-file'?: string;
  isRequired?: string | boolean;
  'multi-choice'?: boolean;
  'enable-exclusive-option'?: string | boolean;
  language?: string;
  options?: PhysExamRawOption[];
  [key: string]: unknown;
}

interface PhysExamRawCategory {
  id: string;
  text: string;
  language?: string;
  options?: PhysExamRawQuestion[];
  [key: string]: unknown;
}

interface PhysExamRawSection {
  id: string;
  text: string;
  language?: string;
  options?: PhysExamRawCategory[];
  [key: string]: unknown;
}

export interface PhysExamRawRoot {
  id: string;
  text: string;
  engineVersion?: string;
  options?: PhysExamRawSection[];
}

/**
 * Convert the raw physExam.json tree (4-level nested) into a flat
 * PhysicalExamQuestion[] that matches the existing app contract.
 *
 * Tree structure:
 *   root.options[]           → sections   (level 1)
 *     section.options[]      → categories (level 2)
 *       category.options[]   → questions  (level 3)
 *         question.options[] → answers    (level 4)
 *e.g. filter "Hands:Nails cyanosis" → sectionKey="Hands", questionKey="Nails cyanosis"
 */
export function parsePhysExamJson(
  raw: PhysExamRawRoot
): PhysicalExamQuestion[] {
  const questions: PhysicalExamQuestion[] = [];

  for (const section of raw.options ?? []) {
    const sectionKey = section.text
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // sectionLabel: prefer section language field (e.g. "General Exams:"), else build it
    const sectionLabel =
      section.language && section.language !== '%'
        ? section.language
        : `${sectionKey}:`;

    for (const category of section.options ?? []) {
      const categoryLabel = category.text;
      // questionKey = category text — matches perform-physical-exam filter values
      const questionKey = category.text;

      for (const q of category.options ?? []) {
        const options: PhysicalExamOption[] = (q.options ?? []).map(opt => ({
          id: opt.id,
          text: opt.text,
          ...(opt['input-type'] === 'camera' ? { isCamera: true } : {}),
          ...(opt['is-exclusive-option'] === 'true' ||
          opt['is-exclusive-option'] === true
            ? { isExclusiveOption: true }
            : {}),
          ...(opt['exclude-from-multi-choice'] === true
            ? { excludeFromMulti: true }
            : {}),
        }));

        const questionText = q.text.replace(/\*$/, '').trim();
        const isRequired = q.isRequired === 'true' || q.isRequired === true;
        const isMultiChoice = q['multi-choice'] === true;

        let jobAidType: 'image' | 'video' | undefined;
        if (q['job-aid-type'] === 'image' || q['job-aid-type'] === 'video') {
          jobAidType = q['job-aid-type'];
        }

        questions.push({
          id: q.id,
          sectionLabel,
          categoryLabel,
          questionText,
          isRequired,
          isMultiChoice,
          ...(jobAidType ? { jobAidType } : {}),
          ...(q['job-aid-file'] ? { jobAidFile: q['job-aid-file'] } : {}),
          options,
          sectionKey,
          questionKey,
        });
      }
    }
  }

  return questions;
}
