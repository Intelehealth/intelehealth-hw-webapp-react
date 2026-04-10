import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  buildVisitReasonHtml,
  buildPhysicalExamData,
  buildMedicalHistoryData,
  buildFamilyHistoryData,
  buildVisitUploadPayload,
  uploadVisit,
} from '../../../../modules/ayu/services/visit-upload.service';
import type { BuildVisitUploadParams } from '../../../../modules/ayu/services/visit-upload.service';
import type { PhysicalExamQuestion } from '../../../../modules/ayu/data/physical-exam.data';
import type { MedicalHistorySummary } from '../../../../modules/ayu/context/start-visit.context';
import type { VisitUploadPayload } from '../../../../modules/ayu/types/visit-upload.types';
import {
  ENCOUNTER_TYPES,
  ENCOUNTER_ROLE,
  VISIT_TYPE,
  VISIT_ATTRIBUTE_TYPES,
  ADULT_INITIAL_CONCEPTS,
} from '../../../../modules/ayu/constants/visit-upload.constants';

// Mock the EmrMiddlewareApi
vi.mock('../../../../services/patient.service', () => ({
  EmrMiddlewareApi: {
    post: vi.fn(),
  },
}));

import { EmrMiddlewareApi } from '../../../../services/patient.service';

describe('visit-upload.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── buildVisitReasonHtml ──────────────────────────────────────────────────

  describe('buildVisitReasonHtml', () => {
    it('should build HTML with multiple details and reason names', () => {
      const details = [
        { label: 'Duration', value: '3 days' },
        { label: 'Severity', value: 'Moderate' },
      ];
      const reasonNames = ['Cough', 'Fever'];

      const result = buildVisitReasonHtml(details, reasonNames);

      expect(result.displayHtml).toContain('<b>Cough, Fever</b>');
      expect(result.displayHtml).toContain('Duration - 3 days.<br/>');
      expect(result.displayHtml).toContain('Severity - Moderate.<br/>');

      const rawParsed = JSON.parse(result.rawJson);
      expect(rawParsed.text_en).toContain('Duration-3 days<br/>');
      expect(rawParsed.text_en).toContain('Severity-Moderate<br/>');
    });

    it('should handle empty details', () => {
      const details: Array<{ label: string; value: string }> = [];
      const reasonNames = ['Headache'];

      const result = buildVisitReasonHtml(details, reasonNames);

      expect(result.displayHtml).toBe('<b>Headache</b>: <br/>');

      const rawParsed = JSON.parse(result.rawJson);
      expect(rawParsed.text_en).toBe('');
    });

    it('should handle empty reasons', () => {
      const details = [{ label: 'Note', value: 'Some note' }];
      const reasonNames: string[] = [];

      const result = buildVisitReasonHtml(details, reasonNames);

      expect(result.displayHtml).toContain('<b></b>');
      expect(result.displayHtml).toContain('Note - Some note.<br/>');
    });

    it('should handle single detail and single reason', () => {
      const details = [{ label: 'Onset', value: 'Sudden' }];
      const reasonNames = ['Chest Pain'];

      const result = buildVisitReasonHtml(details, reasonNames);

      expect(result.displayHtml).toBe(
        '<b>Chest Pain</b>: <br/>\u2022 Onset - Sudden.<br/>'
      );
    });
  });

  // ─── buildPhysicalExamData ─────────────────────────────────────────────────

  describe('buildPhysicalExamData', () => {
    const makeQuestion = (
      overrides: Partial<PhysicalExamQuestion> & { id: string }
    ): PhysicalExamQuestion => ({
      sectionLabel: 'General exams:',
      categoryLabel: 'Eyes',
      questionText: 'Is there jaundice?',
      isRequired: true,
      isMultiChoice: false,
      options: [
        { id: 'no_jaundice', text: 'No jaundice seen' },
        { id: 'jaundice', text: 'Jaundice present' },
      ],
      sectionKey: 'general',
      ...overrides,
    });

    it('should build HTML from answered questions', () => {
      const questions: PhysicalExamQuestion[] = [
        makeQuestion({ id: 'q1' }),
      ];
      const answers = { q1: ['no_jaundice'] };

      const result = buildPhysicalExamData(answers, questions);

      expect(result.displayHtml).toContain('General exams');
      expect(result.displayHtml).toContain('Eyes-no jaundice seen.');

      const rawParsed = JSON.parse(result.rawJson);
      expect(rawParsed.text_en).toContain('Eyes-');
      expect(rawParsed.text_en).toContain('Is there jaundice?*');
      expect(rawParsed.text_en).toContain('No jaundice seen');
    });

    it('should skip questions with no selected answers', () => {
      const questions: PhysicalExamQuestion[] = [
        makeQuestion({ id: 'q1' }),
        makeQuestion({ id: 'q2', categoryLabel: 'Skin', questionText: 'Skin color?', isRequired: false }),
      ];
      const answers = { q1: ['no_jaundice'], q2: [] };

      const result = buildPhysicalExamData(answers, questions);

      expect(result.displayHtml).toContain('Eyes');
      expect(result.displayHtml).not.toContain('Skin');
    });

    it('should handle multiple sections', () => {
      const questions: PhysicalExamQuestion[] = [
        makeQuestion({ id: 'q1', sectionLabel: 'General exams:' }),
        makeQuestion({
          id: 'q2',
          sectionLabel: 'Cardiovascular:',
          categoryLabel: 'Heart',
          questionText: 'Heart sounds?',
          options: [{ id: 'normal', text: 'Normal' }],
          sectionKey: 'cardiovascular',
        }),
      ];
      const answers = { q1: ['no_jaundice'], q2: ['normal'] };

      const result = buildPhysicalExamData(answers, questions);

      expect(result.displayHtml).toContain('General exams');
      expect(result.displayHtml).toContain('Cardiovascular');
    });

    it('should return empty strings for no answers', () => {
      const questions: PhysicalExamQuestion[] = [
        makeQuestion({ id: 'q1' }),
      ];
      const answers = {};

      const result = buildPhysicalExamData(answers, questions);

      expect(result.displayHtml).toBe('');
      expect(JSON.parse(result.rawJson).text_en).toBe('');
    });

    it('should not add asterisk for non-required questions in raw HTML', () => {
      const questions: PhysicalExamQuestion[] = [
        makeQuestion({ id: 'q1', isRequired: false }),
      ];
      const answers = { q1: ['no_jaundice'] };

      const result = buildPhysicalExamData(answers, questions);

      const rawParsed = JSON.parse(result.rawJson);
      expect(rawParsed.text_en).not.toContain('*');
    });

    it('should handle multi-choice answers', () => {
      const questions: PhysicalExamQuestion[] = [
        makeQuestion({ id: 'q1', isMultiChoice: true }),
      ];
      const answers = { q1: ['no_jaundice', 'jaundice'] };

      const result = buildPhysicalExamData(answers, questions);

      expect(result.displayHtml).toContain('no jaundice seen, jaundice present');
    });

    it('should skip question when selected IDs do not match any option', () => {
      const questions: PhysicalExamQuestion[] = [
        makeQuestion({ id: 'q1' }),
      ];
      const answers = { q1: ['non_existent_id'] };

      const result = buildPhysicalExamData(answers, questions);

      // selectedIds has entries but none match options, so selectedTexts is empty after filter(Boolean)
      // !selectedTexts.length triggers continue, skipping the question
      expect(result.displayHtml).toBe('');
      expect(JSON.parse(result.rawJson).text_en).toBe('');
    });
  });

  // ─── buildMedicalHistoryData ───────────────────────────────────────────────

  describe('buildMedicalHistoryData', () => {
    it('should build HTML from sections with labelValue items', () => {
      const sections: MedicalHistorySummary[] = [
        {
          title: 'Past History',
          items: [
            { type: 'labelValue', label: 'Diabetes', value: 'Yes' },
            { type: 'labelValue', label: 'Hypertension', value: 'No' },
          ],
        },
      ];

      const result = buildMedicalHistoryData(sections);

      expect(result.displayHtml).toContain('Medical History - Yes, No');
      expect(result.displayHtml).toContain('<br/>');

      const rawParsed = JSON.parse(result.rawJson);
      expect(rawParsed.text_en).toContain('Yes, No');
    });

    it('should handle empty sections', () => {
      const sections: MedicalHistorySummary[] = [];

      const result = buildMedicalHistoryData(sections);

      expect(result.displayHtml).toContain('None');

      const rawParsed = JSON.parse(result.rawJson);
      expect(rawParsed.text_en).toContain('None');
    });

    it('should filter out items with null values', () => {
      const sections: MedicalHistorySummary[] = [
        {
          title: 'Past History',
          items: [
            { type: 'labelValue', label: 'Diabetes', value: null },
            { type: 'labelValue', label: 'Asthma', value: 'Yes' },
          ],
        },
      ];

      const result = buildMedicalHistoryData(sections);

      expect(result.displayHtml).toContain('Medical History - Yes');
      expect(result.displayHtml).not.toContain('null');
    });

    it('should handle sections with only subheading items (no labelValue)', () => {
      const sections: MedicalHistorySummary[] = [
        {
          title: 'Past History',
          items: [
            { type: 'subheading', heading: 'Chronic', values: ['A', 'B'] },
          ],
        },
      ];

      const result = buildMedicalHistoryData(sections);

      expect(result.displayHtml).toContain('None');
    });

    it('should combine items from multiple sections', () => {
      const sections: MedicalHistorySummary[] = [
        {
          title: 'Section A',
          items: [{ type: 'labelValue', label: 'A', value: 'Val A' }],
        },
        {
          title: 'Section B',
          items: [{ type: 'labelValue', label: 'B', value: 'Val B' }],
        },
      ];

      const result = buildMedicalHistoryData(sections);

      expect(result.displayHtml).toContain('Val A, Val B');
    });
  });

  // ─── buildFamilyHistoryData ────────────────────────────────────────────────

  describe('buildFamilyHistoryData', () => {
    it('should build HTML from sections with labelValue items and relations', () => {
      const sections: MedicalHistorySummary[] = [
        {
          title: 'Family History',
          items: [
            { type: 'labelValue', label: 'Diabetes', value: 'Father' },
            { type: 'labelValue', label: 'Hypertension', value: 'Mother' },
          ],
        },
      ];

      const result = buildFamilyHistoryData(sections);

      expect(result.displayHtml).toContain('Diabetes (Father)');
      expect(result.displayHtml).toContain('Hypertension (Mother)');

      const rawParsed = JSON.parse(result.rawJson);
      expect(rawParsed.text_en).toContain('Diabetes (Father)');
      expect(rawParsed.text_en).toContain('Hypertension (Mother)');
    });

    it('should handle empty sections', () => {
      const sections: MedicalHistorySummary[] = [];

      const result = buildFamilyHistoryData(sections);

      expect(result.displayHtml).toContain('None');

      const rawParsed = JSON.parse(result.rawJson);
      expect(rawParsed.text_en).toContain('None');
    });

    it('should handle items without values (no relation)', () => {
      const sections: MedicalHistorySummary[] = [
        {
          title: 'Family History',
          items: [
            { type: 'labelValue', label: 'Cancer', value: null },
          ],
        },
      ];

      const result = buildFamilyHistoryData(sections);

      // When value is null/falsy, no parenthetical relation is added
      expect(result.displayHtml).toContain('Cancer');
      expect(result.displayHtml).not.toContain('Cancer (');
    });

    it('should combine items from multiple sections', () => {
      const sections: MedicalHistorySummary[] = [
        {
          title: 'Section 1',
          items: [{ type: 'labelValue', label: 'Diabetes', value: 'Father' }],
        },
        {
          title: 'Section 2',
          items: [{ type: 'labelValue', label: 'Asthma', value: 'Sister' }],
        },
      ];

      const result = buildFamilyHistoryData(sections);

      expect(result.displayHtml).toContain('Diabetes (Father), Asthma (Sister)');
    });
  });

  // ─── buildVisitUploadPayload ───────────────────────────────────────────────

  describe('buildVisitUploadPayload', () => {
    const makeParams = (overrides?: Partial<BuildVisitUploadParams>): BuildVisitUploadParams => ({
      patientUuid: 'patient-uuid-1',
      providerUuid: 'provider-uuid-1',
      locationUuid: 'location-uuid-1',
      vitalsFormValues: { height_cm: 170, weight_kg: 70 },
      vitalsConfig: [
        { name: 'Height', key: 'height_cm', uuid: 'uuid-height', is_mandatory: true, lang: null, is_enabled: true },
        { name: 'Weight', key: 'weight_kg', uuid: 'uuid-weight', is_mandatory: true, lang: null, is_enabled: true },
      ],
      visitReason: {
        displayHtml: '<b>Cough</b>: test',
        rawJson: '{"text_en":"test"}',
      },
      physicalExam: {
        displayHtml: '<b>General</b>: test',
        rawJson: '{"text_en":"test"}',
      },
      medicalHistory: {
        displayHtml: '* Medical History - None',
        rawJson: '{"text_en":"None"}',
      },
      familyHistory: {
        displayHtml: '* Family History - None',
        rawJson: '{"text_en":"None"}',
      },
      ...overrides,
    });

    it('should create 2 encounters when priorityVisit is false/undefined', () => {
      const result = buildVisitUploadPayload(makeParams());

      expect(result.encounters).toHaveLength(2);
    });

    it('should create 3 encounters when priorityVisit is true', () => {
      const result = buildVisitUploadPayload(makeParams({ priorityVisit: true }));

      expect(result.encounters).toHaveLength(3);
    });

    it('should create vitals encounter as first encounter', () => {
      const result = buildVisitUploadPayload(makeParams());
      const vitalsEnc = result.encounters[0];

      expect(vitalsEnc.encounterType).toBe(ENCOUNTER_TYPES.VITALS);
      expect(vitalsEnc.patient).toBe('patient-uuid-1');
      expect(vitalsEnc.location).toBe('location-uuid-1');
      expect(vitalsEnc.voided).toBe(0);
      expect(vitalsEnc.encounterProviders).toHaveLength(1);
      expect(vitalsEnc.encounterProviders[0].encounterRole).toBe(ENCOUNTER_ROLE);
      expect(vitalsEnc.encounterProviders[0].provider).toBe('provider-uuid-1');
    });

    it('should build vitals obs from form values and config', () => {
      const result = buildVisitUploadPayload(makeParams());
      const vitalsObs = result.encounters[0].obs!;

      expect(vitalsObs).toHaveLength(2);
      expect(vitalsObs[0]).toEqual({ comments: '', concept: 'uuid-height', value: '170' });
      expect(vitalsObs[1]).toEqual({ comments: '', concept: 'uuid-weight', value: '70' });
    });

    it('should skip empty vitals values', () => {
      const result = buildVisitUploadPayload(
        makeParams({
          vitalsFormValues: { height_cm: 170, weight_kg: undefined },
        })
      );
      const vitalsObs = result.encounters[0].obs!;

      expect(vitalsObs).toHaveLength(1);
      expect(vitalsObs[0].concept).toBe('uuid-height');
    });

    it('should create adult initial encounter as second encounter', () => {
      const result = buildVisitUploadPayload(makeParams());
      const adultEnc = result.encounters[1];

      expect(adultEnc.encounterType).toBe(ENCOUNTER_TYPES.ADULT_INITIAL);
      expect(adultEnc.obs).toHaveLength(4);
    });

    it('should include visit reason, physical exam, medical history, family history obs', () => {
      const result = buildVisitUploadPayload(makeParams());
      const obs = result.encounters[1].obs!;

      const concepts = obs.map(o => o.concept);
      expect(concepts).toContain(ADULT_INITIAL_CONCEPTS.VISIT_REASON_DISPLAY);
      expect(concepts).toContain(ADULT_INITIAL_CONCEPTS.PHYSICAL_EXAM_DISPLAY);
      expect(concepts).toContain(ADULT_INITIAL_CONCEPTS.MEDICAL_HISTORY_DISPLAY);
      expect(concepts).toContain(ADULT_INITIAL_CONCEPTS.FAMILY_HISTORY_DISPLAY);
    });

    it('should not include visit priority encounter when priorityVisit is false', () => {
      const result = buildVisitUploadPayload(makeParams({ priorityVisit: false }));

      expect(result.encounters).toHaveLength(2);
      expect(result.encounters[0].encounterType).toBe(ENCOUNTER_TYPES.VITALS);
      expect(result.encounters[1].encounterType).toBe(ENCOUNTER_TYPES.ADULT_INITIAL);
    });

    it('should create visit priority encounter as third encounter when priorityVisit is true', () => {
      const result = buildVisitUploadPayload(makeParams({ priorityVisit: true }));
      const visitPriorityEnc = result.encounters[2];

      expect(visitPriorityEnc.encounterType).toBe(ENCOUNTER_TYPES.VISIT_PRIORITY);
      expect(visitPriorityEnc.obs).toBeUndefined();
    });

    it('should have visit priority datetime slightly after vitals datetime', () => {
      const result = buildVisitUploadPayload(makeParams({ priorityVisit: true }));

      const vitalsDatetime = result.encounters[0].encounterDatetime;
      const priorityDatetime = result.encounters[2].encounterDatetime;

      // Both should be ISO-like strings with +0000
      expect(vitalsDatetime).toContain('+0000');
      expect(priorityDatetime).toContain('+0000');

      // Visit priority should be after vitals
      const vitalsTime = new Date(vitalsDatetime.replace('+0000', 'Z')).getTime();
      const priorityTime = new Date(priorityDatetime.replace('+0000', 'Z')).getTime();
      expect(priorityTime).toBeGreaterThan(vitalsTime);
    });

    it('should create 1 visit with correct structure', () => {
      const result = buildVisitUploadPayload(makeParams());

      expect(result.visits).toHaveLength(1);
      const visit = result.visits[0];

      expect(visit.patient).toBe('patient-uuid-1');
      expect(visit.location).toBe('location-uuid-1');
      expect(visit.visitType).toBe(VISIT_TYPE);
      expect(visit.attributes).toHaveLength(3);
    });

    it('should include speciality attribute defaulting to General Physician', () => {
      const result = buildVisitUploadPayload(makeParams());
      const attrs = result.visits[0].attributes;

      const speciality = attrs.find(
        a => a.attributeType === VISIT_ATTRIBUTE_TYPES.SPECIALITY
      );
      expect(speciality).toBeDefined();
      expect(speciality!.value).toBe('General Physician');
    });

    it('should use custom speciality when provided', () => {
      const result = buildVisitUploadPayload(
        makeParams({ speciality: 'Dermatology' })
      );
      const attrs = result.visits[0].attributes;

      const speciality = attrs.find(
        a => a.attributeType === VISIT_ATTRIBUTE_TYPES.SPECIALITY
      );
      expect(speciality!.value).toBe('Dermatology');
    });

    it('should include doctor notes attribute', () => {
      const result = buildVisitUploadPayload(makeParams());
      const attrs = result.visits[0].attributes;

      const doctorNotes = attrs.find(
        a => a.attributeType === VISIT_ATTRIBUTE_TYPES.DOCTOR_NOTES
      );
      expect(doctorNotes).toBeDefined();
      expect(doctorNotes!.value).toBe('No notes added for Doctor.');
    });
  });

  // ─── uploadVisit ───────────────────────────────────────────────────────────

  describe('uploadVisit', () => {
    it('should call EmrMiddlewareApi.post with correct endpoint and payload', async () => {
      const mockPayload: VisitUploadPayload = {
        encounters: [],
        visits: [],
      };
      const mockResponse = { status: 'ok' };
      vi.mocked(EmrMiddlewareApi.post).mockResolvedValue(mockResponse);

      const result = await uploadVisit(mockPayload);

      expect(EmrMiddlewareApi.post).toHaveBeenCalledWith(
        '/push/visit-encounters',
        mockPayload
      );
      expect(result).toEqual(mockResponse);
    });

    it('should call API only once', async () => {
      vi.mocked(EmrMiddlewareApi.post).mockResolvedValue({});

      await uploadVisit({ encounters: [], visits: [] });

      expect(EmrMiddlewareApi.post).toHaveBeenCalledTimes(1);
    });

    it('should propagate API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(EmrMiddlewareApi.post).mockRejectedValue(error);

      await expect(
        uploadVisit({ encounters: [], visits: [] })
      ).rejects.toThrow('Network error');
    });
  });
});
