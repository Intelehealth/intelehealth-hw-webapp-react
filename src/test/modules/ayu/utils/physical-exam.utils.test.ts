import { describe, expect, it } from 'vitest';
import type { AyuQuestion } from '../../../../modules/ayu-library/types/ayu.types';
import type { PhysicalExamQuestion } from '../../../../modules/ayu/types/physical-exam.types';
import {
  filterAyuQuestionsForPhysExam,
  filterPhysicalExamQuestions,
  flattenAyuPhysExamQuestions,
  parsePhysicalExamFilter,
} from '../../../../modules/ayu/utils/physical-exam.utils';
import {
  EXT_URL_PE_CATEGORY_LABEL,
  EXT_URL_PE_OPTION_KIND,
  EXT_URL_PE_QUESTION_KEY,
  EXT_URL_PE_SECTION_KEY,
  PE_OPTION_KIND_CAMERA,
} from '../../../../modules/ayu-library/utils/constants';
import { transformFhirPhysExamToAyu } from '../../../../modules/ayu-library/utils/fhir-to-ayu.util';
import { buildPhysicalExamData } from '../../../../modules/ayu/services/visit-upload.service';

// ── parsePhysicalExamFilter ─────────────────────────────────────────────────

describe('parsePhysicalExamFilter', () => {
  it('should return empty object for empty string', () => {
    expect(parsePhysicalExamFilter('')).toEqual({});
  });

  it('should parse single section with a question', () => {
    expect(parsePhysicalExamFilter('Head:Injury')).toEqual({
      Head: ['Injury'],
    });
  });

  it('should parse single section with no question (all questions)', () => {
    expect(parsePhysicalExamFilter('Head:')).toEqual({
      Head: [],
    });
  });

  it('should parse multiple sections', () => {
    const result = parsePhysicalExamFilter('Head:Injury;Ear:Bleeding;Eyes:');
    expect(result).toEqual({
      Head: ['Injury'],
      Ear: ['Bleeding'],
      Eyes: [],
    });
  });

  it('should accumulate questions for the same section', () => {
    const result = parsePhysicalExamFilter('Head:Injury;Head:Swelling');
    expect(result).toEqual({
      Head: ['Injury', 'Swelling'],
    });
  });

  it('should skip entries without a colon', () => {
    const result = parsePhysicalExamFilter('NoColon;Head:Injury');
    expect(result).toEqual({
      Head: ['Injury'],
    });
  });

  it('should skip entries with empty section name', () => {
    const result = parsePhysicalExamFilter(':SomeQuestion;Head:Injury');
    expect(result).toEqual({
      Head: ['Injury'],
    });
  });

  it('should trim whitespace from section and question', () => {
    const result = parsePhysicalExamFilter('  Head  :  Injury  ');
    expect(result).toEqual({
      Head: ['Injury'],
    });
  });

  it('should handle question with colon in the value', () => {
    const result = parsePhysicalExamFilter('Section:question:extra');
    expect(result).toEqual({
      Section: ['question:extra'],
    });
  });
});

// ── filterPhysicalExamQuestions ─────────────────────────────────────────────

