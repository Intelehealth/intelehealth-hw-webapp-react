import { describe, expect, it } from 'vitest';
import type { AyuJsonItem } from '../../../../modules/ayu-library/types/ayu-json.types';
import type { AyuQuestion } from '../../../../modules/ayu-library/types/ayu.types';
import type { FhirQuestionnaire } from '../../../../modules/ayu-library/types/fhir-raw.types';
import {
  EXT_URL_PE_QUESTION_KEY,
  EXT_URL_PE_SECTION_KEY,
  EXT_URL_PERFORM_PHYSICAL_EXAM,
} from '../../../../modules/ayu-library/utils/constants';
import type { PhysicalExamQuestion } from '../../../../modules/ayu/types/physical-exam.types';
import {
  ALWAYS_INCLUDED_SECTION_KEY,
  combinePhysicalExamFilters,
  filterAyuQuestionsForPhysExam,
  filterPhysicalExamQuestions,
  getPhysicalExamFilterFromComplaints,
  parsePhysicalExamFilter,
} from '../../../../modules/ayu/utils/physical-exam.utils';

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
      options: [{ id: 'o4', text: 'Yes' }],
    },
  ];

  it('should return only the always-included General Exams when filterString is empty', () => {
    const result = filterPhysicalExamQuestions(testQuestions, '');
    expect(result.map(q => q.id)).toEqual(['q1', 'q2']);
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

describe('filterAyuQuestionsForPhysExam', () => {
  const make = (
    linkId: string,
    section: string,
    questionKey?: string
  ): AyuQuestion => ({
    linkId,
    type: 'choice',
    extension: [
      { url: EXT_URL_PE_SECTION_KEY, valueString: section },
      ...(questionKey
        ? [{ url: EXT_URL_PE_QUESTION_KEY, valueString: questionKey }]
        : []),
    ],
  });

  const questions: AyuQuestion[] = [
    make('a1', ALWAYS_INCLUDED_SECTION_KEY, 'Jaundice'),
    make('a2', ALWAYS_INCLUDED_SECTION_KEY, 'Pallor'),
    make('e1', 'Eyes', 'Jaundice'),
    make('e2', 'Eyes', 'Pallor'),
    make('h1', 'Head', 'Injury'),
    make('h2', 'Head', 'Swelling'),
    make('noSection', '', 'orphan'),
  ];

  it('returns only the always-included General Exams when the filter is empty', () => {
    const result = filterAyuQuestionsForPhysExam(questions, '');
    expect(result.map(q => q.linkId)).toEqual(['a1', 'a2']);
  });

  it('returns the filtered set plus General Exams when a filter is supplied', () => {
    const result = filterAyuQuestionsForPhysExam(questions, 'Eyes:Jaundice');
    expect(result.map(q => q.linkId)).toEqual(['a1', 'a2', 'e1']);
  });

  it('honours a combined multi-protocol filter and dedups overlapping sections', () => {
    const combined = combinePhysicalExamFilters([
      'Eyes:Jaundice',
      'Eyes:Jaundice;Head:Injury',
    ]);
    const result = filterAyuQuestionsForPhysExam(questions, combined);
    expect(result.map(q => q.linkId).sort()).toEqual(
      ['a1', 'a2', 'e1', 'h1'].sort()
    );
  });

  it('treats a show-all section entry as everything in that section', () => {
    const result = filterAyuQuestionsForPhysExam(questions, 'Head:');
    expect(result.map(q => q.linkId).sort()).toEqual(
      ['a1', 'a2', 'h1', 'h2'].sort()
    );
  });

  it('drops questions whose section extension is missing', () => {
    const result = filterAyuQuestionsForPhysExam(questions, 'Head:Injury');
    expect(result.map(q => q.linkId)).not.toContain('noSection');
  });

  it('drops a question in a filtered section when its question-key extension is missing', () => {
    const withMissingKey: AyuQuestion[] = [
      make('h1', 'Head', 'Injury'),
      make('hNoKey', 'Head'),
    ];
    const result = filterAyuQuestionsForPhysExam(withMissingKey, 'Head:Injury');
    expect(result.map(q => q.linkId)).toEqual(['h1']);
  });
});

describe('combinePhysicalExamFilters', () => {
  const parsedEquals = (a: string, b: string) => {
    expect(parsePhysicalExamFilter(a)).toEqual(parsePhysicalExamFilter(b));
  };

  it('returns empty string when given no filters', () => {
    expect(combinePhysicalExamFilters([])).toBe('');
  });

  it('ignores empty / null / undefined entries', () => {
    expect(combinePhysicalExamFilters(['', null, undefined])).toBe('');
  });

  it('passes a single filter through unchanged after a round trip', () => {
    parsedEquals(
      combinePhysicalExamFilters(['Eyes:Jaundice;Head:Injury']),
      'Eyes:Jaundice;Head:Injury'
    );
  });

  it('unions question lists across two protocols', () => {
    const combined = combinePhysicalExamFilters([
      'Eyes:Jaundice;Head:Injury',
      'Eyes:Pallor;Mouth:Lips',
    ]);
    parsedEquals(combined, 'Eyes:Jaundice;Eyes:Pallor;Head:Injury;Mouth:Lips');
  });

  it('dedups the same test across protocols (Eyes:Jaundice in both)', () => {
    const combined = combinePhysicalExamFilters([
      'Eyes:Jaundice',
      'Eyes:Jaundice;Head:Injury',
    ]);
    const parsed = parsePhysicalExamFilter(combined);
    expect(parsed.Eyes).toEqual(['Jaundice']);
    expect(parsed.Head).toEqual(['Injury']);
  });

  it('promotes to show-all when any protocol omits the question list', () => {
    const combined = combinePhysicalExamFilters(['Eyes:Jaundice', 'Eyes:']);
    expect(parsePhysicalExamFilter(combined)).toEqual({ Eyes: [] });
  });

  it('keeps later show-all overriding earlier specific questions', () => {
    const combined = combinePhysicalExamFilters([
      'Eyes:Jaundice;Eyes:Pallor',
      'Eyes:',
    ]);
    expect(parsePhysicalExamFilter(combined)).toEqual({ Eyes: [] });
  });

  it('keeps earlier show-all even if later protocols list specific questions', () => {
    const combined = combinePhysicalExamFilters(['Eyes:', 'Eyes:Jaundice']);
    expect(parsePhysicalExamFilter(combined)).toEqual({ Eyes: [] });
  });
});

describe('getPhysicalExamFilterFromComplaints', () => {
  const makeComplaint = (name: string, filter?: string): AyuJsonItem => {
    const questionnaire: FhirQuestionnaire = {
      resourceType: 'Questionnaire',
      title: name,
      extension: filter
        ? [{ url: EXT_URL_PERFORM_PHYSICAL_EXAM, valueString: filter }]
        : [],
      item: [],
    };
    return {
      id: 1,
      name: `${name}.json`,
      json: questionnaire,
      keyName: 'ayu',
      isActive: true,
    };
  };

  it('returns empty string when no complaints are supplied', () => {
    expect(getPhysicalExamFilterFromComplaints(undefined)).toBe('');
    expect(getPhysicalExamFilterFromComplaints([])).toBe('');
  });

  it('reads the perform-physical-exam extension from a single complaint', () => {
    const filter = getPhysicalExamFilterFromComplaints([
      makeComplaint('Cough', 'Chest:Wheeze;Head:'),
    ]);
    expect(parsePhysicalExamFilter(filter)).toEqual({
      Chest: ['Wheeze'],
      Head: [],
    });
  });

  it('combines extensions across multiple complaints with dedup', () => {
    const filter = getPhysicalExamFilterFromComplaints([
      makeComplaint('Cough', 'Chest:Wheeze;Eyes:Jaundice'),
      makeComplaint('Fever', 'Eyes:Jaundice;Head:Injury'),
    ]);
    const parsed = parsePhysicalExamFilter(filter);
    expect(parsed.Chest).toEqual(['Wheeze']);
    expect(parsed.Eyes).toEqual(['Jaundice']);
    expect(parsed.Head).toEqual(['Injury']);
  });

  it('treats a complaint missing the extension as a no-op', () => {
    const filter = getPhysicalExamFilterFromComplaints([
      makeComplaint('Cough', 'Chest:Wheeze'),
      makeComplaint('NoExt'),
    ]);
    expect(parsePhysicalExamFilter(filter)).toEqual({ Chest: ['Wheeze'] });
  });

  it('treats a complaint with no extension array at all as a no-op', () => {
    const noExtArray: AyuJsonItem = {
      id: 2,
      name: 'Bare.json',
      json: { resourceType: 'Questionnaire', title: 'Bare', item: [] },
      keyName: 'ayu',
      isActive: true,
    };
    const filter = getPhysicalExamFilterFromComplaints([
      makeComplaint('Cough', 'Chest:Wheeze'),
      noExtArray,
    ]);
    expect(parsePhysicalExamFilter(filter)).toEqual({ Chest: ['Wheeze'] });
  });
});
