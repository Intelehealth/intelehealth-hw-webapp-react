import { describe, expect, it } from 'vitest';
import {
  filterPhysicalExamQuestions,
  parsePhysicalExamFilter,
  PHYSICAL_EXAM_QUESTIONS,
  type PhysicalExamQuestion,
} from '../../../../modules/ayu/data/physical-exam.data';

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
    // colonIdx is the first colon, so "Section:question:extra" -> section="Section", question="question:extra"
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
    expect(filterPhysicalExamQuestions(testQuestions, '')).toEqual(testQuestions);
  });

  it('should filter to a specific section showing all questions', () => {
    const result = filterPhysicalExamQuestions(testQuestions, 'Head:');
    expect(result).toHaveLength(2);
    expect(result.map(q => q.id)).toEqual(['q3', 'q4']);
  });

  it('should filter to a specific section and question', () => {
    const result = filterPhysicalExamQuestions(testQuestions, 'General Exams:Jaundice');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('q1');
  });

  it('should exclude sections not in the filter', () => {
    const result = filterPhysicalExamQuestions(testQuestions, 'Head:Injury');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('q3');
  });

  it('should exclude questions with undefined questionKey when filter specifies questions', () => {
    // q4 has no questionKey, filter asks for specific question in Head section
    const result = filterPhysicalExamQuestions(testQuestions, 'Head:Injury');
    expect(result.find(q => q.id === 'q4')).toBeUndefined();
  });

  it('should include questions with undefined questionKey when filter allows all in section', () => {
    // Head: (no specific question) means all questions in Head
    const result = filterPhysicalExamQuestions(testQuestions, 'Head:');
    expect(result.find(q => q.id === 'q4')).toBeDefined();
  });

  it('should handle multiple sections in filter', () => {
    const result = filterPhysicalExamQuestions(
      testQuestions,
      'General Exams:Pallor;Head:Injury'
    );
    expect(result).toHaveLength(2);
    expect(result.map(q => q.id)).toEqual(['q2', 'q3']);
  });
});

// ── PHYSICAL_EXAM_QUESTIONS constant ────────────────────────────────────────

describe('PHYSICAL_EXAM_QUESTIONS', () => {
  it('should export a non-empty array', () => {
    expect(Array.isArray(PHYSICAL_EXAM_QUESTIONS)).toBe(true);
    expect(PHYSICAL_EXAM_QUESTIONS.length).toBeGreaterThan(0);
  });

  it('should have required properties on every question', () => {
    for (const q of PHYSICAL_EXAM_QUESTIONS) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('sectionLabel');
      expect(q).toHaveProperty('categoryLabel');
      expect(q).toHaveProperty('questionText');
      expect(q).toHaveProperty('isRequired');
      expect(q).toHaveProperty('isMultiChoice');
      expect(q).toHaveProperty('sectionKey');
      expect(q).toHaveProperty('options');
      expect(q.options.length).toBeGreaterThan(0);
    }
  });

  it('should have at least one conditional question with showWhen', () => {
    const conditional = PHYSICAL_EXAM_QUESTIONS.filter(q => q.showWhen);
    expect(conditional.length).toBeGreaterThan(0);
    for (const q of conditional) {
      expect(q.showWhen).toHaveProperty('questionId');
      expect(q.showWhen).toHaveProperty('optionId');
    }
  });

  it('should have at least one multi-choice question', () => {
    expect(PHYSICAL_EXAM_QUESTIONS.some(q => q.isMultiChoice)).toBe(true);
  });

  it('should have at least one question with jobAidType', () => {
    expect(PHYSICAL_EXAM_QUESTIONS.some(q => q.jobAidType === 'image')).toBe(true);
    expect(PHYSICAL_EXAM_QUESTIONS.some(q => q.jobAidType === 'video')).toBe(true);
  });

  it('should have options with camera flags', () => {
    const cameraOptions = PHYSICAL_EXAM_QUESTIONS.flatMap(q =>
      q.options.filter(o => o.isCamera)
    );
    expect(cameraOptions.length).toBeGreaterThan(0);
    cameraOptions.forEach(o => expect(o.isExclusiveOption).toBe(true));
  });

  it('should have options with excludeFromMulti flag', () => {
    const excludeOpts = PHYSICAL_EXAM_QUESTIONS.flatMap(q =>
      q.options.filter(o => o.excludeFromMulti)
    );
    expect(excludeOpts.length).toBeGreaterThan(0);
  });
});
