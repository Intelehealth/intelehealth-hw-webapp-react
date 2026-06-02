import { describe, expect, it } from 'vitest';
import type { AyuJsonItem } from '../../../../modules/ayu-library/types/ayu-json.types';
import type { FhirQuestionnaire } from '../../../../modules/ayu-library/types/fhir-raw.types';
import {
  ASSOCIATED_SYMPTOMS_TEXT,
  EXT_URL_AGE_MAX,
  EXT_URL_AGE_MIN,
  EXT_URL_DISPLAY_TEXT,
  EXT_URL_GENDER,
  EXT_URL_IS_EXCLUSIVE_OPTION,
  GENDER_CODE_FEMALE,
} from '../../../../modules/ayu-library/utils/constants';
import { transformFhirToAyu } from '../../../../modules/ayu-library/utils/fhir-to-ayu.util';
import {
  groupAnswersByProtocol,
  mergeProtocols,
  MERGED_ASSOCIATED_SYMPTOMS_LINK_ID,
} from '../../../../modules/ayu-library/utils/merge-protocols.util';

const makeComplaint = (
  name: string,
  json: FhirQuestionnaire
): AyuJsonItem => ({
  id: 1,
  name: `${name}.json`,
  json,
  keyName: 'ayu',
  isActive: true,
});

