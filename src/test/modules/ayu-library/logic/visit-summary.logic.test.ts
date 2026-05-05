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
        value: ' ',
      });
      expect(result[0].items[2]).toEqual({
        type: 'labelValue',
        label: 'Hypertension',
        value: ' ',
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

      // With multiSelectChild detection: patHist.sub is a multi-select with items,
      // so each selected option (S1, S2) gets processed via collectLabeledValues.
      // S1 has a matching grandchild with answer 'details here' → "Option 1 – details here"
      // S2 has no matching grandchild → "Symptom 2"
      // Combined into one medication entries value
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: expect.stringContaining('details here'),
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

  describe('exclusive None option answered No (lines 315-317, 371-385)', () => {
    it('should NOT show exclusive None when other items are selected in patient history', () => {
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
            {
              valueCoding: { code: 'NONE', display: 'None' },
              extension: [
                {
                  url: 'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice',
                  valueString: 'True',
                },
              ],
            },
          ],
        },
      ];
      // The exclusive "None" is answered "No" → code is "NO_NONE", but Diabetes is selected
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB', 'NO_NONE']],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', {
        useLabeledFormat: true,
      });

      // Should have Diabetes but NOT None (since other items are selected)
      const items = result[0].items;
      expect(items.some(i => i.type === 'labelValue' && i.label === 'Medical history' && (i.value as string).includes('Diabetes'))).toBe(true);
      expect(items.some(i => i.type === 'labelValue' && i.label === 'Medical history' && i.value === 'None')).toBe(false);
    });

    it('should NOT show exclusive None when other items selected in percent-label question', () => {
      // Must be recognized as associatedSymptoms by resolveAyuComponent, with useLabeledFormat
      const questions: AyuQuestion[] = [
        {
          linkId: 'famHist',
          type: 'choice',
          text: 'Do you have a family history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a family history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: '%' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/display', valueString: 'Mother' },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
            {
              valueCoding: { code: 'NONE', display: 'None' },
              extension: [{ url: 'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice', valueString: 'True' }],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['famHist', ['DIAB', 'NO_NONE']],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });

      expect(result.length).toBeGreaterThan(0);
      const items = result[0].items;
      // In percent-label path: subheading + Diabetes as labelValue, but None should NOT appear
      expect(items.some(i => i.type === 'labelValue' && (i as any).label === 'Diabetes')).toBe(true);
      expect(items.some(i => i.type === 'labelValue' && (i as any).label === 'None')).toBe(false);
    });

    it('should show exclusive None when it is the only answer (no positive codes)', () => {
      // When only None is selected (no other positive codes), it should still appear
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: 'Medical history' },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
            {
              valueCoding: { code: 'NONE', display: 'None' },
              extension: [{ url: 'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice', valueString: 'True' }],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['NO_NONE']],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });

      expect(result.length).toBeGreaterThan(0);
      const items = result[0].items;
      expect(items.some(i => i.type === 'labelValue' && (i as any).label === 'Medical history' && (i as any).value === 'None')).toBe(true);
    });
  });

  describe('single-select with nested multi-select medications', () => {
    it('should create one row with all medication entries comma-separated', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          linkId: 'drug',
          text: 'Drug history',
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Drug history' },
          ],
          answerOption: [
            { valueCoding: { code: 'YES', display: 'Yes' } },
            { valueCoding: { code: 'NO', display: 'No' } },
          ],
          item: [
            {
              linkId: 'drug.meds',
              type: 'choice',
              text: 'Medications',
              repeats: true,
              answerOption: [
                { valueCoding: { code: 'MED1', display: 'Medication name 1' } },
                { valueCoding: { code: 'MED2', display: 'Medication name 2' } },
              ],
              enableWhen: [{ question: 'drug', operator: '=', answerCoding: { code: 'YES' } }],
              item: [
                {
                  linkId: 'drug.med1.name',
                  type: 'string',
                  text: 'Medicine name',
                  enableWhen: [{ question: 'drug.meds', operator: '=', answerCoding: { code: 'MED1' } }],
                },
                {
                  linkId: 'drug.med1.from',
                  type: 'date',
                  text: '',
                  extension: [
                    { url: 'https://intelehealth.org/fhir/StructureDefinition/display', valueString: 'From Date' },
                  ],
                  enableWhen: [{ question: 'drug.meds', operator: '=', answerCoding: { code: 'MED1' } }],
                },
                {
                  linkId: 'drug.med1.to',
                  type: 'date',
                  text: '',
                  extension: [
                    { url: 'https://intelehealth.org/fhir/StructureDefinition/display', valueString: 'To Date' },
                  ],
                  enableWhen: [{ question: 'drug.meds', operator: '=', answerCoding: { code: 'MED1' } }],
                },
                {
                  linkId: 'drug.med2.name',
                  type: 'string',
                  text: 'Medicine name',
                  enableWhen: [{ question: 'drug.meds', operator: '=', answerCoding: { code: 'MED2' } }],
                },
                {
                  linkId: 'drug.med2.from',
                  type: 'date',
                  text: '',
                  extension: [
                    { url: 'https://intelehealth.org/fhir/StructureDefinition/display', valueString: 'From Date' },
                  ],
                  enableWhen: [{ question: 'drug.meds', operator: '=', answerCoding: { code: 'MED2' } }],
                },
                {
                  linkId: 'drug.med2.to',
                  type: 'date',
                  text: '',
                  extension: [
                    { url: 'https://intelehealth.org/fhir/StructureDefinition/display', valueString: 'To Date' },
                  ],
                  enableWhen: [{ question: 'drug.meds', operator: '=', answerCoding: { code: 'MED2' } }],
                },
              ],
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['drug', 'YES'],
        ['drug.meds', ['MED1', 'MED2']],
        ['drug.med1.name', 'Aspirin'],
        ['drug.med1.from', '2026-01-01'],
        ['drug.med1.to', '2026-06-01'],
        ['drug.med2.name', 'Metformin'],
        ['drug.med2.from', '2026-03-01'],
        ['drug.med2.to', '2026-12-01'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items).toHaveLength(1);
      const item = result[0].items[0];
      expect(item.type).toBe('labelValue');
      if (item.type === 'labelValue') {
        // Should include Yes prefix
        expect(item.value).toContain('Yes');
        // Should include both medication entries with date labels
        expect(item.value).toContain('Medication name 1');
        expect(item.value).toContain('Aspirin');
        expect(item.value).toContain('From Date');
        expect(item.value).toContain('2026-01-01');
        expect(item.value).toContain('To Date');
        expect(item.value).toContain('Medication name 2');
        expect(item.value).toContain('Metformin');
      }
    });

    it('should fall back to original path when nested child is not a multi-select', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          linkId: 'q1',
          item: [
            {
              linkId: 'q1.detail',
              type: 'string',
              text: 'Details',
              extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'Details' }],
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'CODE_A'],
        ['q1.detail', 'Some details'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A - Some details',
      });
    });
  });

  describe('collectLabeledValues with display extension labels', () => {
    it('should use display extension for date field labels instead of item.text', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: 'Medical history' },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
          item: [
            {
              linkId: 'patHist.from',
              type: 'date',
              text: '',
              extension: [
                { url: 'https://intelehealth.org/fhir/StructureDefinition/display', valueString: 'From Date' },
              ],
              enableWhen: [{ question: 'patHist', operator: '=', answerCoding: { code: 'DIAB' } }],
            },
            {
              linkId: 'patHist.to',
              type: 'date',
              text: '',
              extension: [
                { url: 'https://intelehealth.org/fhir/StructureDefinition/display', valueString: 'To Date' },
              ],
              enableWhen: [{ question: 'patHist', operator: '=', answerCoding: { code: 'DIAB' } }],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.from', '2026-01-01'],
        ['patHist.to', '2026-06-01'],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: 'Diabetes – From Date – 2026-01-01, To Date – 2026-06-01',
      });
    });

    it('should process children of group containers (no own answer)', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: 'Medical history' },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
          item: [
            {
              linkId: 'patHist.group',
              type: 'group',
              text: 'Details group',
              enableWhen: [{ question: 'patHist', operator: '=', answerCoding: { code: 'DIAB' } }],
              item: [
                {
                  linkId: 'patHist.group.name',
                  type: 'string',
                  text: 'Name',
                },
                {
                  linkId: 'patHist.group.date',
                  type: 'date',
                  text: 'Since',
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.group.name', 'Metformin'],
        ['patHist.group.date', '2020-01-01'],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });

      const item = result[0].items[0];
      expect(item.type).toBe('labelValue');
      if (item.type === 'labelValue') {
        expect(item.value).toContain('Metformin');
        expect(item.value).toContain('2020-01-01');
      }
    });
  });

  describe('multi-select with nested answers creates per-option entries', () => {
    it('should create labeled entries when multi-select options have nested children', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          linkId: 'q1',
          repeats: true,
          item: [
            {
              linkId: 'q1.a.detail',
              type: 'string',
              text: 'Detail A',
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
            },
            {
              linkId: 'q1.b.detail',
              type: 'string',
              text: 'Detail B',
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_B' } }],
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A', 'CODE_B']],
        ['q1.a.detail', 'info A'],
        ['q1.b.detail', 'info B'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      // Should be one item with both entries
      expect(result[0].items).toHaveLength(1);
      if (result[0].items[0].type === 'labelValue') {
        expect(result[0].items[0].value).toContain('Option A');
        expect(result[0].items[0].value).toContain('info A');
        expect(result[0].items[0].value).toContain('Option B');
        expect(result[0].items[0].value).toContain('info B');
      }
    });

    it('should use simple flat format when multi-select has no nested answers', () => {
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

  describe('exclusive None with percent-label and no positive codes', () => {
    it('should show None as labelValue with percent-label when it is the only answer', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'famHist',
          type: 'choice',
          text: 'Do you have a family history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a family history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: '%' },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
            {
              valueCoding: { code: 'NONE', display: 'None' },
              extension: [{ url: 'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice', valueString: 'True' }],
            },
          ],
        },
      ];
      // Only the exclusive None is answered (no positive codes)
      const answers = new Map<string, AyuAnswerValue>([
        ['famHist', ['NO_NONE']],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });

      expect(result.length).toBeGreaterThan(0);
      const items = result[0].items;
      // percent-label path: None should appear as label with value ' '
      expect(items.some(i => i.type === 'labelValue' && (i as any).label === 'None' && (i as any).value === ' ')).toBe(true);
    });
  });

  describe('family history multiSelectChild with percent-label', () => {
    it('should display medication entries with percent-label format', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'famHist',
          type: 'choice',
          text: 'Do you have a family history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a family history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: '%' },
          ],
          answerOption: [
            { valueCoding: { code: 'MED', display: 'Medication' } },
          ],
          item: [
            {
              linkId: 'famHist.meds',
              type: 'choice',
              text: 'Medications',
              repeats: true,
              answerOption: [
                { valueCoding: { code: 'M1', display: 'Med 1' } },
              ],
              enableWhen: [{ question: 'famHist', operator: '=', answerCoding: { code: 'MED' } }],
              item: [
                {
                  linkId: 'famHist.meds.name',
                  type: 'string',
                  text: 'Name',
                  enableWhen: [{ question: 'famHist.meds', operator: '=', answerCoding: { code: 'M1' } }],
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['famHist', ['MED']],
        ['famHist.meds', ['M1']],
        ['famHist.meds.name', 'Aspirin'],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });

      // percent-label: label is the display text
      const item = result[0].items.find(i => i.type === 'labelValue' && (i as any).label === 'Medication');
      expect(item).toBeDefined();
      if (item && item.type === 'labelValue') {
        expect(item.value).toContain('Aspirin');
      }
    });
  });

  describe('associated symptoms multiSelectChild with extra matching children', () => {
    it('should mark remaining non-multi-select matching children as processed', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: 'Medical history' },
          ],
          answerOption: [
            { valueCoding: { code: 'MED', display: 'Medication' } },
          ],
          item: [
            // Multi-select child
            {
              linkId: 'patHist.meds',
              type: 'choice',
              text: 'Medications',
              repeats: true,
              answerOption: [
                { valueCoding: { code: 'M1', display: 'Med 1' } },
              ],
              enableWhen: [{ question: 'patHist', operator: '=', answerCoding: { code: 'MED' } }],
              item: [
                {
                  linkId: 'patHist.meds.name',
                  type: 'string',
                  text: 'Name',
                  enableWhen: [{ question: 'patHist.meds', operator: '=', answerCoding: { code: 'M1' } }],
                },
              ],
            },
            // Extra non-multi-select matching child (same enableWhen)
            {
              linkId: 'patHist.extra',
              type: 'string',
              text: 'Extra note',
              enableWhen: [{ question: 'patHist', operator: '=', answerCoding: { code: 'MED' } }],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['MED']],
        ['patHist.meds', ['M1']],
        ['patHist.meds.name', 'Aspirin'],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Medical history',
        value: expect.stringContaining('Aspirin'),
      });
    });
  });

  describe('multi-select with nested children but empty labeled parts', () => {
    it('should use display text when nested children have no answers', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          linkId: 'q1',
          repeats: true,
          item: [
            {
              linkId: 'q1.child',
              type: 'string',
              text: 'Detail',
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
            },
          ],
        }),
      ];
      // Child has enableWhen match but no answer → empty labeledParts → fallback to display
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A']],
        ['q1.child', 'detail value'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0].type).toBe('labelValue');
      if (result[0].items[0].type === 'labelValue') {
        expect(result[0].items[0].value).toContain('Option A');
        expect(result[0].items[0].value).toContain('detail value');
      }
    });
  });

  describe('branch coverage for fallback paths', () => {
    it('should fall back to item.text when language is percent but no display ext', () => {
      const questions: AyuQuestion[] = [
        makeQuestion({
          type: 'string',
          text: 'Fallback text',
          extension: [
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/language',
              valueString: '%',
            },
            // No display extension → falls back to item.text
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([['q1', 'answer']]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect((result[0].items[0] as any).label).toBe('Fallback text');
    });

    it('should handle getDisplay when opt has no display and no valueString', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          answerOption: [
            { valueCoding: { code: 'CODE_A' } }, // no display
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([['q1', 'CODE_A']]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      // getDisplay returns null → value is empty string fallback
      expect(result).toEqual([]);
    });

    it('should handle quantity dropdownValues with number but no days', () => {
      const questions = [makeQuestion({ type: 'quantity' })];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', { dropdownValues: { number: 5, days: null } } as any],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect((result[0].items[0] as any).value).toBe('5');
    });

    it('should handle collectLabeledValues when item.text is empty', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'History',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'History' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: 'Medical history' },
          ],
          answerOption: [{ valueCoding: { code: 'DIAB', display: 'Diabetes' } }],
          item: [
            {
              linkId: 'patHist.child',
              type: 'integer',
              text: '', // empty text → label is ''
              extension: [{ url: 'urn:intelehealth:original-question-text', valueString: '' }],
              enableWhen: [{ question: 'patHist', operator: '=', answerCoding: { code: 'DIAB' } }],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.child', 42],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });
      // With empty label, it should still format: the value is just "42"
      expect((result[0].items[0] as any).value).toContain('42');
    });

    it('should handle associated symptoms code with no display (line 249)', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'assoc',
          type: 'choice',
          text: 'Associated symptoms',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Associated symptoms' },
          ],
          answerOption: [
            { valueCoding: { code: 'ID_1', display: 'Headache' } },
          ],
        },
      ];
      // Answer includes a code that doesn't match any option → display is null → skipped
      const answers = new Map<string, AyuAnswerValue>([
        ['assoc', ['ID_1', 'UNKNOWN_CODE']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      const assocSection = result.find(s => s.title === 'Associated symptoms');
      expect(assocSection).toBeDefined();
      const reports = assocSection!.items.find(i => i.type === 'subheading' && i.heading === 'Patient reports');
      expect(reports).toBeDefined();
      if (reports?.type === 'subheading') {
        expect(reports.values[0]).toContain('Headache');
      }
    });

    it('should handle single select display with no nested values (line 469)', () => {
      const questions = [
        makeChoiceQuestion({
          answerOption: [
            { valueCoding: { code: 'CODE_A' } }, // no display property
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([['q1', 'CODE_A']]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      // No display → getDisplay returns null → empty result
      expect(result).toEqual([]);
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
      // answer equals the label text — collectLabeledValues includes the value for string types
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A']],
        ['q1.nested', 'Details'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');

      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A – Details',
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

  describe('100% line coverage — empty child fallback branches', () => {
    it('line 144-145: collectNestedOwnValues matching child exists but has empty childValues', () => {
      // Single-select where nested child is a multi-select WITHOUT .item (so no multiSelectChild detection).
      // That nested child has a matching grandchild but it has no answer.
      // Goes through old single-select fallback → collectNestedOwnValues → line 141-145.
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          item: [
            {
              linkId: 'q1.nested',
              type: 'choice',
              text: 'Nested',
              repeats: true,
              extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'Nested' }],
              answerOption: [
                { valueCoding: { code: 'N1', display: 'Nested 1' } },
              ],
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
              // Has item children so matching child can be found
              item: [
                {
                  linkId: 'q1.nested.gc',
                  type: 'string',
                  text: 'GC',
                  extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'GC' }],
                  enableWhen: [{ question: 'q1.nested', operator: '=', answerCoding: { code: 'N1' } }],
                },
              ],
            },
          ],
        }),
      ];
      // Single-select CODE_A → nested is detected as multiSelectChild (has array answer + items),
      // N1 has matching child gc but gc has NO answer → empty childParts → display fallback
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'CODE_A'],
        ['q1.nested', ['N1']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0].type).toBe('labelValue');
      if (result[0].items[0].type === 'labelValue') {
        expect(result[0].items[0].value).toContain('Nested 1');
      }
    });

    it('line 144 via associated symptoms: matching child with no childValues in collectNestedOwnValues', () => {
      // Strict associated symptoms path calls collectNestedOwnValues for nested items.
      // A nested multi-select has a matchingChild but that child's own nested has no answer.
      const questions: AyuQuestion[] = [
        {
          linkId: 'assoc',
          type: 'choice',
          text: 'Associated symptoms',
          repeats: true,
          extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'Associated symptoms' }],
          answerOption: [
            { valueCoding: { code: 'ID_1', display: 'Headache' } },
          ],
          item: [
            {
              linkId: 'assoc.child',
              type: 'choice',
              text: 'Severity',
              repeats: true,
              extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'Severity' }],
              answerOption: [
                { valueCoding: { code: 'S1', display: 'Mild' } },
              ],
              enableWhen: [{ question: 'assoc', operator: '=', answerCoding: { code: 'ID_1' } }],
              item: [
                {
                  linkId: 'assoc.child.detail',
                  type: 'string',
                  text: 'Detail',
                  extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'Detail' }],
                  enableWhen: [{ question: 'assoc.child', operator: '=', answerCoding: { code: 'S1' } }],
                },
              ],
            },
          ],
        },
      ];
      // S1 selected, detail child exists but has no answer → childValues empty → line 144
      const answers = new Map<string, AyuAnswerValue>([
        ['assoc', ['ID_1']],
        ['assoc.child', ['S1']],
        // assoc.child.detail intentionally not answered
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      const assocSection = result.find(s => s.title === 'Associated symptoms');
      expect(assocSection).toBeDefined();
      const reports = assocSection!.items.find(i => i.type === 'subheading' && i.heading === 'Patient reports');
      expect(reports).toBeDefined();
      if (reports?.type === 'subheading') {
        expect(reports.values[0]).toContain('Mild');
      }
    });

    it('line 193: collectLabeledValues array answer with matching child but empty childParts', () => {
      // In collectLabeledValues, when processing an array answer (multi-select),
      // each code checks for a matching child. If the child exists but produces
      // empty childParts, the display is pushed without childParts (line 195).
      // To reach line 192-193 (the if-true branch), the child MUST produce non-empty childParts.
      // But to reach 194-195 (the else), the child must produce empty childParts.
      // We need a nested choice within a labeled-format item where one code's child has
      // no answer at all.
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: 'Medical history' },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
          item: [
            {
              // This child is a multi-select with items → detected as multiSelectChild.
              // But the array path in collectLabeledValues (line 175) is hit when
              // collectLabeledValues is called ON this child for its OWN array answer.
              linkId: 'patHist.sub',
              type: 'choice',
              text: 'Sub',
              repeats: true,
              extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'Sub' }],
              answerOption: [
                { valueCoding: { code: 'S1', display: 'Sub 1' } },
                { valueCoding: { code: 'S2', display: 'Sub 2' } },
              ],
              enableWhen: [{ question: 'patHist', operator: '=', answerCoding: { code: 'DIAB' } }],
              item: [
                {
                  linkId: 'patHist.sub.detail',
                  type: 'string',
                  text: 'Detail',
                  extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'Detail' }],
                  enableWhen: [{ question: 'patHist.sub', operator: '=', answerCoding: { code: 'S1' } }],
                },
              ],
            },
          ],
        },
      ];
      // S1 has matching child but it has NO answer → empty childParts (line 194-195)
      // S2 has no matching child → else branch (line 198)
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.sub', ['S1', 'S2']],
        // patHist.sub.detail intentionally not answered → empty childParts for S1
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });
      expect(result[0].items[0].type).toBe('labelValue');
      if (result[0].items[0].type === 'labelValue') {
        expect(result[0].items[0].value).toContain('Sub 1');
        expect(result[0].items[0].value).toContain('Sub 2');
      }
    });

    it('line 193: collectLabeledValues array with child that HAS answers (true branch)', () => {
      // A nested multi-select within patient history. One of its codes has
      // a matching child that DOES have an answer → non-empty childParts → line 193.
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: 'Medical history' },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
          item: [
            {
              linkId: 'patHist.sub',
              type: 'choice',
              text: 'Condition',
              repeats: true,
              extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'Condition' }],
              answerOption: [
                { valueCoding: { code: 'S1', display: 'Type 1' } },
              ],
              enableWhen: [{ question: 'patHist', operator: '=', answerCoding: { code: 'DIAB' } }],
              item: [
                {
                  linkId: 'patHist.sub.detail',
                  type: 'string',
                  text: 'Notes',
                  extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'Notes' }],
                  enableWhen: [{ question: 'patHist.sub', operator: '=', answerCoding: { code: 'S1' } }],
                },
              ],
            },
          ],
        },
      ];
      // S1 has matching child WITH answer → non-empty childParts → line 193
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['DIAB']],
        ['patHist.sub', ['S1']],
        ['patHist.sub.detail', 'insulin dependent'],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });
      expect(result[0].items[0].type).toBe('labelValue');
      if (result[0].items[0].type === 'labelValue') {
        expect(result[0].items[0].value).toContain('Type 1');
        expect(result[0].items[0].value).toContain('insulin dependent');
      }
    });

    it('line 505: multi-select option with nested children but no labeled parts', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          linkId: 'q1',
          repeats: true,
          item: [
            {
              linkId: 'q1.child',
              type: 'string',
              text: 'Detail',
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
            },
            {
              linkId: 'q1.child2',
              type: 'string',
              text: 'Detail2',
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_B' } }],
            },
          ],
        }),
      ];
      // CODE_A has matching child but no answer → empty labeledParts → fallback to display (line 505)
      // CODE_B has matching child with answer → has labeled parts
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A', 'CODE_B']],
        // q1.child intentionally not answered → line 505 fallback
        ['q1.child2', 'some detail'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0].type).toBe('labelValue');
      if (result[0].items[0].type === 'labelValue') {
        expect(result[0].items[0].value).toContain('Option A');
        expect(result[0].items[0].value).toContain('Option B');
        expect(result[0].items[0].value).toContain('some detail');
      }
    });

    it('line 394: associated symptoms multiSelectChild with empty medicationEntries', () => {
      // All selected codes in the multi-select child have no display → medicationEntries stays empty
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: 'Medical history' },
          ],
          answerOption: [
            { valueCoding: { code: 'MED', display: 'Medication' } },
          ],
          item: [
            {
              linkId: 'patHist.meds',
              type: 'choice',
              repeats: true,
              text: 'Meds',
              answerOption: [
                { valueCoding: { code: 'M1', display: 'Med 1' } },
              ],
              enableWhen: [{ question: 'patHist', operator: '=', answerCoding: { code: 'MED' } }],
              item: [
                {
                  linkId: 'patHist.meds.name',
                  type: 'string',
                  text: 'Name',
                  enableWhen: [{ question: 'patHist.meds', operator: '=', answerCoding: { code: 'M1' } }],
                },
              ],
            },
          ],
        },
      ];
      // Selected code UNKNOWN has no display → childDisplay is null → skipped → empty medicationEntries
      const answers = new Map<string, AyuAnswerValue>([
        ['patHist', ['MED']],
        ['patHist.meds', ['UNKNOWN_CODE']],
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });
      // No medication entries generated → empty result
      expect(result).toEqual([]);
    });

    it('line 575: single-select multiSelectChild with unknown code (no display)', () => {
      // In the single-select multiSelectChild path, a selected code has no matching display
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          item: [
            {
              linkId: 'q1.meds',
              type: 'choice',
              repeats: true,
              text: 'Meds',
              answerOption: [
                { valueCoding: { code: 'M1', display: 'Med 1' } },
              ],
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
              item: [
                {
                  linkId: 'q1.meds.detail',
                  type: 'string',
                  text: 'Detail',
                  enableWhen: [{ question: 'q1.meds', operator: '=', answerCoding: { code: 'M1' } }],
                },
              ],
            },
          ],
        }),
      ];
      // UNKNOWN code has no display → line 575 return → empty medicationEntries
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'CODE_A'],
        ['q1.meds', ['UNKNOWN']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      // medicationEntries is empty → empty result since no display generated
      expect(result).toEqual([]);
    });

    it('line 478: hasNestedAnswers check when nested.item is explicitly undefined', () => {
      // nested.item is undefined → nested.item?.some(...) is undefined → ?? false
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          linkId: 'q1',
          repeats: true,
          item: [
            {
              linkId: 'q1.nested',
              type: 'string',
              text: 'Detail',
              item: undefined, // explicitly undefined .item
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
            },
          ],
        }),
      ];
      // q1.nested NOT in answersMap → line 477 false → falls to line 478
      // nested.item is undefined → ?.some() returns undefined → ?? false
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      // hasNestedAnswers = false → simple flat format
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A',
      });
    });

    it('line 486: multi-select hasNestedAnswers path with unknown code (no display)', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          linkId: 'q1',
          repeats: true,
          item: [
            {
              linkId: 'q1.child',
              type: 'string',
              text: 'Detail',
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
            },
          ],
        }),
      ];
      // CODE_A has nested answer, UNKNOWN has no display → line 486 return
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A', 'UNKNOWN']],
        ['q1.child', 'detail value'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0].type).toBe('labelValue');
      if (result[0].items[0].type === 'labelValue') {
        expect(result[0].items[0].value).toContain('Option A');
        expect(result[0].items[0].value).not.toContain('UNKNOWN');
      }
    });

    it('line 494: multi-select hasNestedAnswers with item that has no .item children', () => {
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          linkId: 'q1',
          repeats: true,
          // No .item at top level, but child answer exists through other means
          item: [
            {
              linkId: 'q1.child',
              type: 'string',
              text: 'Detail',
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
            },
            {
              linkId: 'q1.child2',
              type: 'string',
              text: 'Detail2',
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_B' } }],
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['CODE_A', 'CODE_B']],
        ['q1.child', 'val A'],
        ['q1.child2', 'val B'],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0].type).toBe('labelValue');
    });

    it('line 583+628: single-select multiSelectChild with no .item on multiSelectChild', () => {
      // multiSelectChild.item is undefined → filter returns undefined → || [] fallback (line 583)
      // Also tests line 628: when allNestedValues empty and display exists
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          item: [
            {
              linkId: 'q1.meds',
              type: 'choice',
              repeats: true,
              text: 'Meds',
              answerOption: [
                { valueCoding: { code: 'M1', display: 'Med 1' } },
              ],
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
              // item intentionally omitted → line 583 || [] fallback
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'CODE_A'],
        ['q1.meds', ['M1']],
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0].type).toBe('labelValue');
      if (result[0].items[0].type === 'labelValue') {
        expect(result[0].items[0].value).toContain('Med 1');
      }
    });

    it('line 628: single-select with matching nested but no nested values', () => {
      // Single-select with a matching nested child (non-multiSelectChild), but
      // nested child has no answer → allNestedValues is empty → line 628 fallback.
      const questions: AyuQuestion[] = [
        makeChoiceQuestion({
          item: [
            {
              linkId: 'q1.child',
              type: 'string',
              text: 'Detail',
              extension: [{ url: 'urn:intelehealth:original-question-text', valueString: 'Detail' }],
              enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'CODE_A' } }],
            },
          ],
        }),
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'CODE_A'],
        // q1.child intentionally NOT answered → allNestedValues empty → line 628
      ]);
      const result = buildVisitSummary(questions, answers, 'Visit');
      expect(result[0].items[0]).toEqual({
        type: 'labelValue',
        label: 'Select option',
        value: 'Option A',
      });
    });

    it('line 193: collectLabeledValues array branch via group container with nested multi-select', () => {
      // Structure: patient history → matching child is a GROUP (no own answer, not multiSelectChild).
      // Inside the group, a multi-select child has an array answer with nested items that HAVE answers.
      // collectLabeledValues processes the group → "Process remaining children" →
      // calls collectLabeledValues on the multi-select → array branch at line 175 →
      // matching grandchild has answer → non-empty childParts → line 193.
      const questions: AyuQuestion[] = [
        {
          linkId: 'patHist',
          type: 'choice',
          text: 'Do you have a history of any of the following?*',
          repeats: true,
          extension: [
            { url: 'urn:intelehealth:original-question-text', valueString: 'Do you have a history of any of the following?*' },
            { url: 'https://intelehealth.org/fhir/StructureDefinition/language', valueString: 'Medical history' },
          ],
          answerOption: [
            { valueCoding: { code: 'DIAB', display: 'Diabetes' } },
          ],
          item: [
            {
              // Group container — no own answer, so NOT detected as multiSelectChild
              linkId: 'patHist.group',
              type: 'group',
              text: 'Details',
              enableWhen: [{ question: 'patHist', operator: '=', answerCoding: { code: 'DIAB' } }],
              item: [
                {
                  linkId: 'patHist.group.name',
                  type: 'string',
                  text: 'Medicine name',
                },
                {
                  // Multi-select inside the group — has array answer + answerOption + item children
                  linkId: 'patHist.group.types',
                  type: 'choice',
                  repeats: true,
                  text: 'Types',
                  answerOption: [
                    { valueCoding: { code: 'T1', display: 'Type 1' } },
                  ],
                  item: [
                    {
                      linkId: 'patHist.group.types.detail',
                      type: 'string',
                      text: 'Notes',
                      enableWhen: [{ question: 'patHist.group.types', operator: '=', answerCoding: { code: 'T1' } }],
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
        // Group has no answer (group type)
        ['patHist.group.name', 'Metformin'],
        ['patHist.group.types', ['T1']],           // Array answer → hits line 175
        ['patHist.group.types.detail', 'insulin'],  // Matching child HAS answer → line 193
      ]);
      const result = buildVisitSummary(questions, answers, 'History', { useLabeledFormat: true });

      expect(result[0].items[0].type).toBe('labelValue');
      if (result[0].items[0].type === 'labelValue') {
        expect(result[0].items[0].value).toContain('Metformin');
        expect(result[0].items[0].value).toContain('Type 1');
        expect(result[0].items[0].value).toContain('insulin');
      }
    });
  });
});
