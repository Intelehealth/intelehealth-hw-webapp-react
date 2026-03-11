import { describe, expect, it } from 'vitest';
import type { ModalSectionItem } from '../../../../components/modal/global-modal-context';
import { buildVisitSummary } from '../../../../modules/ayu/utils/visit-summary.util';
import type { AyuAnswerValue } from '../../../../modules/ayu-library/types/ayu.types';

/** Type-safe accessor for labelValue items in test assertions */
function getLabelValue(item: ModalSectionItem): string | number | null {
  if (item.type === 'labelValue') return item.value;
  throw new Error(`Expected labelValue item but got ${item.type}`);
}

describe('buildVisitSummary', () => {
  describe('Simple Types', () => {
    it('should return empty sections for empty questionnaire', () => {
      const result = buildVisitSummary([], new Map(), 'Visit reason');
      expect(result).toEqual([]);
    });

    it('should handle string type answers', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Symptom',
          type: 'string',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'What symptom?',
            },
          ],
        },
      ];
      const answers = new Map([['q1', 'Headache']]);

      const result = buildVisitSummary(items, answers, 'Chief Complaint');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Chief Complaint');
      expect(result[0].items).toEqual([
        { type: 'labelValue', label: 'What symptom?', value: 'Headache' },
      ]);
    });

    it('should handle integer type answers', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Age',
          type: 'integer',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Patient age',
            },
          ],
        },
      ];
      const answers = new Map([['q1', 42]]);

      const result = buildVisitSummary(items, answers, 'Info');

      expect(result[0].items).toEqual([
        { type: 'labelValue', label: 'Patient age', value: '42' },
      ]);
    });

    it('should skip items with no answer', () => {
      const items = [
        { linkId: 'q1', text: 'Unanswered', type: 'string' },
      ];
      const answers = new Map();

      const result = buildVisitSummary(items, answers, 'Section');
      expect(result).toEqual([]);
    });

    it('should skip items where answer equals label text', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'SameAsAnswer',
          type: 'string',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'SameAsAnswer',
            },
          ],
        },
      ];
      const answers = new Map([['q1', 'SameAsAnswer']]);

      const result = buildVisitSummary(items, answers, 'Section');
      expect(result).toEqual([]);
    });
  });

  describe('Quantity Type', () => {
    it('should format quantity with dropdownValues (duration)', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Duration',
          type: 'quantity',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Duration',
            },
          ],
        },
      ];
      const answers = new Map([
        ['q1', { dropdownValues: { number: '5', days: 'days' } }],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toEqual([
        { type: 'labelValue', label: 'Duration', value: '5 days' },
      ]);
    });

    it('should format quantity with value and unit', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Weight',
          type: 'quantity',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Weight',
            },
          ],
        },
      ];
      const answers = new Map([['q1', { value: 70, unit: 'kg' }]]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toEqual([
        { type: 'labelValue', label: 'Weight', value: '70 kg' },
      ]);
    });

    it('should handle quantity with only number in dropdownValues', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Duration',
          type: 'quantity',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Duration',
            },
          ],
        },
      ];
      const answers = new Map([
        ['q1', { dropdownValues: { number: '5', days: null } }],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toEqual([
        { type: 'labelValue', label: 'Duration', value: '5' },
      ]);
    });

    it('should return null for quantity object with no dropdownValues number and no value', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Weight',
          type: 'quantity',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Weight',
            },
          ],
        },
      ];
      const answers = new Map([['q1', { dropdownValues: { number: '', days: '' } }]]);

      const result = buildVisitSummary(items, answers, 'Section');
      expect(result).toEqual([]);
    });

    it('should format quantity value without unit', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Count',
          type: 'quantity',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Count',
            },
          ],
        },
      ];
      const answers = new Map([['q1', { value: 10 }]]);

      const result = buildVisitSummary(items, answers, 'Section');
      expect(result[0].items).toEqual([
        { type: 'labelValue', label: 'Count', value: '10' },
      ]);
    });
  });

  describe('Single Select Choice', () => {
    it('should display choice answer using display text', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Severity',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Severity',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'mild', display: 'Mild' } },
            { valueCoding: { code: 'severe', display: 'Severe' } },
          ],
        },
      ];
      const answers = new Map([['q1', 'mild']]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toEqual([
        { type: 'labelValue', label: 'Severity', value: 'Mild' },
      ]);
    });

    it('should handle single choice with nested children', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Type',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Type',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'typeA', display: 'Type A' } },
          ],
          item: [
            {
              linkId: 'nested1',
              text: 'Details',
              type: 'string',
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
                  answerCoding: { code: 'typeA' },
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map([
        ['q1', 'typeA'],
        ['nested1', 'Some details'],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toEqual([
        {
          type: 'labelValue',
          label: 'Type',
          value: 'Type A - Some details',
        },
      ]);
    });

    it('should show display only when nested items matched but have no values', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Type',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Type',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'typeA', display: 'Type A' } },
          ],
          item: [
            {
              linkId: 'nested1',
              text: 'Details',
              type: 'string',
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
                  answerCoding: { code: 'typeA' },
                },
              ],
            },
          ],
        },
      ];
      // Parent answered but nested item has no answer
      const answers = new Map([['q1', 'typeA']]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toEqual([
        { type: 'labelValue', label: 'Type', value: 'Type A' },
      ]);
    });

    it('should handle nested items with deep children and hasOptionItemMapping', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Main',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Main Q',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            {
              linkId: 'nested1',
              text: 'Nested Choice',
              type: 'choice',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Nested Choice',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'opt1' },
                },
              ],
              answerOption: [
                { valueCoding: { code: 'sub1', display: 'Sub 1' } },
              ],
              item: [
                {
                  linkId: 'deep1',
                  text: 'Deep Child',
                  type: 'string',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Deep Label',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map([
        ['q1', 'opt1'],
        ['nested1', 'sub1'],
        ['deep1', 'deep value'],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toHaveLength(1);
      // hasOptionItemMapping is true so deep child label is prepended
      expect(getLabelValue(result[0].items[0])).toContain('Deep Label');
      expect(getLabelValue(result[0].items[0])).toContain('deep value');
    });

    it('should handle nested items with deep children without hasOptionItemMapping', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Main',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Main Q',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            {
              linkId: 'nested1',
              text: 'Nested String',
              type: 'string',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Nested String',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'opt1' },
                },
              ],
              // No answerOption — so hasOptionItemMapping = false
              item: [
                {
                  linkId: 'deep1',
                  text: 'Deep',
                  type: 'string',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Deep Label',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map([
        ['q1', 'opt1'],
        ['nested1', 'Nested val'],
        ['deep1', 'Deep val'],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toHaveLength(1);
      // Without hasOptionItemMapping, deep value is pushed without label prefix
      expect(getLabelValue(result[0].items[0])).toContain('Deep val');
      expect(getLabelValue(result[0].items[0])).toContain('Nested val');
    });

    it('should handle deep children with formatAnswerByType returning null', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Main',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Main Q',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            {
              linkId: 'nested1',
              text: 'Nested',
              type: 'string',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Nested',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'opt1' },
                },
              ],
              item: [
                {
                  linkId: 'deep1',
                  text: 'Deep Quantity',
                  type: 'quantity',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Deep Quantity',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      // Deep child has object answer but formatAnswerByType returns null
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'opt1'],
        ['nested1', 'Some text'],
        ['deep1', { dropdownValues: { number: '', days: '' } }],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      // Nested text is included, deep null-formatted is skipped
      expect(result[0].items).toHaveLength(1);
      expect(getLabelValue(result[0].items[0])).toContain('Some text');
    });
  });

  describe('Multi Select Choice', () => {
    it('should display multi-select values joined by comma', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'fever', display: 'Fever' } },
            { valueCoding: { code: 'cough', display: 'Cough' } },
            { valueCoding: { code: 'fatigue', display: 'Fatigue' } },
          ],
        },
      ];
      const answers = new Map([['q1', ['fever', 'cough']]]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toEqual([
        { type: 'labelValue', label: 'Symptoms', value: 'Fever, Cough' },
      ]);
    });

    it('should handle multi-select with nested items via enableWhen', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'fever', display: 'Fever' } },
            { valueCoding: { code: 'cough', display: 'Cough' } },
          ],
          item: [
            {
              linkId: 'fever_detail',
              text: 'Fever Details',
              type: 'string',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Fever Details',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'fever' },
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['fever', 'cough']],
        ['fever_detail', 'High grade'],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toHaveLength(1);
      expect(getLabelValue(result[0].items[0])).toContain('Fever Details');
      expect(getLabelValue(result[0].items[0])).toContain('High grade');
      expect(getLabelValue(result[0].items[0])).toContain('Cough');
    });

    it('should handle multi-select nested item with deep children', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'fever', display: 'Fever' } },
          ],
          item: [
            {
              linkId: 'fever_nested',
              text: 'Fever Info',
              type: 'string',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Fever Info',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'fever' },
                },
              ],
              item: [
                {
                  linkId: 'fever_deep',
                  text: 'Grade',
                  type: 'string',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Grade',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', ['fever']],
        ['fever_nested', 'Details'],
        ['fever_deep', 'High'],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toHaveLength(1);
      expect(getLabelValue(result[0].items[0])).toContain('High');
    });

    it('should use nested label without values when nested has no own values', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'fever', display: 'Fever' } },
          ],
          item: [
            {
              linkId: 'fever_nested',
              text: 'Fever Info',
              type: 'string',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Fever Info',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'fever' },
                },
              ],
            },
          ],
        },
      ];
      // Nested item has no answer so nestedValues is empty
      const answers = new Map([['q1', ['fever']]]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toHaveLength(1);
      expect(getLabelValue(result[0].items[0])).toBe('Fever Info');
    });
  });

  describe('Associated Symptoms', () => {
    it('should separate reports and denies for associated symptoms', () => {
      const items = [
        {
          linkId: 'assoc',
          text: 'Associated symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Associated symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'ID_fever', display: 'Fever' } },
            { valueCoding: { code: 'ID_cough', display: 'Cough' } },
          ],
        },
      ];
      const answers = new Map([
        ['assoc', ['ID_fever', 'NO_ID_cough']],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      // Should have main section (empty) and associated section
      const assocSection = result.find(s => s.title === 'Associated symptoms');
      expect(assocSection).toBeDefined();
      expect(assocSection!.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'subheading',
            heading: 'Patient reports',
          }),
          expect.objectContaining({
            type: 'subheading',
            heading: 'Patient denies',
          }),
        ])
      );
    });

    it('should handle associated symptoms with only reports', () => {
      const items = [
        {
          linkId: 'assoc',
          text: 'Associated symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Associated symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'ID_fever', display: 'Fever' } },
          ],
        },
      ];
      const answers = new Map([['assoc', ['ID_fever']]]);

      const result = buildVisitSummary(items, answers, 'Section');

      const assocSection = result.find(s => s.title === 'Associated symptoms');
      expect(assocSection).toBeDefined();
      expect(assocSection!.items).toHaveLength(1);
      expect(assocSection!.items[0]).toEqual(
        expect.objectContaining({
          type: 'subheading',
          heading: 'Patient reports',
        })
      );
    });

    it('should append nested child answers to associated symptom display', () => {
      const items = [
        {
          linkId: 'assoc',
          text: 'Associated symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Associated symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'ID_fever', display: 'Fever' } },
          ],
          item: [
            {
              linkId: 'fever_detail',
              text: 'Fever Detail',
              type: 'string',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Fever Detail',
                },
              ],
              enableWhen: [
                {
                  question: 'assoc',
                  operator: '=',
                  answerCoding: { code: 'ID_fever' },
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['assoc', ['ID_fever']],
        ['fever_detail', 'High grade'],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      const assocSection = result.find(s => s.title === 'Associated symptoms');
      expect(assocSection).toBeDefined();
      const reportItem = assocSection!.items.find(
        i => i.type === 'subheading' && i.heading === 'Patient reports'
      );
      expect(reportItem).toBeDefined();
      if (reportItem?.type === 'subheading') {
        expect(reportItem.values[0]).toContain('Fever');
        expect(reportItem.values[0]).toContain('High grade');
      }
    });

    it('should handle associated symptoms nested children with deep children', () => {
      const items = [
        {
          linkId: 'assoc',
          text: 'Associated symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Associated symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'ID_fever', display: 'Fever' } },
          ],
          item: [
            {
              linkId: 'fever_detail',
              text: 'Fever Detail',
              type: 'string',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Fever Detail',
                },
              ],
              enableWhen: [
                {
                  question: 'assoc',
                  operator: '=',
                  answerCoding: { code: 'ID_fever' },
                },
              ],
              item: [
                {
                  linkId: 'deep_child',
                  text: 'Deep',
                  type: 'integer',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Deep',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['assoc', ['ID_fever']],
        ['fever_detail', 'Some detail'],
        ['deep_child', 3],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      const assocSection = result.find(s => s.title === 'Associated symptoms');
      expect(assocSection).toBeDefined();
      if (assocSection) {
        const reportItem = assocSection.items.find(
          i => i.type === 'subheading' && i.heading === 'Patient reports'
        );
        expect(reportItem).toBeDefined();
        if (reportItem?.type === 'subheading') {
          expect(reportItem.values[0]).toContain('Fever');
          expect(reportItem.values[0]).toContain('Some detail');
          expect(reportItem.values[0]).toContain('3');
        }
      }
    });

    it('should skip associated symptom codes with no matching display', () => {
      const items = [
        {
          linkId: 'assoc',
          text: 'Associated symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Associated symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'ID_fever', display: 'Fever' } },
          ],
        },
      ];
      // Answer code doesn't match any answerOption
      const answers = new Map([['assoc', ['ID_unknown']]]);

      const result = buildVisitSummary(items, answers, 'Section');
      expect(result).toEqual([]);
    });

    it('should handle non-array answer for associated symptoms', () => {
      const items = [
        {
          linkId: 'assoc',
          text: 'Associated symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Associated symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'ID_fever', display: 'Fever' } },
          ],
        },
      ];
      // Non-array answer for associated symptoms - skips the array processing
      const answers = new Map([['assoc', 'ID_fever']]);

      const result = buildVisitSummary(items, answers, 'Section');
      // Non-array answer is not processed as associated symptoms
      expect(result).toEqual([]);
    });
  });

  describe('Recursive Processing', () => {
    it('should process nested items recursively', () => {
      const items = [
        {
          linkId: 'parent',
          text: 'Parent',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Parent Q',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'yes', display: 'Yes' } },
          ],
          item: [
            {
              linkId: 'child',
              text: 'Child',
              type: 'string',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Child Q',
                },
              ],
            },
          ],
        },
      ];
      // Parent not answered, but child is answered
      const answers = new Map([['child', 'Child answer']]);

      const result = buildVisitSummary(items, answers, 'Section');

      // Child should be processed via recursive descent
      const allItems = result.flatMap(s => s.items);
      const childItem = allItems.find(
        i => i.type === 'labelValue' && i.label === 'Child Q'
      );
      expect(childItem).toBeDefined();
    });

    it('should not duplicate processed items', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Q1',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Question 1',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'a', display: 'A' } },
          ],
          item: [
            {
              linkId: 'nested',
              text: 'Nested',
              type: 'string',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Nested Q',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'a' },
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map([
        ['q1', 'a'],
        ['nested', 'nested answer'],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      // Nested item should appear as part of q1, not duplicated
      const allItems = result.flatMap(s => s.items);
      const labelValueItems = allItems.filter(i => i.type === 'labelValue');
      expect(labelValueItems).toHaveLength(1);
    });
  });

  describe('formatAnswerByType Edge Cases', () => {
    it('should handle default type with string answer', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Date',
          type: 'date',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Date Q',
            },
          ],
        },
      ];
      const answers = new Map([['q1', '2024-01-01']]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toEqual([
        { type: 'labelValue', label: 'Date Q', value: '2024-01-01' },
      ]);
    });

    it('should return null for default type with non-string answer', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Unknown',
          type: 'date',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Unknown Q',
            },
          ],
        },
      ];
      const answers = new Map([['q1', 12345]]);

      const result = buildVisitSummary(items, answers, 'Section');
      // integer answer with 'date' type hits default, non-string returns null
      expect(result).toEqual([]);
    });

    it('should use choice formatAnswerByType for nested single choice via collectNestedOwnValues', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Main',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Main Q',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            {
              linkId: 'nested_choice',
              text: 'Nested Choice',
              type: 'choice',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Nested Choice',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'opt1' },
                },
              ],
              answerOption: [
                { valueCoding: { code: 'sub1', display: 'Sub Option 1' } },
              ],
            },
          ],
        },
      ];
      const answers = new Map([
        ['q1', 'opt1'],
        ['nested_choice', 'sub1'],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toHaveLength(1);
      expect(getLabelValue(result[0].items[0])).toContain('Sub Option 1');
    });
  });

  describe('collectNestedOwnValues Edge Cases', () => {
    it('should skip multi-select display texts when nested item has its own children', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Main',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Main Q',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            {
              linkId: 'nested_multi',
              text: 'Nested Multi',
              type: 'choice',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Nested Multi',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'opt1' },
                },
              ],
              answerOption: [
                { valueCoding: { code: 'a', display: 'A' } },
                { valueCoding: { code: 'b', display: 'B' } },
              ],
              item: [
                {
                  linkId: 'deep_child',
                  text: 'Deep',
                  type: 'string',
                  extension: [
                    {
                      url: 'urn:intelehealth:original-question-text',
                      valueString: 'Deep Q',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'opt1'],
        ['nested_multi', ['a', 'b']],
        ['deep_child', 'deep value'],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      // collectNestedOwnValues returns [] for multi-select with .item children
      // But deep children get processed, so the value should contain deep value
      expect(result[0].items).toHaveLength(1);
      expect(getLabelValue(result[0].items[0])).toContain('deep value');
    });

    it('should resolve multi-select display texts when nested item has no children', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Main',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Main Q',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            {
              linkId: 'nested_multi',
              text: 'Nested Multi',
              type: 'choice',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Nested Multi',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'opt1' },
                },
              ],
              answerOption: [
                { valueCoding: { code: 'a', display: 'A' } },
                { valueCoding: { code: 'b', display: 'B' } },
              ],
              // No .item children — so collectNestedOwnValues returns display texts
            },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'opt1'],
        ['nested_multi', ['a', 'b']],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toHaveLength(1);
      expect(getLabelValue(result[0].items[0])).toContain('A');
      expect(getLabelValue(result[0].items[0])).toContain('B');
    });

    it('should skip nested answer when it equals the item label text', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Main',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Main Q',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'opt1', display: 'Option 1' } },
          ],
          item: [
            {
              linkId: 'nested1',
              text: 'Same Label',
              type: 'string',
              extension: [
                {
                  url: 'urn:intelehealth:original-question-text',
                  valueString: 'Same Label',
                },
              ],
              enableWhen: [
                {
                  question: 'q1',
                  operator: '=',
                  answerCoding: { code: 'opt1' },
                },
              ],
            },
          ],
        },
      ];
      // Nested answer equals its own label - should be skipped by collectNestedOwnValues
      const answers = new Map([
        ['q1', 'opt1'],
        ['nested1', 'Same Label'],
      ]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items).toHaveLength(1);
      expect(getLabelValue(result[0].items[0])).toBe('Option 1');
    });
  });

  describe('Extension Label Resolution', () => {
    it('should use extension label when available', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Internal Text',
          type: 'string',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Display Label',
            },
          ],
        },
      ];
      const answers = new Map([['q1', 'answer']]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items[0]).toEqual(
        expect.objectContaining({
          label: 'Display Label',
        })
      );
    });

    it('should fall back to text when no extension', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Fallback Text',
          type: 'string',
        },
      ];
      const answers = new Map([['q1', 'answer']]);

      const result = buildVisitSummary(items, answers, 'Section');

      expect(result[0].items[0]).toEqual(
        expect.objectContaining({
          label: 'Fallback Text',
        })
      );
    });
  });

  describe('Section Structure', () => {
    it('should create separate main and associated sections', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Q1',
          type: 'string',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Main Q',
            },
          ],
        },
        {
          linkId: 'assoc',
          text: 'Associated symptoms',
          type: 'choice',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Associated symptoms',
            },
          ],
          answerOption: [
            { valueCoding: { code: 'ID_s1', display: 'Symptom 1' } },
          ],
        },
      ];
      const answers = new Map<string, AyuAnswerValue>([
        ['q1', 'Answer'],
        ['assoc', ['ID_s1']],
      ]);

      const result = buildVisitSummary(items, answers, 'Fever');

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Fever');
      expect(result[1].title).toBe('Associated symptoms');
    });

    it('should use section title from parameter', () => {
      const items = [
        {
          linkId: 'q1',
          text: 'Q1',
          type: 'string',
          extension: [
            {
              url: 'urn:intelehealth:original-question-text',
              valueString: 'Q1',
            },
          ],
        },
      ];
      const answers = new Map([['q1', 'Answer']]);

      const result = buildVisitSummary(items, answers, 'Custom Title');

      expect(result[0].title).toBe('Custom Title');
    });
  });
});