describe('mergeProtocols', () => {
  describe('empty / single-protocol short-circuit', () => {
    it('returns null when no complaints are selected', () => {
      expect(mergeProtocols([])).toBeNull();
    });

    it('returns null when complaints list is undefined', () => {
      expect(
        mergeProtocols(undefined as unknown as AyuJsonItem[])
      ).toBeNull();
    });

    it('returns exactly transformFhirToAyu output for a single protocol', () => {
      const json: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'Vomiting',
        item: [
          { linkId: 'Q1', text: 'Onset', type: 'string' },
          { linkId: 'Q2', text: 'Severity', type: 'integer' },
        ],
      };
      const merged = mergeProtocols([makeComplaint('Vomiting', json)]);
      const baseline = transformFhirToAyu(json);
      expect(merged).toEqual(baseline);
      expect(merged?.item?.[0].linkId).toBe('Q1');
      expect(merged?.item?.[0].protocolCode).toBeUndefined();
    });

    it('returns null when the only protocol is filtered out by demographics', () => {
      const femaleOnly: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'Pregnancy',
        extension: [{ url: EXT_URL_GENDER, valueString: GENDER_CODE_FEMALE }],
        item: [{ linkId: 'Q1', text: 'Q1', type: 'string' }],
      };
      const merged = mergeProtocols(
        [makeComplaint('Pregnancy', femaleOnly)],
        { gender: 'male' }
      );
      expect(merged).toBeNull();
    });
  });

  describe('multi-protocol merge', () => {
    const protoA: FhirQuestionnaire = {
      resourceType: 'Questionnaire',
      title: 'Vomiting',
      item: [
        { linkId: 'Q1', text: 'Onset', type: 'string' },
        { linkId: 'Q2', text: 'Severity', type: 'integer' },
      ],
    };
    const protoB: FhirQuestionnaire = {
      resourceType: 'Questionnaire',
      title: 'Fever',
      item: [
        { linkId: 'Q1', text: 'Onset', type: 'string' },
        { linkId: 'Q3', text: 'Temperature', type: 'decimal' },
      ],
    };

    it('concatenates non-overlapping questions in protocol order with prefixed linkIds', () => {
      const merged = mergeProtocols([
        makeComplaint('Vomiting', protoA),
        makeComplaint('Headache', {
          resourceType: 'Questionnaire',
          title: 'Headache',
          item: [{ linkId: 'Q9', text: 'Throbbing?', type: 'choice' }],
        }),
      ]);
      const linkIds = merged?.item?.map(i => i.linkId);
      expect(linkIds).toEqual(['Vomiting:Q1', 'Vomiting:Q2', 'Headache:Q9']);
      expect(merged?.item?.[0].protocolCode).toBe('Vomiting');
      expect(merged?.item?.[2].protocolCode).toBe('Headache');
    });

    it('keeps duplicate main questions from later protocols (no main-question dedup)', () => {
      const merged = mergeProtocols([
        makeComplaint('Vomiting', protoA),
        makeComplaint('Fever', protoB),
      ]);
      const linkIds = merged?.item?.map(i => i.linkId);
      expect(linkIds).toEqual([
        'Vomiting:Q1',
        'Vomiting:Q2',
        'Fever:Q1',
        'Fever:Q3',
      ]);
    });

    it('keeps duplicate display-extension labels across protocols', () => {
      const a: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          {
            linkId: 'Q1',
            text: 'duration',
            type: 'string',
            extension: [
              { url: EXT_URL_DISPLAY_TEXT, valueString: 'Since when?' },
            ],
          },
        ],
      };
      const b: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [
          {
            linkId: 'Q9',
            text: 'how long',
            type: 'string',
            extension: [
              { url: EXT_URL_DISPLAY_TEXT, valueString: 'Since when?' },
            ],
          },
        ],
      };
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      expect(merged?.item?.map(i => i.linkId)).toEqual(['A:Q1', 'B:Q9']);
    });

    it('rewrites enableWhen references inside a protocol after prefixing', () => {
      const json: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          { linkId: 'parent', text: 'Parent', type: 'choice' },
          {
            linkId: 'child',
            text: 'Child',
            type: 'string',
            enableWhen: [
              { question: 'parent', operator: '=', answerString: 'yes' },
            ],
          },
        ],
      };
      const other: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [{ linkId: 'B1', text: 'B1 text', type: 'string' }],
      };
      const merged = mergeProtocols([
        makeComplaint('A', json),
        makeComplaint('B', other),
      ]);
      const child = merged?.item?.find(i => i.linkId === 'A:child');
      expect(child?.enableWhen?.[0].question).toBe('A:parent');
    });

    it('rewrites enableWhen on a nested child of the kept subtree', () => {
      const json: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          {
            linkId: 'outer',
            text: 'Outer',
            type: 'choice',
            item: [
              {
                linkId: 'inner',
                text: 'Inner',
                type: 'string',
                enableWhen: [
                  { question: 'outer', operator: '=', answerString: 'yes' },
                ],
              },
            ],
          },
          { linkId: 'extra', text: 'Extra', type: 'string' },
        ],
      };
      const other: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [{ linkId: 'B1', text: 'B1', type: 'string' }],
      };
      const merged = mergeProtocols([
        makeComplaint('A', json),
        makeComplaint('B', other),
      ]);
      const outer = merged?.item?.find(i => i.linkId === 'A:outer');
      const inner = outer?.item?.[0];
      expect(inner?.linkId).toBe('A:inner');
      expect(inner?.enableWhen?.[0].question).toBe('A:outer');
      expect(inner?.protocolCode).toBe('A');
    });

    it('skips a protocol that the questionnaire-level gender extension excludes (and short-circuits when only one survives)', () => {
      const femaleOnly: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'Pregnancy',
        extension: [{ url: EXT_URL_GENDER, valueString: GENDER_CODE_FEMALE }],
        item: [{ linkId: 'P1', text: 'Pregnancy Q1', type: 'string' }],
      };
      const generic: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'Fever',
        item: [{ linkId: 'F1', text: 'Fever Q1', type: 'string' }],
      };
      const merged = mergeProtocols(
        [makeComplaint('Pregnancy', femaleOnly), makeComplaint('Fever', generic)],
        { gender: 'male' }
      );
      expect(merged?.item?.map(i => i.linkId)).toEqual(['F1']);
      expect(merged?.item?.[0].protocolCode).toBeUndefined();
    });

    it('still prefixes when two protocols survive after a third is demographic-excluded', () => {
      const femaleOnly: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'Pregnancy',
        extension: [{ url: EXT_URL_GENDER, valueString: GENDER_CODE_FEMALE }],
        item: [{ linkId: 'P1', text: 'Pregnancy Q1', type: 'string' }],
      };
      const fever: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'Fever',
        item: [{ linkId: 'F1', text: 'Fever Q1', type: 'string' }],
      };
      const cough: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'Cough',
        item: [{ linkId: 'C1', text: 'Cough Q1', type: 'string' }],
      };
      const merged = mergeProtocols(
        [
          makeComplaint('Pregnancy', femaleOnly),
          makeComplaint('Fever', fever),
          makeComplaint('Cough', cough),
        ],
        { gender: 'male' }
      );
      expect(merged?.item?.map(i => i.linkId)).toEqual(['Fever:F1', 'Cough:C1']);
    });

    it('drops a per-item question excluded by age while keeping its siblings', () => {
      const json: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          {
            linkId: 'kid',
            text: 'Kid only',
            type: 'string',
            extension: [{ url: EXT_URL_AGE_MAX, valueString: '12' }],
          },
          { linkId: 'all', text: 'All ages', type: 'string' },
        ],
      };
      const other: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [{ linkId: 'B1', text: 'B1', type: 'string' }],
      };
      const merged = mergeProtocols(
        [makeComplaint('A', json), makeComplaint('B', other)],
        { age: 40 }
      );
      expect(merged?.item?.map(i => i.linkId)).toEqual(['A:all', 'B:B1']);
    });
  });

  describe('associated symptoms folding', () => {
    const buildAS = (
      title: string,
      opts: Array<{ code: string; display: string; exclusive?: boolean }>
    ): FhirQuestionnaire => ({
      resourceType: 'Questionnaire',
      title,
      item: [
        { linkId: `${title}-Q1`, text: `${title} primary`, type: 'string' },
        {
          linkId: `${title}-AS`,
          text: ASSOCIATED_SYMPTOMS_TEXT,
          type: 'choice',
          repeats: true,
          answerOption: opts.map(o => ({
            valueCoding: { code: o.code, display: o.display },
            ...(o.exclusive
              ? {
                  extension: [
                    { url: EXT_URL_IS_EXCLUSIVE_OPTION, valueString: 'true' },
                  ],
                }
              : {}),
          })),
        },
      ],
    });

    it('moves the associated symptoms group to a single merged block at the end', () => {
      const a = buildAS('A', [
        { code: 'fever', display: 'Fever' },
        { code: 'cough', display: 'Cough' },
      ]);
      const b = buildAS('B', [
        { code: 'cough', display: 'Cough' },
        { code: 'nausea', display: 'Nausea' },
      ]);
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      const last = merged?.item?.[merged.item.length - 1];
      expect(last?.linkId).toBe(MERGED_ASSOCIATED_SYMPTOMS_LINK_ID);
      expect(last?.text).toBe(ASSOCIATED_SYMPTOMS_TEXT);
      expect(last?.answerOption?.map(o => o.valueCoding?.code)).toEqual([
        'fever',
        'cough',
        'nausea',
      ]);
    });

    it('preserves the mutually exclusive extension from the first occurrence', () => {
      const a = buildAS('A', [
        { code: 'none', display: 'None', exclusive: true },
        { code: 'cough', display: 'Cough' },
      ]);
      const b = buildAS('B', [{ code: 'none', display: 'None' }]);
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      const last = merged?.item?.[merged.item.length - 1];
      const noneOpt = last?.answerOption?.find(
        o => o.valueCoding?.code === 'none'
      );
      expect(
        noneOpt?.extension?.some(e => e.url === EXT_URL_IS_EXCLUSIVE_OPTION)
      ).toBe(true);
    });

    it('does not re-introduce an option pruned from one protocol by demographics', () => {
      const a: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          { linkId: 'A1', text: 'A primary', type: 'string' },
          {
            linkId: 'A-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [
              {
                valueCoding: { code: 'menstrual', display: 'Menstrual issues' },
                extension: [
                  { url: EXT_URL_GENDER, valueString: GENDER_CODE_FEMALE },
                ],
              },
              { valueCoding: { code: 'cough', display: 'Cough' } },
            ],
          },
        ],
      };
      const merged = mergeProtocols([makeComplaint('A', a)], { gender: 'male' });
      const as = merged?.item?.find(i => i.text === ASSOCIATED_SYMPTOMS_TEXT);
      expect(as?.answerOption?.map(o => o.valueCoding?.code)).toEqual([
        'cough',
      ]);
    });

    it('keeps a nested AS child and rewrites its enableWhen to point at the merged AS linkId', () => {
      const a: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          { linkId: 'A1', text: 'A primary', type: 'string' },
          {
            linkId: 'A-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [{ valueCoding: { code: 'cough', display: 'Cough' } }],
            item: [
              {
                linkId: 'cough-describe',
                text: 'Describe the cough',
                type: 'string',
                enableWhen: [
                  {
                    question: 'A-AS',
                    operator: '=',
                    answerCoding: { code: 'cough' },
                  },
                ],
              },
            ],
          },
        ],
      };
      const b: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [{ linkId: 'B1', text: 'B primary', type: 'string' }],
      };
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      const mergedAS = merged?.item?.find(
        i => i.linkId === MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
      const child = mergedAS?.item?.[0];
      expect(child?.linkId).toBe('A:cough-describe');
      expect(child?.enableWhen?.[0].question).toBe(
        MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
      expect(child?.enableWhen?.[0].answerCoding?.code).toBe('cough');
    });

    it('rewrites enableWhen recursively for grandchildren of an AS option', () => {
      const a: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          {
            linkId: 'A-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [{ valueCoding: { code: 'pain', display: 'Pain' } }],
            item: [
              {
                linkId: 'pain-detail',
                text: 'Pain detail',
                type: 'choice',
                enableWhen: [
                  {
                    question: 'A-AS',
                    operator: '=',
                    answerCoding: { code: 'pain' },
                  },
                ],
                item: [
                  {
                    linkId: 'pain-deep',
                    text: 'Deep follow-up',
                    type: 'string',
                    enableWhen: [
                      {
                        question: 'A-AS',
                        operator: '=',
                        answerCoding: { code: 'pain' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const b: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [{ linkId: 'B1', text: 'B1', type: 'string' }],
      };
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      const mergedAS = merged?.item?.find(
        i => i.linkId === MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
      const detail = mergedAS?.item?.[0];
      const grandchild = detail?.item?.[0];
      expect(detail?.enableWhen?.[0].question).toBe(
        MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
      expect(grandchild?.enableWhen?.[0].question).toBe(
        MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
    });

    it('combines nested AS children from multiple protocols', () => {
      const buildWithChild = (
        title: string,
        optCode: string,
        childLinkId: string
      ): FhirQuestionnaire => ({
        resourceType: 'Questionnaire',
        title,
        item: [
          {
            linkId: `${title}-AS`,
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [
              { valueCoding: { code: optCode, display: optCode } },
            ],
            item: [
              {
                linkId: childLinkId,
                text: `${optCode} describe`,
                type: 'string',
                enableWhen: [
                  {
                    question: `${title}-AS`,
                    operator: '=',
                    answerCoding: { code: optCode },
                  },
                ],
              },
            ],
          },
        ],
      });
      const merged = mergeProtocols([
        makeComplaint('A', buildWithChild('A', 'cough', 'cough-describe')),
        makeComplaint('B', buildWithChild('B', 'fever', 'fever-describe')),
      ]);
      const mergedAS = merged?.item?.find(
        i => i.linkId === MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
      expect(mergedAS?.item?.map(c => c.linkId)).toEqual([
        'A:cough-describe',
        'B:fever-describe',
      ]);
      for (const child of mergedAS?.item ?? []) {
        expect(child.enableWhen?.[0].question).toBe(
          MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
        );
      }
    });

    it('dedups options that share a display label even when their codes differ', () => {
      const a: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          {
            linkId: 'A-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [
              { valueCoding: { code: 'a-cough', display: 'Cough' } },
              { valueCoding: { code: 'a-other', display: 'Other [describe]' } },
            ],
          },
        ],
      };
      const b: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [
          {
            linkId: 'B-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [
              { valueCoding: { code: 'b-cough', display: 'Cough' } },
              { valueCoding: { code: 'b-other', display: 'Other [describe]' } },
            ],
          },
        ],
      };
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      const mergedAS = merged?.item?.find(
        i => i.linkId === MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
      expect(
        mergedAS?.answerOption?.map(o => o.valueCoding?.display)
      ).toEqual(['Cough', 'Other [describe]']);
      expect(mergedAS?.answerOption?.map(o => o.valueCoding?.code)).toEqual([
        'a-cough',
        'a-other',
      ]);
    });

    it("drops B's nested child that referenced the deduped-out option code", () => {
      const a: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          {
            linkId: 'A-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [
              { valueCoding: { code: 'a-other', display: 'Other [describe]' } },
            ],
            item: [
              {
                linkId: 'a-other-describe',
                text: 'Describe other',
                type: 'string',
                enableWhen: [
                  {
                    question: 'A-AS',
                    operator: '=',
                    answerCoding: { code: 'a-other' },
                  },
                ],
              },
            ],
          },
        ],
      };
      const b: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [
          {
            linkId: 'B-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [
              { valueCoding: { code: 'b-other', display: 'Other [describe]' } },
            ],
            item: [
              {
                linkId: 'b-other-describe',
                text: 'Describe other B',
                type: 'string',
                enableWhen: [
                  {
                    question: 'B-AS',
                    operator: '=',
                    answerCoding: { code: 'b-other' },
                  },
                ],
              },
            ],
          },
        ],
      };
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      const mergedAS = merged?.item?.find(
        i => i.linkId === MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
      expect(mergedAS?.item?.map(c => c.linkId)).toEqual(['A:a-other-describe']);
    });

    it('omits the merged block when no protocol carries associated symptoms', () => {
      const merged = mergeProtocols([
        makeComplaint('A', {
          resourceType: 'Questionnaire',
          title: 'A',
          item: [{ linkId: 'A1', text: 'A1', type: 'string' }],
        }),
        makeComplaint('B', {
          resourceType: 'Questionnaire',
          title: 'B',
          item: [{ linkId: 'B1', text: 'B1', type: 'string' }],
        }),
      ]);
      expect(
        merged?.item?.some(
          i => i.linkId === MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
        )
      ).toBe(false);
    });

    it('dedups options by code/string, drops identifier-less options, and keeps unrelated or enableWhen-less AS children', () => {
      const a: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          { linkId: 'A-other', text: 'Other', type: 'choice' },
          {
            linkId: 'A-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [
              { valueCoding: { code: 'cough' } },
              { valueString: 'Tiredness' },
              {},
            ],
            item: [
              {
                linkId: 'on-as',
                text: 'On AS',
                type: 'string',
                enableWhen: [
                  {
                    question: 'A-AS',
                    operator: '=',
                    answerCoding: { code: 'cough' },
                  },
                ],
              },
              {
                linkId: 'on-other',
                text: 'On other',
                type: 'string',
                enableWhen: [
                  { question: 'A-other', operator: '=', answerString: 'yes' },
                ],
              },
              { linkId: 'always', text: 'Always', type: 'string' },
            ],
          },
        ],
      };
      const b: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [{ linkId: 'B1', text: 'B1', type: 'string' }],
      };
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      const mergedAS = merged?.item?.find(
        i => i.linkId === MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
      expect(
        mergedAS?.answerOption?.map(o => o.valueCoding?.code ?? o.valueString)
      ).toEqual(['cough', 'Tiredness']);
      expect(mergedAS?.item?.map(c => c.linkId)).toEqual([
        'A:on-as',
        'A:on-other',
        'A:always',
      ]);
      expect(
        mergedAS?.item?.find(c => c.linkId === 'A:on-as')?.enableWhen?.[0]
          .question
      ).toBe(MERGED_ASSOCIATED_SYMPTOMS_LINK_ID);
      expect(
        mergedAS?.item?.find(c => c.linkId === 'A:on-other')?.enableWhen?.[0]
          .question
      ).toBe('A:A-other');
      expect(
        mergedAS?.item?.find(c => c.linkId === 'A:always')?.enableWhen
      ).toBeUndefined();
    });

    it('leaves an enableWhen reference unchanged when it points outside the protocol forest', () => {
      const a: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          {
            linkId: 'q1',
            text: 'Q1',
            type: 'string',
            enableWhen: [
              { question: 'external-ref', operator: '=', answerString: 'y' },
            ],
          },
        ],
      };
      const b: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [{ linkId: 'B1', text: 'B1', type: 'string' }],
      };
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      const q1 = merged?.item?.find(i => i.linkId === 'A:q1');
      expect(q1?.enableWhen?.[0].question).toBe('external-ref');
    });

    it('merges an associated symptoms group that carries no answerOption', () => {
      const a: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          {
            linkId: 'A-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
          },
        ],
      };
      const b: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [
          {
            linkId: 'B-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [{ valueCoding: { code: 'fever', display: 'Fever' } }],
          },
        ],
      };
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      const mergedAS = merged?.item?.find(
        i => i.linkId === MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
      expect(mergedAS?.answerOption?.map(o => o.valueCoding?.code)).toEqual([
        'fever',
      ]);
    });

    it('keeps a single instance when an AS group repeats a child linkId', () => {
      const a: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          {
            linkId: 'A-AS',
            text: ASSOCIATED_SYMPTOMS_TEXT,
            type: 'choice',
            repeats: true,
            answerOption: [{ valueCoding: { code: 'cough', display: 'Cough' } }],
            item: [
              { linkId: 'dup', text: 'First', type: 'string' },
              { linkId: 'dup', text: 'Second', type: 'string' },
            ],
          },
        ],
      };
      const b: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'B',
        item: [{ linkId: 'B1', text: 'B1', type: 'string' }],
      };
      const merged = mergeProtocols([
        makeComplaint('A', a),
        makeComplaint('B', b),
      ]);
      const mergedAS = merged?.item?.find(
        i => i.linkId === MERGED_ASSOCIATED_SYMPTOMS_LINK_ID
      );
      expect(mergedAS?.item?.map(c => c.linkId)).toEqual(['A:dup']);
    });

    it('returns null when every protocol has zero items after demographic filtering', () => {
      const ageGated: FhirQuestionnaire = {
        resourceType: 'Questionnaire',
        title: 'A',
        item: [
          {
            linkId: 'A1',
            text: 'A1',
            type: 'string',
            extension: [{ url: EXT_URL_AGE_MIN, valueString: '99' }],
          },
        ],
      };
      const merged = mergeProtocols(
        [makeComplaint('A', ageGated), makeComplaint('B', ageGated)],
        { age: 30 }
      );
      expect(merged).toBeNull();
    });
  });
});

