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

  describe('useLabeledFormat (patient/family history)', () => {
    const makePatientHistoryQuestion = (): AyuQuestion => ({
      linkId: 'patHist',
      type: 'choice',
      text: 'Do you have a history of any of the following?*',
      repeats: true,
      extension: [
        {
          url: 'urn:intelehealth:original-question-text',
          valueString: 'Do you have a history of any of the following?*',
        },
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/language',
          valueString: 'Medical history',
        },
      ],
      answerOption: [
        { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
        { valueCoding: { code: 'HTN', display: 'Hypertension' } },
      ],
    });

    const makeFamilyHistoryQuestion = (): AyuQuestion => ({
      linkId: 'famHist',
      type: 'choice',
      text: 'Do you have a family history of any of the following?*',
      repeats: true,
      extension: [
        {
          url: 'urn:intelehealth:original-question-text',
          valueString: 'Do you have a family history of any of the following?*',
        },
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/language',
          valueString: '%',
        },
      ],
      answerOption: [
        { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
        { valueCoding: { code: 'HTN', display: 'Hypertension' } },
      ],
    });

    it('should render patient history in labelValue format with useLabeledFormat', () => {
      const questions = [makePatientHistoryQuestion()];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: 'Diabetes',
      });
    });

    it('should render patient history with nested labeled values', () => {
      const questions: AyuQuestion[] = [
        {
          ...makePatientHistoryQuestion(),
          item: [
            {
              linkId: 'patHist.date',
              type: 'string',
              text: 'Since when?',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Since when?',
                },
              ],
              enableWhen: [
                {
                  question: 'patHist',
                  operator: '=',
                  answerCoding: { code: 'DIAB' },
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.date', '2020'],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: 'Diabetes – 2020',
      });
    });

    it('should render family history with percent label as subheading + labelValue items', () => {
      const questions = [makeFamilyHistoryQuestion()];
      const answers = new Map<string, AyuAnswerValue>([
        ['famHist', ['DIAB', 'HTN']],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      // Should have subheading with text (trailing * removed)
      expect(result[0].items[0]).toEqual({
        type: 'subheading',
        heading: 'Do you have a family history of any of the following?',
        values: [],
      });
      // Each condition as its own labelValue
      expect(result[0].items[1]).toEqual({
        type: 'labelValue',
        label: 'Diabetes',
        value: null,
      });
      expect(result[0].items[2]).toEqual({
        type: 'labelValue',
        label: 'Hypertension',
        value: null,
      });
    });

    it('should filter out negated codes in labeled format', () => {
      const questions = [makePatientHistoryQuestion()];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB', 'NO_ID_HTN']],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: 'Diabetes',
      });
    });

    it('should render family history with nested labeled values', () => {
      const questions: AyuQuestion[] = [
        {
          ...makeFamilyHistoryQuestion(),
          item: [
            {
              linkId: 'famHist.relation',
              type: 'choice',
              text: 'Relation',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Relation',
                },
              ],
              answerOption: [
                { valueCoding: { code: 'MOTHER', display: 'Mother' } },
              ],
              enableWhen: [
                {
                  question: 'famHist',
                  operator: '=',
                  answerCoding: { code: 'DIAB' },
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['famHist', ['DIAB']],
        ['famHist.relation', 'MOTHER'],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      expect(result[0].items[1]).toEqual({
        type: 'labelValue',
        label: 'Diabetes',
        value: 'Relation – Mother',
      });
    });
  });

  describe('single select with nested but no nested values', () => {
    it('should show display with empty string when nested children have no answers', () => {
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
      const answers = new Map<string, AyuAnswerValue>([['q1', 'CODE_A']]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A',
      });
    });
  });

  describe('getDisplay with language extension', () => {
    it('should use language extension value when not percent', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          answerOption: [
            {
              valueCoding: { code: 'CODE_A', display: 'Option A' },
              extension: [
                {
                  url: 'https://intelehealth.org/fhir/StructureDefinition/language',
                  valueString: 'Localized A',
                },
              ],
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([['q1', 'CODE_A']]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Localized A',
      });
    });

    it('should fall back to display when language extension is percent', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          answerOption: [
            {
              valueCoding: { code: 'CODE_A', display: 'Option A' },
              extension: [
                {
                  url: 'https://intelehealth.org/fhir/StructureDefinition/language',
                  valueString: '%',
                },
              ],
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([['q1', 'CODE_A']]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A',
      });
    });
  });

  describe('getExtensionLabel with language extension', () => {
    it('should use display extension when language is percent', () => {
      const questions: AyuQuestion[] = [
        makeQuestion({
          type: 'string',
          text: 'Original text',
          extension: [
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/language',
              valueString: '%',
            },
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/display',
              valueString: 'Display Label',
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'some answer'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Display Label',
        value: 'some answer',
      });
    });

    it('should use item.text when language is not percent', () => {
      const questions: AyuQuestion[] = [
        makeQuestion({
          type: 'string',
          text: 'Question Text',
          extension: [
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/language',
              valueString: 'Localized Label',
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'some answer'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Question Text',
        value: 'some answer',
      });
    });
  });

  describe('collectLabeledValues edge cases', () => {
    it('should handle nested array answers with child that has no answers', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Do you have a history of any of the following?*',
            },
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/language',
              valueString: 'Medical history',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
          item: [
            {
              linkId: 'patHist.child',
              type: 'choice',
              text: 'Sub question',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Sub question',
                },
              ],
              answerOption: [
                { valueCoding: { code: 'OPT1', display: 'Option 1' } },
              ],
              enableWhen: [
                {
                  question: 'patHist',
                  operator: '=',
                  answerCoding: { code: 'DIAB' },
                },
              ],
              item: [
                {
                  linkId: 'patHist.child.nested',
                  type: 'string',
                  text: 'Describe',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Describe',
                    },
                  ],
                  enableWhen: [
                    {
                      question: 'patHist.child',
                      operator: '=',
                      answerCoding: { code: 'OPT1' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.child', ['OPT1']],
        ['patHist.child.nested', 'details here'],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: expect.stringContaining('Diabetes'),
      });
    });

    it('should handle collectLabeledValues with non-string type showing label', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Do you have a history of any of the following?*',
            },
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/language',
              valueString: 'Medical history',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
          item: [
            {
              linkId: 'patHist.age',
              type: 'integer',
              text: 'Age at diagnosis',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Age at diagnosis',
                },
              ],
              enableWhen: [
                {
                  question: 'patHist',
                  operator: '=',
                  answerCoding: { code: 'DIAB' },
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.age', 45],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: 'Diabetes – Age at diagnosis – 45',
      });
    });

    it('should handle collectLabeledValues with string type (no label prefix)', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Do you have a history of any of the following?*',
            },
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/language',
              valueString: 'Medical history',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
          item: [
            {
              linkId: 'patHist.describe',
              type: 'string',
              text: 'Describe',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Describe',
                },
              ],
              enableWhen: [
                {
                  question: 'patHist',
                  operator: '=',
                  answerCoding: { code: 'DIAB' },
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.describe', 'Some description'],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: 'Diabetes – Some description',
      });
    });

    it('should process remaining children in collectLabeledValues', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Do you have a history of any of the following?*',
            },
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/language',
              valueString: 'Medical history',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
          item: [
            {
              linkId: 'patHist.child',
              type: 'string',
              text: 'Medication',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Medication',
                },
              ],
              enableWhen: [
                {
                  question: 'patHist',
                  operator: '=',
                  answerCoding: { code: 'DIAB' },
                },
              ],
              item: [
                {
                  linkId: 'patHist.child.extra',
                  type: 'integer',
                  text: 'Dosage',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Dosage',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.child', 'Metformin'],
        ['patHist.child.extra', 500],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: expect.stringContaining('Metformin'),
      });
    });
  });

  describe('formatAnswerByType edge cases', () => {
    it('should return null for non-string answer on string type', () => {
      const questions = [makeQuestion({ type: 'string' })];
      const answers = new Map<string, AyuAnswerValue>([['q1', 42]]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result).toEqual([]);
    });

    it('should return null for quantity with no value or dropdownValues', () => {
      const questions = [makeQuestion({ type: 'quantity' })];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', { someOtherProp: true } as unknown as AyuAnswerValue],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result).toEqual([]);
    });

    it('should return null for choice with non-string answer', () => {
      const questions = [makeChoiceQuestion()];
      const answers = new Map<string, AyuAnswerValue>([['q1', 42]]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result).toEqual([]);
    });

    it('should handle default type as string fallback', () => {
      const questions = [makeQuestion({ type: 'date' as AyuQuestion['type'] })];
      const answers = new Map<string, AyuAnswerValue>([['q1', '2024-01-01']]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Question 1',
        value: '2024-01-01',
      });
    });

    it('should return null for default type with non-string answer', () => {
      const questions = [makeQuestion({ type: 'date' as AyuQuestion['type'] })];
      const answers = new Map<string, AyuAnswerValue>([['q1', 42]]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result).toEqual([]);
    });
  });

  describe('non-strict associated symptoms (labeled format without useLabeledFormat)', () => {
    it('should use labeled format for patient history question even without useLabeledFormat option', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Do you have a history of any of the following?*',
            },
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/language',
              valueString: 'Medical history',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
      ]);
      const result = buildVisitSummary(questions, answers, 'History');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: 'Diabetes',
      });
    });
  });

  describe('collectNestedOwnValues edge cases', () => {
    it('should handle nested multi-select with child that has matching children with values', () => {
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
              linkId: 'assoc.severity',
              type: 'choice',
              text: 'Severity',
              repeats: true,
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Severity',
                },
              ],
              answerOption: [
                { valueCoding: { code: 'MILD', display: 'Mild' } },
                { valueCoding: { code: 'SEV', display: 'Severe' } },
              ],
              enableWhen: [
                {
                  question: 'assoc',
                  operator: '=',
                  answerCoding: { code: 'ID_1' },
                },
              ],
              item: [
                {
                  linkId: 'assoc.severity.detail',
                  type: 'string',
                  text: 'Detail',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Detail',
                    },
                  ],
                  enableWhen: [
                    {
                      question: 'assoc.severity',
                      operator: '=',
                      answerCoding: { code: 'SEV' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['assoc', ['ID_1']],
        ['assoc.severity', ['SEV']],
        ['assoc.severity.detail', 'Very painful'],
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
        expect(reports.values[0]).toContain('Very painful');
      }
    });

    it('should skip nested answer when it equals label', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          repeats: true,
          item: [
            {
              linkId: 'q1.nested',
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
      // answer equals the label text
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A']],
        ['q1.nested', 'Details'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A',
      });
    });

    it('should handle collectLabeledValues array answer with child but no child answers', () => {
      // To hit line 187: collectLabeledValues is called with a multi-select item
      // that has a matching child for a code, but that child has no answers → empty childParts
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Do you have a history of any of the following?*',
            },
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/language',
              valueString: 'Medical history',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
          item: [
            {
              // This nested child is a multi-select choice
              linkId: 'patHist.sub',
              type: 'choice',
              text: 'Sub symptoms',
              repeats: true,
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Sub symptoms',
                },
              ],
              answerOption: [
                { valueCoding: { code: 'S1', display: 'Symptom 1' } },
                { valueCoding: { code: 'S2', display: 'Symptom 2' } },
              ],
              enableWhen: [
                {
                  question: 'patHist',
                  operator: '=',
                  answerCoding: { code: 'DIAB' },
                },
              ],
              item: [
                {
                  // Grandchild matches S1 but has no answer → childParts empty → line 187
                  linkId: 'patHist.sub.detail',
                  type: 'string',
                  text: 'Detail',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Detail',
                    },
                  ],
                  enableWhen: [
                    {
                      question: 'patHist.sub',
                      operator: '=',
                      answerCoding: { code: 'S1' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      // patHist.sub has array answer ['S1', 'S2']
      // S1 has a matching grandchild but no answer → empty childParts (line 187)
      // S2 has no matching grandchild → else branch (line 190)
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.sub', ['S1', 'S2']],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: expect.stringContaining('Symptom 1'),
      });
    });

    it('should handle collectNestedOwnValues multi-select with matching child but no child values', () => {
      // Hits line 141: nestedItem is multi-select, matchingChild exists but has no answer
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          repeats: true,
          item: [
            {
              linkId: 'q1.nested',
              type: 'choice',
              text: 'Nested multi',
              repeats: true,
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Nested multi',
                },
              ],
              answerOption: [
                { valueCoding: { code: 'N1', display: 'Nested 1' } },
                { valueCoding: { code: 'N2', display: 'Nested 2' } },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'CODE_A' },
                },
              ],
              item: [
                {
                  linkId: 'q1.nested.grandchild',
                  type: 'string',
                  text: 'GC',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'GC',
                    },
                  ],
                  enableWhen: [
                    {
                      question: 'q1.nested',
                      operator: '=',
                      answerCoding: { code: 'N1' },
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ];
      // N1 has matching grandchild but grandchild has no answer → line 141
      // N2 has no matching grandchild → line 145
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A']],
        ['q1.nested', ['N1', 'N2']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A – Nested 1, Nested 2',
      });
    });

    it('should handle multi-select code with no display (skip it)', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          repeats: true,
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A', 'UNKNOWN']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A',
      });
    });

    it('should collect descendant values from deeply nested unprocessed children', () => {
      // Hits lines 108-111: collectDescendantValues finds an unprocessed child
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          repeats: true,
          item: [
            {
              linkId: 'q1.nested',
              type: 'choice',
              text: 'Nested',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Nested',
                },
              ],
              answerOption: [
                { valueCoding: { code: 'N1', display: 'Nested 1' } },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'CODE_A' },
                },
              ],
              // This child has its own children that are NOT gated by enableWhen
              item: [
                {
                  linkId: 'q1.nested.deep',
                  type: 'string',
                  text: 'Deep child',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Deep child',
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A']],
        ['q1.nested', 'N1'],
        ['q1.nested.deep', 'deep value'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: expect.stringContaining('deep value'),
      });
    });
  });
});
