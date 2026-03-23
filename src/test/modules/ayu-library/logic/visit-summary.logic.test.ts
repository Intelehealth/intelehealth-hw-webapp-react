import { describe, expect, it } from 'vitest';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../modules/ayu-library/types/ayu.types';
import { buildVisitSummary } from '../../../../modules/ayu-library/logic/visit-summary.logic';

const makeQuestion = (overrides: Partial<AyuQuestion> = {}): AyuQuestion => ({
  linkId: 'q1',
  type: 'string',
  text: 'Question 1',
  extension: [
    {
      url: 'urn:intelehealth:original-question-text',
      valueString: 'Question 1',
    },
  ],
  ...overrides,
});

const makeChoiceQuestion = (
  overrides: Partial<AyuQuestion> = {}
): AyuQuestion => ({
  linkId: 'q1',
  type: 'choice',
  text: 'Select option',
  extension: [
    {
      url: 'urn:intelehealth:original-question-text',
      valueString: 'Select option',
    },
  ],
  answerOption: [
    { valueCoding: { code: 'CODE_A', display: 'Option A' } },
    { valueCoding: { code: 'CODE_B', display: 'Option B' } },
    { valueCoding: { code: 'CODE_C', display: 'Option C' } },
  ],
  ...overrides,
});

describe('buildVisitSummary', () => {
  describe('empty and basic cases', () => {
    it('should return empty array when no questions', () => {
      const result = buildVisitSummary([], new Map(), 'Visit');
      expect(result).toEqual([]);
    });

    it('should return empty array when questions have no answers', () => {
      const questions = [makeQuestion()];
      const result = buildVisitSummary(questions, new Map(), 'Visit');
      expect(result).toEqual([]);
    });

    it('should use provided section title', () => {
      const questions = [makeQuestion()];
      const answers = new Map<string, AyuAnswerValue>([['q1', 'My answer']]);
      const result = buildVisitSummary(questions, answers, 'Chief Complaint');
      expect(result[0].title).toBe('Chief Complaint');
    });
  });

  describe('simple types', () => {
    it('should handle string answer', () => {
      const questions = [makeQuestion({ type: 'string' })];
      const answers = new Map<string, AyuAnswerValue>([['q1', 'My answer']]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Question 1',
        value: 'My answer',
      });
    });

    it('should handle integer answer', () => {
      const questions = [makeQuestion({ type: 'integer' })];
      const answers = new Map<string, AyuAnswerValue>([['q1', 42]]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Question 1',
        value: '42',
      });
    });

    it('should skip when string answer equals label (display-only)', () => {
      const questions = [makeQuestion({ type: 'string', text: 'Question 1' })];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'Question 1'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result).toEqual([]);
    });
  });

  describe('quantity type', () => {
    it('should format duration answer (number + days)', () => {
      const questions = [
        makeQuestion({
          linkId: 'q1',
          type: 'quantity',
          text: 'Duration',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Duration',
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', { dropdownValues: { number: 5, days: 'days' } }],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Duration',
        value: '5 days',
      });
    });

    it('should format quantity answer (value + unit)', () => {
      const questions = [
        makeQuestion({
          linkId: 'q1',
          type: 'quantity',
          text: 'Weight',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Weight',
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', { value: 70, unit: 'kg' }],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Weight',
        value: '70 kg',
      });
    });
  });

  describe('single select (choice)', () => {
    it('should display the option display text', () => {
      const questions = [makeChoiceQuestion()];
      const answers = new Map<string, AyuAnswerValue>([['q1', 'CODE_A']]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A',
      });
    });

    it('should handle nested children triggered by selected option', () => {
      const questions = [
        makeChoiceQuestion({
          item: [
            {
              linkId: 'q1.1',
              type: 'string',
              text: 'Details',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Details',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'CODE_A' },
                },
              ],
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'CODE_A'],
        ['q1.1', 'Some details'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A - Some details',
      });
    });
  });

  describe('multi-select (choice with array)', () => {
    it('should display comma-separated option displays', () => {
      const questions = [makeChoiceQuestion({ repeats: true })];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A', 'CODE_B']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A, Option B',
      });
    });
  });

  describe('associated symptoms', () => {
    const makeAssociatedSymptomsQuestion = (): AyuQuestion => ({
      linkId: 'assoc',
      type: 'choice',
      text: 'Associated symptoms',
      repeats: true,
      extension: [
        {
          url: 'urn:intelehealth:original-question-text',
          valueString: 'Associated symptoms',
        },
      ],
      answerOption: [
        { valueCoding: { code: 'ID_1', display: 'Headache' } },
        { valueCoding: { code: 'ID_2', display: 'Nausea' } },
        { valueCoding: { code: 'ID_3', display: 'Fatigue' } },
      ],
    });

    it('should separate reports and denies', () => {
      const questions = [makeAssociatedSymptomsQuestion()];
      const answers = new Map<string, AyuAnswerValue>([
        ['assoc', ['ID_1', 'NO_ID_2']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      // Should have associated symptoms section
      const assocSection = result.find(
        s => s.title === 'Associated symptoms'
      );
      expect(assocSection).toBeDefined();

      const reports = assocSection!.items.find(
        i => i.type === 'subheading' && i.heading === 'Patient reports'
      );
      expect(reports).toBeDefined();
      if (reports && reports.type === 'subheading') {
        expect(reports.values[0]).toContain('Headache');
      }

      const denies = assocSection!.items.find(
        i => i.type === 'subheading' && i.heading === 'Patient denies'
      );
      expect(denies).toBeDefined();
      if (denies && denies.type === 'subheading') {
        expect(denies.values[0]).toContain('Nausea');
      }
    });

    it('should only show reports when no denies', () => {
      const questions = [makeAssociatedSymptomsQuestion()];
      const answers = new Map<string, AyuAnswerValue>([
        ['assoc', ['ID_1', 'ID_3']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      const assocSection = result.find(
        s => s.title === 'Associated symptoms'
      );
      expect(assocSection).toBeDefined();
      expect(
        assocSection!.items.every(
          i => i.type !== 'subheading' || i.heading !== 'Patient denies'
        )
      ).toBe(true);
    });

    it('should only show denies when no reports', () => {
      const questions = [makeAssociatedSymptomsQuestion()];
      const answers = new Map<string, AyuAnswerValue>([
        ['assoc', ['NO_ID_1', 'NO_ID_2']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      const assocSection = result.find(
        s => s.title === 'Associated symptoms'
      );
      expect(assocSection).toBeDefined();
      expect(
        assocSection!.items.every(
          i => i.type !== 'subheading' || i.heading !== 'Patient reports'
        )
      ).toBe(true);
    });
  });

  describe('multiple questions', () => {
    it('should build summary for multiple questions', () => {
      const questions: AyuQuestion[] = [
        makeQuestion({
          linkId: 'q1',
          type: 'string',
          text: 'Complaint',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Complaint',
            },
          ],
        }),
        makeChoiceQuestion({
          linkId: 'q2',
          text: 'Severity',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Severity',
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'Headache'],
        ['q2', 'CODE_B'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items).toHaveLength(2);
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Complaint',
        value: 'Headache',
      });
      expect(result[0].items[1]).toEqual({
        type: 'labelValue',
        label: 'Severity',
        value: 'Option B',
      });
    });
  });

  describe('section structure', () => {
    it('should return SummarySection with title and items', () => {
      const questions = [makeQuestion()];
      const answers = new Map<string, AyuAnswerValue>([['q1', 'answer']]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('items');
      expect(Array.isArray(result[0].items)).toBe(true);
    });

    it('should separate main items and associated symptoms into different sections', () => {
      const questions: AyuQuestion[] = [
        makeQuestion({
          linkId: 'q1',
          type: 'string',
        }),
        {
          linkId: 'assoc',
          type: 'choice',
          text: 'Associated symptoms',
          repeats: true,
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Associated symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'ID_1', display: 'Headache' } },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'My complaint'],
        ['assoc', ['ID_1']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Visit');
      expect(result[1].title).toBe('Associated symptoms');
    });
  });

  describe('recursive children processing', () => {
    it('should process nested children of unanswered parents', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'parent',
          type: 'group',
          text: 'Parent',
          item: [
            {
              linkId: 'child1',
              type: 'string',
              text: 'Child Question',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Child Question',
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['child1', 'Child answer'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Child Question',
        value: 'Child answer',
      });
    });
  });

  describe('quantity with value and unit', () => {
    it('should format quantity with value only (no unit)', () => {
      const questions = [
        makeQuestion({
          linkId: 'q1',
          type: 'quantity',
          text: 'Temperature',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Temperature',
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', { value: 98.6 }],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Temperature',
        value: '98.6',
      });
    });

    it('should format duration with number only (no days)', () => {
      const questions = [
        makeQuestion({
          linkId: 'q1',
          type: 'quantity',
          text: 'Duration',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Duration',
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', { dropdownValues: { number: 3 } }],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Duration',
        value: '3',
      });
    });
  });

  describe('multi-select with nested children', () => {
    it('should process nested children for multi-select options', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          linkId: 'q1',
          repeats: true,
          item: [
            {
              linkId: 'q1.nested',
              type: 'string',
              text: 'Details for A',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Details for A',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'CODE_A' },
                },
              ],
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A']],
        ['q1.nested', 'nested answer'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0].type).toBe('labelValue');
      if (result[0].items[0].type === 'labelValue') {
        expect(result[0].items[0].value).toContain('nested answer');
      }
    });
  });

  describe('associated symptoms with nested children', () => {
    it('should include nested values in associated symptoms reports', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'assoc',
          type: 'choice',
          text: 'Associated symptoms',
          repeats: true,
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Associated symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'ID_1', display: 'Headache' } },
          ],
          item: [
            {
              linkId: 'assoc.child',
              type: 'string',
              text: 'Severity',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Severity',
                },
              ],
              enableWhen: [
                {
                  question: 'assoc',
                  operator: '=',
                  answerCoding: { code: 'ID_1' },
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['assoc', ['ID_1']],
        ['assoc.child', 'Severe'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      const assocSection = result.find(s => s.title === 'Associated symptoms');
      expect(assocSection).toBeDefined();
      const reports = assocSection!.items.find(
        i => i.type === 'subheading' && i.heading === 'Patient reports'
      );
      expect(reports).toBeDefined();
      if (reports && reports.type === 'subheading') {
        expect(reports.values[0]).toContain('Headache');
        expect(reports.values[0]).toContain('Severe');
      }
    });
  });

  describe('null and edge cases for formatAnswerByType', () => {
    it('should return empty result for null answer', () => {
      const questions = [makeQuestion({ type: 'string' })];
      const answers = new Map<string, AyuAnswerValue>([['q1', null]]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result).toEqual([]);
    });

    it('should handle choice answer with no matching display', () => {
      const questions = [makeChoiceQuestion()];
      const answers = new Map<string, AyuAnswerValue>([['q1', 'UNKNOWN_CODE']]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      // No display found for unknown code, should not add item
      expect(result).toEqual([]);
    });
  });
});