describe('groupAnswersByProtocol', () => {
  it('splits prefixed linkIds into per-protocol buckets', () => {
    const result = groupAnswersByProtocol({
      'Vomiting:Q1': 'a',
      'Vomiting:Q2': 'b',
      'Fever:Q1': 'c',
    });
    expect(result.byProtocol).toEqual({
      Vomiting: { Q1: 'a', Q2: 'b' },
      Fever: { Q1: 'c' },
    });
    expect(result.associatedSymptoms).toBeNull();
    expect(result.unknown).toEqual({});
  });

  it('extracts the merged associated symptoms answer', () => {
    const result = groupAnswersByProtocol({
      'A:Q1': 'x',
      [MERGED_ASSOCIATED_SYMPTOMS_LINK_ID]: ['fever', 'cough'],
    });
    expect(result.associatedSymptoms).toEqual(['fever', 'cough']);
    expect(result.byProtocol.A.Q1).toBe('x');
  });

  it('routes unprefixed linkIds to the unknown bucket', () => {
    const result = groupAnswersByProtocol({
      Q1: 'legacy',
      'A:Q2': 'new',
    });
    expect(result.unknown).toEqual({ Q1: 'legacy' });
    expect(result.byProtocol.A.Q2).toBe('new');
  });

  it('returns empty structures for an empty answer map', () => {
    const result = groupAnswersByProtocol({});
    expect(result.byProtocol).toEqual({});
    expect(result.unknown).toEqual({});
    expect(result.associatedSymptoms).toBeNull();
  });
});