describe('filterPhysicalExamQuestions', () => {
  const testQuestions: PhysicalExamQuestion[] = [
    {
      id: 'q1',
      sectionLabel: 'General:',
      categoryLabel: 'Cat A',
      questionText: 'Q1?',
      isRequired: true,
      isMultiChoice: false,
      sectionKey: 'General Exams',
      questionKey: 'Jaundice',
      options: [{ id: 'o1', text: 'Yes' }],
    },
    {
      id: 'q2',
      sectionLabel: 'General:',
      categoryLabel: 'Cat B',
      questionText: 'Q2?',
      isRequired: true,
      isMultiChoice: false,
      sectionKey: 'General Exams',
      questionKey: 'Pallor',
      options: [{ id: 'o2', text: 'No' }],
    },
    {
      id: 'q3',
      sectionLabel: 'Head:',
      categoryLabel: 'Cat C',
      questionText: 'Q3?',
      isRequired: true,
      isMultiChoice: false,
      sectionKey: 'Head',
      questionKey: 'Injury',
      options: [{ id: 'o3', text: 'No' }],
    },
    {
      id: 'q4',
      sectionLabel: 'Head:',
      categoryLabel: 'Cat D',
      questionText: 'Q4?',
      isRequired: false,
      isMultiChoice: false,
      sectionKey: 'Head',
      // No questionKey — tests the undefined branch
      options: [{ id: 'o4', text: 'Yes' }],
    },
  ];

  it('should return all questions when filterString is empty', () => {
    expect(filterPhysicalExamQuestions(testQuestions, '')).toEqual(
      testQuestions
    );
  });

  it('should filter to a specific section showing all its questions plus General Exams', () => {
    const result = filterPhysicalExamQuestions(testQuestions, 'Head:');
    expect(result.map(q => q.id)).toEqual(['q1', 'q2', 'q3', 'q4']);
  });

  it('should always include all General Exams questions even when filter narrows to one', () => {
    const result = filterPhysicalExamQuestions(
      testQuestions,
      'General Exams:Jaundice'
    );
    expect(result.map(q => q.id)).toEqual(['q1', 'q2']);
  });

  it('should exclude non-General sections not in the filter but always include General Exams', () => {
    const result = filterPhysicalExamQuestions(testQuestions, 'Head:Injury');
    expect(result.map(q => q.id)).toEqual(['q1', 'q2', 'q3']);
  });

  it('should exclude questions with undefined questionKey when filter specifies questions', () => {
    const result = filterPhysicalExamQuestions(testQuestions, 'Head:Injury');
    expect(result.find(q => q.id === 'q4')).toBeUndefined();
  });

  it('should include questions with undefined questionKey when filter allows all in section', () => {
    const result = filterPhysicalExamQuestions(testQuestions, 'Head:');
    expect(result.find(q => q.id === 'q4')).toBeDefined();
  });

  it('should always include all General Exams questions even when filter excludes them', () => {
    const result = filterPhysicalExamQuestions(testQuestions, 'Head:Injury');
    expect(result.find(q => q.id === 'q1')).toBeDefined();
    expect(result.find(q => q.id === 'q2')).toBeDefined();
  });

  it('should always include all General Exams questions even when filter narrows that section', () => {
    const result = filterPhysicalExamQuestions(
      testQuestions,
      'General Exams:Pallor'
    );
    expect(result.find(q => q.id === 'q1')).toBeDefined();
    expect(result.find(q => q.id === 'q2')).toBeDefined();
  });

  it('should handle multiple sections in filter', () => {
    const result = filterPhysicalExamQuestions(
      testQuestions,
      'General Exams:Pallor;Head:Injury'
    );
    expect(result.map(q => q.id)).toEqual(['q1', 'q2', 'q3']);
  });
});

// ── filterAyuQuestionsForPhysExam ──────────────────────────────────────────

describe('filterAyuQuestionsForPhysExam', () => {
  const PE_SECTION_KEY = 'urn:intelehealth:physical-exam/section-key';
  const PE_QUESTION_KEY = 'urn:intelehealth:physical-exam/question-key';

  const makeAyuPEQuestion = (
    linkId: string,
    sectionKey?: string,
    questionKey?: string
  ): AyuQuestion => ({
    linkId,
    type: 'string',
    extension: [
      ...(sectionKey
        ? [{ url: PE_SECTION_KEY, valueString: sectionKey }]
        : []),
      ...(questionKey
        ? [{ url: PE_QUESTION_KEY, valueString: questionKey }]
        : []),
    ],
  });

  const ayuQuestions: AyuQuestion[] = [
    makeAyuPEQuestion('a1', 'General Exams', 'Jaundice'),
    makeAyuPEQuestion('a2', 'Head', 'Injury'),
    makeAyuPEQuestion('a3', 'Head', 'Swelling'),
    makeAyuPEQuestion('a4'), // no sectionKey extension
  ];

  it('should return all questions when filterString is empty', () => {
    expect(filterAyuQuestionsForPhysExam(ayuQuestions, '')).toEqual(
      ayuQuestions
    );
  });

  it('should exclude questions with no sectionKey extension', () => {
    const result = filterAyuQuestionsForPhysExam(ayuQuestions, 'Head:Injury');
    expect(result.find(q => q.linkId === 'a4')).toBeUndefined();
  });

  it('should always include questions with sectionKey === General Exams', () => {
    const result = filterAyuQuestionsForPhysExam(ayuQuestions, 'Head:Injury');
    expect(result.find(q => q.linkId === 'a1')).toBeDefined();
  });

  it('should include all questions in a section when allowedQuestions is empty', () => {
    const result = filterAyuQuestionsForPhysExam(ayuQuestions, 'Head:');
    expect(result.map(q => q.linkId)).toEqual(['a1', 'a2', 'a3']);
  });

  it('should exclude sections not in the filter', () => {
    const result = filterAyuQuestionsForPhysExam(
      ayuQuestions,
      'General Exams:Jaundice'
    );
    expect(result.find(q => q.linkId === 'a2')).toBeUndefined();
  });

  it('should filter to specific questions within a section', () => {
    const result = filterAyuQuestionsForPhysExam(ayuQuestions, 'Head:Injury');
    expect(result.map(q => q.linkId)).toEqual(['a1', 'a2']);
  });
});

