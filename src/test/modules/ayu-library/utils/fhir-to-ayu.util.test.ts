import { describe, expect, it } from 'vitest';
import {
  matchesDemographics,
  normalizePatientGenderCode,
  normalizeType,
  parsePatientAgeYears,
  questionnaireMatchesDemographics,
  transformFhirToAyu,
  resolveLabel,
} from '../../../../modules/ayu-library/utils/fhir-to-ayu.util';
import {
  EXT_URL_AGE_MAX as EXT_AGE_MAX,
  EXT_URL_AGE_MIN as EXT_AGE_MIN,
  EXT_URL_GENDER as EXT_GENDER,
} from '../../../../modules/ayu-library/utils/constants';
import type { AyuQuestion } from '../../../../modules/ayu-library/types/ayu.types';
import type { FhirQuestionnaire } from '../../../../modules/ayu-library/types/fhir-raw.types';

describe('fhir-to-ayu.util', () => {
  describe('normalizeType', () => {
    describe('Valid Types', () => {
      it('should accept group type', () => {
        expect(normalizeType('group')).toBe('group');
      });

      it('should accept display type', () => {
        expect(normalizeType('display')).toBe('display');
      });

      it('should accept string type', () => {
        expect(normalizeType('string')).toBe('string');
      });

      it('should accept integer type', () => {
        expect(normalizeType('integer')).toBe('integer');
      });

      it('should accept decimal type', () => {
        expect(normalizeType('decimal')).toBe('decimal');
      });

      it('should accept date type', () => {
        expect(normalizeType('date')).toBe('date');
      });

      it('should accept choice type', () => {
        expect(normalizeType('choice')).toBe('choice');
      });

      it('should accept quantity type', () => {
        expect(normalizeType('quantity')).toBe('quantity');
      });

      it('should return correct type for all valid types', () => {
        const validTypes = ['group', 'display', 'string', 'integer', 'decimal', 'date', 'choice', 'quantity'];
        validTypes.forEach(type => {
          expect(normalizeType(type)).toBe(type);
        });
      });
    });

    describe('Invalid Types', () => {
      it('should throw error for unsupported type', () => {
        expect(() => normalizeType('unsupported')).toThrow('Unsupported FHIR item type: unsupported');
      });

      it('should throw error for boolean type', () => {
        expect(() => normalizeType('boolean')).toThrow('Unsupported FHIR item type: boolean');
      });

      it('should throw error for text type', () => {
        expect(() => normalizeType('text')).toThrow('Unsupported FHIR item type: text');
      });

      it('should throw error for url type', () => {
        expect(() => normalizeType('url')).toThrow('Unsupported FHIR item type: url');
      });

      it('should throw error for empty string', () => {
        expect(() => normalizeType('')).toThrow('Unsupported FHIR item type: ');
      });

      it('should throw error for numeric string', () => {
        expect(() => normalizeType('123')).toThrow('Unsupported FHIR item type: 123');
      });

      it('should be case-sensitive', () => {
        expect(() => normalizeType('STRING')).toThrow('Unsupported FHIR item type: STRING');
        expect(() => normalizeType('Group')).toThrow('Unsupported FHIR item type: Group');
      });
    });

    describe('Edge Cases', () => {
      it('should handle whitespace in type name', () => {
        expect(() => normalizeType(' string ')).toThrow('Unsupported FHIR item type:  string ');
      });

      it('should handle special characters', () => {
        expect(() => normalizeType('string!')).toThrow('Unsupported FHIR item type: string!');
      });
    });
  });

  describe('transformFhirToAyu', () => {
    describe('Basic Transformation', () => {
      it('should transform single root item (wrapped in root group)', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              text: 'Question 1',
              type: 'string',
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result).not.toBeNull();
        // Single root items are now also wrapped in a root group
        expect(result?.linkId).toBe('root');
        expect(result?.type).toBe('group');
        expect(result?.item).toHaveLength(1);
        expect(result?.item?.[0].linkId).toBe('q1');
        expect(result?.item?.[0].text).toBe('Question 1');
        expect(result?.item?.[0].type).toBe('string');
      });

      it('should transform with all properties', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              text: 'Question 1',
              type: 'string',
              required: true,
              readOnly: false,
              repeats: false,
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result).not.toBeNull();
        const child = result?.item?.[0];
        expect(child?.required).toBe(true);
        expect(child?.readOnly).toBe(false);
        expect(child?.repeats).toBe(false);
      });

      it('should preserve answerOption', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              text: 'Select one',
              type: 'choice',
              answerOption: [
                { valueString: 'Option 1' },
                { valueString: 'Option 2' },
              ],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        const child = result?.item?.[0];
        expect(child?.answerOption).toHaveLength(2);
        expect(child?.answerOption?.[0].valueString).toBe('Option 1');
      });

      it('should preserve extension data', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              text: 'Question',
              type: 'string',
              extension: [{ url: 'test', valueString: 'test-value' }],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        const child = result?.item?.[0];
        expect(child?.extension).toHaveLength(1);
        expect(child?.extension?.[0].url).toBe('test');
      });
    });

    describe('Multiple Root Items', () => {
      it('should wrap multiple root items in a group', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            { linkId: 'q1', text: 'Question 1', type: 'string' },
            { linkId: 'q2', text: 'Question 2', type: 'integer' },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result).not.toBeNull();
        expect(result?.linkId).toBe('root');
        expect(result?.type).toBe('group');
        expect(result?.item).toHaveLength(2);
      });

      it('should set title as group text', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          title: 'My Questionnaire Title',
          item: [
            { linkId: 'q1', text: 'Q1', type: 'string' },
            { linkId: 'q2', text: 'Q2', type: 'string' },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result?.text).toBe('My Questionnaire Title');
      });

      it('should set undefined group text when title is not provided', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            { linkId: 'q1', text: 'Q1', type: 'string' },
            { linkId: 'q2', text: 'Q2', type: 'string' },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result?.text).toBeUndefined();
      });

      it('should transform all items in multiple root scenario', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            { linkId: 'q1', text: 'Q1', type: 'string' },
            { linkId: 'q2', text: 'Q2', type: 'integer' },
            { linkId: 'q3', text: 'Q3', type: 'date' },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result?.item).toHaveLength(3);
        expect(result?.item?.[0].linkId).toBe('q1');
        expect(result?.item?.[1].linkId).toBe('q2');
        expect(result?.item?.[2].linkId).toBe('q3');
      });
    });

    describe('Nested Items', () => {
      it('should transform nested group items', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'group1',
              text: 'Group 1',
              type: 'group',
              item: [
                { linkId: 'q1', text: 'Question 1', type: 'string' },
                { linkId: 'q2', text: 'Question 2', type: 'integer' },
              ],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        // Root wrapper group
        expect(result?.type).toBe('group');
        expect(result?.linkId).toBe('root');
        // Inner group
        const innerGroup = result?.item?.[0];
        expect(innerGroup?.type).toBe('group');
        expect(innerGroup?.item).toHaveLength(2);
        expect(innerGroup?.item?.[0].linkId).toBe('q1');
        expect(innerGroup?.item?.[1].linkId).toBe('q2');
      });

      it('should handle deeply nested structures', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'group1',
              type: 'group',
              text: 'Level 1',
              item: [
                {
                  linkId: 'group2',
                  type: 'group',
                  text: 'Level 2',
                  item: [
                    { linkId: 'q1', text: 'Deep Question', type: 'string' },
                  ],
                },
              ],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result?.item?.[0].item?.[0].item?.[0].linkId).toBe('q1');
      });

      it('should transform all nested items recursively', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'root-item',
              type: 'group',
              item: [
                { linkId: 'q1', type: 'string' },
                {
                  linkId: 'nested',
                  type: 'group',
                  item: [{ linkId: 'q2', type: 'integer' }],
                },
              ],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        const innerGroup = result?.item?.[0];
        expect(innerGroup?.item).toHaveLength(2);
        expect(innerGroup?.item?.[1].item).toHaveLength(1);
      });
    });

    describe('EnableWhen Conditions', () => {
      it('should normalize enableWhen with = operator', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              type: 'string',
              enableWhen: [
                {
                  question: 'q0',
                  operator: '=',
                  answerString: 'yes',
                },
              ],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        const child = result?.item?.[0];
        expect(child?.enableWhen).toHaveLength(1);
        expect(child?.enableWhen?.[0].operator).toBe('=');
        expect(child?.enableWhen?.[0].answerString).toBe('yes');
      });

      it('should normalize enableWhen with != operator', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              type: 'string',
              enableWhen: [
                {
                  question: 'q0',
                  operator: '!=',
                  answerString: 'no',
                },
              ],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result?.item?.[0]?.enableWhen?.[0].operator).toBe('!=');
      });

      it('should normalize enableWhen with exists operator', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              type: 'string',
              enableWhen: [
                {
                  question: 'q0',
                  operator: 'exists',
                  answerBoolean: true,
                },
              ],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        const child = result?.item?.[0];
        expect(child?.enableWhen?.[0].operator).toBe('exists');
        expect(child?.enableWhen?.[0].answerBoolean).toBe(true);
      });

      it('should throw error for unsupported operator', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              type: 'string',
              enableWhen: [
                {
                  question: 'q0',
                  operator: '>' as any,
                  answerString: 'test',
                },
              ],
            },
          ],
        };

        expect(() => transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire)).toThrow(
          'Unsupported enableWhen operator: >'
        );
      });

      it('should handle multiple enableWhen conditions', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              type: 'string',
              enableWhen: [
                { question: 'q0', operator: '=', answerString: 'yes' },
                { question: 'q2', operator: '!=', answerString: 'no' },
              ],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result?.item?.[0]?.enableWhen).toHaveLength(2);
      });

      it('should handle undefined enableWhen', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              type: 'string',
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result?.item?.[0]?.enableWhen).toBeUndefined();
      });

      it('should preserve answerCoding in enableWhen', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              type: 'string',
              enableWhen: [
                {
                  question: 'q0',
                  operator: '=',
                  answerCoding: { system: 'test', code: 'code1', display: 'Display' },
                },
              ],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result?.item?.[0]?.enableWhen?.[0].answerCoding).toEqual({
          system: 'test',
          code: 'code1',
          display: 'Display',
        });
      });
    });

    describe('Empty and Null Cases', () => {
      it('should return null for empty item array', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result).toBeNull();
      });

      it('should return null for undefined items', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result).toBeNull();
      });

      it('should handle empty nested items', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'group1',
              type: 'group',
              item: [],
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        expect(result?.item?.[0]?.item).toEqual([]);
      });
    });

    describe('Special Properties', () => {
      it('should preserve _text property', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'q1',
              type: 'string',
              _text: { extension: [{ url: 'test', valueString: 'value' }] },
            },
          ],
        };

        const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);

        const child = result?.item?.[0];
        expect(child?._text).toBeDefined();
        expect(child?._text?.extension).toHaveLength(1);
      });

      it('should handle all question types', () => {
        const types = ['group', 'display', 'string', 'integer', 'decimal', 'date', 'choice', 'quantity'];

        types.forEach((type, index) => {
          const questionnaire = {
            resourceType: 'Questionnaire',
            item: [{ linkId: `q${index}`, type: type }],
          };

          const result = transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire);
          // Single items are wrapped in root group
          expect(result?.item?.[0]?.type).toBe(type);
        });
      });
    });

    describe('Error Handling', () => {
      it('should throw error for invalid type in single root', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [{ linkId: 'q1', type: 'invalid' as any }],
        };

        expect(() => transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire)).toThrow(
          'Unsupported FHIR item type: invalid'
        );
      });

      it('should throw error for invalid type in multiple roots', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            { linkId: 'q1', type: 'string' },
            { linkId: 'q2', type: 'invalid' as any },
          ],
        };

        expect(() => transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire)).toThrow(
          'Unsupported FHIR item type: invalid'
        );
      });

      it('should throw error for invalid type in nested items', () => {
        const questionnaire = {
          resourceType: 'Questionnaire',
          item: [
            {
              linkId: 'group',
              type: 'group',
              item: [{ linkId: 'q1', type: 'invalid' as any }],
            },
          ],
        };

        expect(() => transformFhirToAyu(questionnaire as unknown as FhirQuestionnaire)).toThrow(
          'Unsupported FHIR item type: invalid'
        );
      });
    });
  });

  describe('resolveLabel', () => {
    describe('Direct Question Text', () => {
      it('should return question text when available', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          text: 'Question Text',
          type: 'string',
        };

        const label = resolveLabel(question);

        expect(label).toBe('Question Text');
      });

      it('should prioritize question text over other sources', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          text: 'Question Text',
          type: 'string',
        };
        const parent: AyuQuestion = {
          linkId: 'parent',
          text: 'Parent Text',
          type: 'group',
        };
        const previousSibling: AyuQuestion = {
          linkId: 'prev',
          text: 'Previous Text',
          type: 'display',
        };

        const label = resolveLabel(question, parent, previousSibling);

        expect(label).toBe('Question Text');
      });

      it('should handle empty string text', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          text: '',
          type: 'string',
        };

        const label = resolveLabel(question);

        expect(label).toBe('');
      });

      it('falls back to question.text when extension list has no display-text entry', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          text: 'Fallback Text',
          type: 'string',
          extension: [
            { url: 'https://example.com/other-extension', valueString: 'ignored' },
          ],
        };

        expect(resolveLabel(question)).toBe('Fallback Text');
      });

      it('returns the display-text extension valueString when present', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          text: 'Raw Text',
          type: 'string',
          extension: [
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/display',
              valueString: 'Display Override',
            },
          ],
        };

        expect(resolveLabel(question)).toBe('Display Override');
      });

      it('falls back to question.text when display-text extension has no valueString', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          text: 'Fallback Text',
          type: 'string',
          extension: [
            {
              url: 'https://intelehealth.org/fhir/StructureDefinition/display',
            },
          ],
        };

        expect(resolveLabel(question)).toBe('Fallback Text');
      });
    });

    describe('Previous Display Sibling', () => {
      it('should return question text when previous display sibling has extension', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          text: 'Question Text',
          type: 'string',
        };
        const previousSibling: AyuQuestion = {
          linkId: 'prev',
          text: 'Display Text',
          type: 'display',
          extension: [{ url: 'some-ext', valueString: 'ext-val' }],
        };

        const label = resolveLabel(question, undefined, previousSibling);

        // getLabel(question) is called, returns question.text since no display ext on question
        expect(label).toBe('Question Text');
      });

      it('should not use previous sibling if not display type', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'string',
        };
        const previousSibling: AyuQuestion = {
          linkId: 'prev',
          text: 'String Text',
          type: 'string',
        };

        const label = resolveLabel(question, undefined, previousSibling);

        expect(label).toBeUndefined();
      });

      it('should not use previous sibling if it has no extension', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'string',
        };
        const previousSibling: AyuQuestion = {
          linkId: 'prev',
          text: 'Display Text',
          type: 'display',
        };

        const label = resolveLabel(question, undefined, previousSibling);

        expect(label).toBeUndefined();
      });

      it('should prioritize previous display over parent when both have extensions', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          text: 'Question Text',
          type: 'string',
        };
        const parent: AyuQuestion = {
          linkId: 'parent',
          text: 'Parent Text',
          type: 'group',
          extension: [{ url: 'ext', valueString: 'val' }],
        };
        const previousSibling: AyuQuestion = {
          linkId: 'prev',
          text: 'Display Text',
          type: 'display',
          extension: [{ url: 'ext', valueString: 'val' }],
        };

        const label = resolveLabel(question, parent, previousSibling);

        // getLabel(question) returns question.text
        expect(label).toBe('Question Text');
      });
    });

    describe('Parent Group Text', () => {
      it('should return question text via getLabel when parent group has extension', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          text: 'My Question',
          type: 'string',
        };
        const parent: AyuQuestion = {
          linkId: 'parent',
          text: 'Parent Group',
          type: 'group',
          extension: [{ url: 'ext', valueString: 'val' }],
        };

        const label = resolveLabel(question, parent);

        expect(label).toBe('My Question');
      });

      it('should not use parent if not group type', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'string',
        };
        const parent: AyuQuestion = {
          linkId: 'parent',
          text: 'Parent Text',
          type: 'string',
        };

        const label = resolveLabel(question, parent);

        expect(label).toBeUndefined();
      });

      it('should not use parent if it has no extension', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'string',
        };
        const parent: AyuQuestion = {
          linkId: 'parent',
          text: 'Parent Group',
          type: 'group',
        };

        const label = resolveLabel(question, parent);

        expect(label).toBeUndefined();
      });
    });

    describe('No Label Available', () => {
      it('should return undefined when no label sources available', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'string',
        };

        const label = resolveLabel(question);

        expect(label).toBeUndefined();
      });

      it('should return undefined with undefined parent and sibling', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'string',
        };

        const label = resolveLabel(question, undefined, undefined);

        expect(label).toBeUndefined();
      });

      it('should return undefined with non-matching parent and sibling types', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'string',
        };
        const parent: AyuQuestion = {
          linkId: 'parent',
          text: 'Parent',
          type: 'string',
        };
        const previousSibling: AyuQuestion = {
          linkId: 'prev',
          text: 'Previous',
          type: 'string',
        };

        const label = resolveLabel(question, parent, previousSibling);

        expect(label).toBeUndefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle question with only linkId', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'string',
        };

        const label = resolveLabel(question);

        expect(label).toBeUndefined();
      });

      it('should handle complex nested scenario with parent extension', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          text: 'Integer Q',
          type: 'integer',
        };
        const parent: AyuQuestion = {
          linkId: 'group',
          text: 'Section Title',
          type: 'group',
          item: [],
          extension: [{ url: 'ext', valueString: 'val' }],
        };

        const label = resolveLabel(question, parent);

        // getLabel(question) returns question.text since question has no display ext
        expect(label).toBe('Integer Q');
      });

      it('should handle display sibling with empty text but no extension', () => {
        const question: AyuQuestion = {
          linkId: 'q1',
          type: 'string',
        };
        const previousSibling: AyuQuestion = {
          linkId: 'prev',
          text: '',
          type: 'display',
        };

        const label = resolveLabel(question, undefined, previousSibling);

        // No extension on sibling, falls through to question?.text which is undefined
        expect(label).toBeUndefined();
      });

      it('should handle all question types', () => {
        const types: Array<AyuQuestion['type']> = [
          'string',
          'integer',
          'decimal',
          'date',
          'choice',
          'display',
          'group',
          'quantity',
        ];

        types.forEach(type => {
          const question: AyuQuestion = {
            linkId: 'q1',
            text: `${type} question`,
            type,
          };

          const label = resolveLabel(question);
          expect(label).toBe(`${type} question`);
        });
      });
    });

    describe('Label Resolution Priority', () => {
      it('should follow correct priority order', () => {
        // Test 1: Question with extension (highest priority) - returns question's own label
        const q1: AyuQuestion = { linkId: 'q1', text: 'Q Text', type: 'string', extension: [{ url: 'ext', valueString: 'val' }] };
        const parent: AyuQuestion = { linkId: 'p', text: 'P Text', type: 'group', extension: [{ url: 'ext', valueString: 'val' }] };
        const sibling: AyuQuestion = { linkId: 's', text: 'S Text', type: 'display', extension: [{ url: 'ext', valueString: 'val' }] };

        expect(resolveLabel(q1, parent, sibling)).toBe('Q Text');

        // Test 2: Previous display with extension (second priority) - returns getLabel(question)
        const q2: AyuQuestion = { linkId: 'q2', text: 'Q2 Text', type: 'string' };
        expect(resolveLabel(q2, parent, sibling)).toBe('Q2 Text');

        // Test 3: Parent group with extension (third priority) - returns getLabel(question)
        const q3: AyuQuestion = { linkId: 'q3', text: 'Q3 Text', type: 'string' };
        expect(resolveLabel(q3, parent, undefined)).toBe('Q3 Text');

        // Test 4: None available - returns question?.text
        const q4: AyuQuestion = { linkId: 'q4', type: 'string' };
        expect(resolveLabel(q4)).toBeUndefined();
      });
    });
  });

  describe('parsePatientAgeYears', () => {
    it('returns null for nullish / empty', () => {
      expect(parsePatientAgeYears(null)).toBeNull();
      expect(parsePatientAgeYears(undefined)).toBeNull();
      expect(parsePatientAgeYears('')).toBeNull();
    });

    it('parses numeric strings', () => {
      expect(parsePatientAgeYears('34')).toBe(34);
      expect(parsePatientAgeYears('0')).toBe(0);
    });

    it('parses "N years" style strings', () => {
      expect(parsePatientAgeYears('30 years')).toBe(30);
      expect(parsePatientAgeYears('5 yr')).toBe(5);
    });

    it('computes age from ISO date of birth', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 25);
      const iso = dob.toISOString().slice(0, 10);
      expect(parsePatientAgeYears(iso)).toBe(25);
    });

    it('returns null for nonsense strings', () => {
      expect(parsePatientAgeYears('not-an-age')).toBeNull();
    });

    it('returns finite numbers as-is and null for non-finite numbers', () => {
      expect(parsePatientAgeYears(42)).toBe(42);
      expect(parsePatientAgeYears(NaN)).toBeNull();
      expect(parsePatientAgeYears(Infinity)).toBeNull();
    });

    it('returns null when the date-of-birth is in the future', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 5);
      const iso = future.toISOString().slice(0, 10);
      expect(parsePatientAgeYears(iso)).toBeNull();
    });

    it('decrements age when the birthday has not yet occurred this year', () => {
      const now = new Date();
      const dob = new Date(now);
      dob.setFullYear(now.getFullYear() - 25);
      dob.setMonth(now.getMonth() + 1);
      if (dob.getFullYear() !== now.getFullYear() - 25) {
        dob.setFullYear(now.getFullYear() - 25);
        dob.setMonth(now.getMonth() - 1);
        expect(parsePatientAgeYears(dob.toISOString().slice(0, 10))).toBe(25);
        return;
      }
      expect(parsePatientAgeYears(dob.toISOString().slice(0, 10))).toBe(24);
    });

    it('decrements age when same month but birthday is later this month', () => {
      const now = new Date();
      if (now.getDate() === 31) {
        expect(true).toBe(true);
        return;
      }
      const dob = new Date(now);
      dob.setFullYear(now.getFullYear() - 30);
      dob.setDate(now.getDate() + 1);
      expect(parsePatientAgeYears(dob.toISOString().slice(0, 10))).toBe(29);
    });

    it('returns null for whitespace-only strings', () => {
      expect(parsePatientAgeYears('   ')).toBeNull();
    });
  });

  describe('normalizePatientGenderCode', () => {
    it('maps female aliases to "0"', () => {
      expect(normalizePatientGenderCode('F')).toBe('0');
      expect(normalizePatientGenderCode('female')).toBe('0');
      expect(normalizePatientGenderCode('Female')).toBe('0');
      expect(normalizePatientGenderCode('0')).toBe('0');
    });

    it('maps male aliases to "1"', () => {
      expect(normalizePatientGenderCode('M')).toBe('1');
      expect(normalizePatientGenderCode('male')).toBe('1');
      expect(normalizePatientGenderCode('1')).toBe('1');
    });

    it('maps other aliases to "other"', () => {
      expect(normalizePatientGenderCode('O')).toBe('other');
      expect(normalizePatientGenderCode('Other')).toBe('other');
    });

    it('returns null when unknown', () => {
      expect(normalizePatientGenderCode('xyz')).toBeNull();
      expect(normalizePatientGenderCode(null)).toBeNull();
      expect(normalizePatientGenderCode(undefined)).toBeNull();
    });

    it('returns null for whitespace-only strings', () => {
      expect(normalizePatientGenderCode('   ')).toBeNull();
    });
  });

  describe('matchesDemographics', () => {
    it('keeps items with no extensions', () => {
      expect(matchesDemographics(undefined, { age: 30, gender: 'F' })).toBe(
        true
      );
      expect(matchesDemographics([], { age: 30, gender: 'F' })).toBe(true);
    });

    it('keeps items when demographics are missing', () => {
      expect(
        matchesDemographics([{ url: EXT_GENDER, valueString: '1' }], undefined)
      ).toBe(true);
    });

    it('filters by gender (female-only item vs male patient)', () => {
      const ext = [{ url: EXT_GENDER, valueString: '0' }];
      expect(matchesDemographics(ext, { gender: 'M' })).toBe(false);
      expect(matchesDemographics(ext, { gender: 'F' })).toBe(true);
    });

    it('enforces inclusive age-min/age-max range', () => {
      const ext = [
        { url: EXT_AGE_MIN, valueString: '14' },
        { url: EXT_AGE_MAX, valueString: '49' },
      ];
      expect(matchesDemographics(ext, { age: 13 })).toBe(false);
      expect(matchesDemographics(ext, { age: 14 })).toBe(true);
      expect(matchesDemographics(ext, { age: 49 })).toBe(true);
      expect(matchesDemographics(ext, { age: 50 })).toBe(false);
    });

    it('combines gender and age constraints (pregnancy-style question)', () => {
      const ext = [
        { url: EXT_GENDER, valueString: '0' },
        { url: EXT_AGE_MIN, valueString: '14' },
        { url: EXT_AGE_MAX, valueString: '49' },
      ];
      expect(matchesDemographics(ext, { age: 30, gender: 'F' })).toBe(true);
      expect(matchesDemographics(ext, { age: 30, gender: 'M' })).toBe(false);
      expect(matchesDemographics(ext, { age: 12, gender: 'F' })).toBe(false);
    });

    it('fails open for gender when patient gender is unknown', () => {
      const ext = [{ url: EXT_GENDER, valueString: '0' }];
      expect(matchesDemographics(ext, { gender: null })).toBe(true);
    });

    it('treats missing age-min as negative infinity (only age-max enforced)', () => {
      // age-min absent, age-max present → uses Number.NEGATIVE_INFINITY floor.
      const ext = [{ url: EXT_AGE_MAX, valueString: '10' }];
      expect(matchesDemographics(ext, { age: 0 })).toBe(true);
      expect(matchesDemographics(ext, { age: 10 })).toBe(true);
      expect(matchesDemographics(ext, { age: 11 })).toBe(false);
    });

    it('treats missing age-max as positive infinity (only age-min enforced)', () => {
      // age-min present, age-max absent → uses Number.POSITIVE_INFINITY ceiling.
      const ext = [{ url: EXT_AGE_MIN, valueString: '18' }];
      expect(matchesDemographics(ext, { age: 17 })).toBe(false);
      expect(matchesDemographics(ext, { age: 18 })).toBe(true);
      expect(matchesDemographics(ext, { age: 999 })).toBe(true);
    });
  });

  describe('questionnaireMatchesDemographics', () => {
    it('returns true for nullish questionnaires (nothing to check against)', () => {
      expect(questionnaireMatchesDemographics(null)).toBe(true);
      expect(questionnaireMatchesDemographics(undefined)).toBe(true);
    });

    it('honours the questionnaire top-level extensions', () => {
      const q: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        extension: [{ url: EXT_GENDER, valueString: '0' }],
        item: [],
      };
      expect(questionnaireMatchesDemographics(q, { gender: 'F' })).toBe(true);
      expect(questionnaireMatchesDemographics(q, { gender: 'M' })).toBe(false);
    });
  });

  describe('transformFhirToAyu with demographics', () => {
    const buildQuestionnaire = (): FhirQuestionnaire => ({
      resourceType: 'Questionnaire',
      item: [
        {
          linkId: 'general',
          type: 'string',
          text: 'General question',
        },
        {
          linkId: 'pregnancy',
          type: 'choice',
          text: 'Pregnancy-only question',
          extension: [
            { url: EXT_GENDER, valueString: '0' },
            { url: EXT_AGE_MIN, valueString: '14' },
            { url: EXT_AGE_MAX, valueString: '49' },
          ],
        },
        {
          linkId: 'prostate',
          type: 'choice',
          text: 'Male-only question',
          extension: [{ url: EXT_GENDER, valueString: '1' }],
        },
      ],
    });

    it('drops questions that do not match the patient', () => {
      const schema = transformFhirToAyu(buildQuestionnaire(), {
        age: 30,
        gender: 'M',
      });
      const linkIds = schema?.item?.map(q => q.linkId);
      expect(linkIds).toEqual(['general', 'prostate']);
    });

    it('keeps all questions when demographics are not provided', () => {
      const schema = transformFhirToAyu(buildQuestionnaire());
      expect(schema?.item?.map(q => q.linkId)).toEqual([
        'general',
        'pregnancy',
        'prostate',
      ]);
    });

    it('filters nested child items recursively', () => {
      const questionnaire: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        item: [
          {
            linkId: 'parent',
            type: 'group',
            item: [
              {
                linkId: 'female-child',
                type: 'string',
                extension: [{ url: EXT_GENDER, valueString: '0' }],
              },
              {
                linkId: 'any-child',
                type: 'string',
              },
            ],
          },
        ],
      };
      const schema = transformFhirToAyu(questionnaire, { gender: 'M' });
      const parent = schema?.item?.[0];
      expect(parent?.item?.map(q => q.linkId)).toEqual(['any-child']);
    });
  });
});
