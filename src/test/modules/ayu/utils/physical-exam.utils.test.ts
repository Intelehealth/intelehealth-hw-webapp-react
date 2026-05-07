import { describe, expect, it } from 'vitest';
import type { PhysicalExamQuestion } from '../../../../modules/ayu/types/physical-exam.types';
import {
  filterPhysicalExamQuestions,
  parsePhysicalExamFilter,
} from '../../../../modules/ayu/utils/physical-exam.utils';

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