// ── flattenAyuPhysExamQuestions ────────────────────────────────────────────

describe('flattenAyuPhysExamQuestions', () => {
  const peChoice = (
    linkId: string,
    sectionKey: string,
    categoryLabel: string,
    options: Array<{ code: string; display: string; camera?: boolean }>,
    children?: AyuQuestion[]
  ): AyuQuestion => ({
    linkId,
    type: 'choice',
    text: categoryLabel,
    extension: [
      { url: EXT_URL_PE_SECTION_KEY, valueString: sectionKey },
      { url: EXT_URL_PE_CATEGORY_LABEL, valueString: categoryLabel },
    ],
    answerOption: options.map(o => ({
      valueCoding: { code: o.code, display: o.display },
      ...(o.camera
        ? {
            extension: [
              {
                url: EXT_URL_PE_OPTION_KIND,
                valueString: PE_OPTION_KIND_CAMERA,
              },
            ],
          }
        : {}),
    })),
    ...(children ? { item: children } : {}),
  });

  it('returns empty array for null root', () => {
    expect(flattenAyuPhysExamQuestions(null)).toEqual([]);
  });

  it('maps an Ayu choice question to the legacy shape with matching ids', () => {
    const root: AyuQuestion = {
      linkId: 'root',
      type: 'group',
      item: [
        peChoice('inner-1', 'Eyes', 'Eyes: Jaundice', [
          { code: 'yes-code', display: 'Yes' },
          { code: 'no-code', display: 'No' },
        ]),
      ],
    };

    const result = flattenAyuPhysExamQuestions(root);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'inner-1',
      sectionKey: 'Eyes',
      sectionLabel: 'Eyes:',
      categoryLabel: 'Eyes: Jaundice',
      options: [
        { id: 'yes-code', text: 'Yes' },
        { id: 'no-code', text: 'No' },
      ],
    });
  });

  it('marks camera options with isCamera', () => {
    const root: AyuQuestion = {
      linkId: 'root',
      type: 'group',
      item: [
        peChoice('q', 'Skin', 'Skin: Rash', [
          { code: 'cam', display: 'Picture Taken', camera: true },
        ]),
      ],
    };
    expect(flattenAyuPhysExamQuestions(root)[0].options[0]).toMatchObject({
      id: 'cam',
      isCamera: true,
    });
  });

  it('recurses into branching follow-up sub-questions', () => {
    const followUp = peChoice('sub-1', 'Skin', 'Surface', [
      { code: 'rough', display: 'Rough' },
    ]);
    const root: AyuQuestion = {
      linkId: 'root',
      type: 'group',
      item: [
        peChoice(
          'branch',
          'Skin',
          'Is there a rash?',
          [{ code: 'yes', display: 'Yes' }],
          [followUp]
        ),
      ],
    };
    const ids = flattenAyuPhysExamQuestions(root).map(q => q.id);
    expect(ids).toEqual(['branch', 'sub-1']);
  });

  // Regression: the upload obs must be built from the same transform the
  // stepper uses, so a wrapped question's answer is no longer dropped.
  it('produces non-blank obs end-to-end for a wrapped concept-tag question', () => {
    const wrapperLinkId = 'ID_wrap';
    const innerLinkId = 'ID-inner';
    const questionnaire = {
      resourceType: 'Questionnaire',
      item: [
        {
          linkId: 'sec-eyes',
          text: 'Eyes',
          type: 'group',
          answerOption: [{ valueCoding: { code: 'tag', display: 'Jaundice' } }],
          item: [
            {
              linkId: wrapperLinkId,
              text: 'Eyes: Jaundice',
              type: 'choice',
              answerOption: [
                { valueCoding: { code: 'tag', display: 'Is there jaundice?*' } },
              ],
              item: [
                {
                  linkId: innerLinkId,
                  text: 'Is there jaundice?*',
                  type: 'choice',
                  enableWhen: [
                    {
                      question: wrapperLinkId,
                      operator: '=',
                      answerCoding: { code: 'tag' },
                    },
                  ],
                  answerOption: [
                    { valueCoding: { code: 'yes', display: 'Yes' } },
                    { valueCoding: { code: 'no', display: 'No' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const root = transformFhirPhysExamToAyu(
      questionnaire as unknown as Parameters<
        typeof transformFhirPhysExamToAyu
      >[0]
    );
    const questions = flattenAyuPhysExamQuestions(root);

    // The stepper would store the answer under the inner choice's linkId.
    const answers = { [innerLinkId]: ['yes'] };
    const { obsValue } = buildPhysicalExamData(answers, questions);
    const parsed = JSON.parse(obsValue);

    expect(parsed.en).not.toBe('');
    expect(parsed.en.toLowerCase()).toContain('yes');
  });

  it('falls back to valueString / code and skips options without an id', () => {
    const root: AyuQuestion = {
      linkId: 'root',
      type: 'group',
      item: [
        {
          linkId: 'q-min',
          type: 'choice',
          required: true,
          repeats: true,
          // no text, no PE extensions → exercises the empty-string fallbacks
          answerOption: [
            { valueString: 'vs-only' }, // id + text from valueString
            { valueCoding: { code: 'c1' } }, // id from code, text falls back to ''
            { valueString: '' }, // falsy id → skipped
            {}, // no id at all → skipped
          ],
        },
      ],
    };

    const result = flattenAyuPhysExamQuestions(root);
    expect(result).toHaveLength(1);
    const q = result[0];
    expect(q.sectionKey).toBe('');
    expect(q.sectionLabel).toBe('');
    expect(q.categoryLabel).toBe('');
    expect(q.questionText).toBe('');
    expect(q.isRequired).toBe(true);
    expect(q.isMultiChoice).toBe(true);
    expect(q.questionKey).toBeUndefined();
    expect(q.options).toEqual([
      { id: 'vs-only', text: 'vs-only' },
      { id: 'c1', text: '' },
    ]);
  });

  it('uses question text as the category label when no category extension', () => {
    const root: AyuQuestion = {
      linkId: 'root',
      type: 'group',
      item: [
        {
          linkId: 'q',
          type: 'choice',
          text: 'Free text label',
          extension: [{ url: EXT_URL_PE_SECTION_KEY, valueString: 'Skin' }],
          answerOption: [{ valueCoding: { code: 'a', display: 'A' } }],
        },
      ],
    };

    const q = flattenAyuPhysExamQuestions(root)[0];
    expect(q.categoryLabel).toBe('Free text label');
    expect(q.questionText).toBe('Free text label');
    expect(q.sectionLabel).toBe('Skin:');
  });

  it('skips non-choice items and preserves the question key', () => {
    const root: AyuQuestion = {
      linkId: 'root',
      type: 'group',
      item: [
        { linkId: 'note', type: 'string', text: 'A note' }, // non-choice → skipped
        {
          linkId: 'q',
          type: 'choice',
          text: 'Q',
          extension: [
            { url: EXT_URL_PE_SECTION_KEY, valueString: 'Eyes' },
            { url: EXT_URL_PE_QUESTION_KEY, valueString: 'Jaundice' },
          ],
          answerOption: [{ valueCoding: { code: 'y', display: 'Yes' } }],
        },
      ],
    };

    const result = flattenAyuPhysExamQuestions(root);
    expect(result.map(r => r.id)).toEqual(['q']);
    expect(result[0].questionKey).toBe('Jaundice');
  });

  it('yields empty options for a choice question with no answerOption', () => {
    const root: AyuQuestion = {
      linkId: 'root',
      type: 'group',
      item: [{ linkId: 'q', type: 'choice', text: 'Q' }],
    };

    const result = flattenAyuPhysExamQuestions(root);
    expect(result).toHaveLength(1);
    expect(result[0].options).toEqual([]);
  });
});
