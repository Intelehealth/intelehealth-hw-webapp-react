import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  visitSummaryService,
  API_ENDPOINTS,
  CONCEPT_UUIDS,
  getObsNumericValue,
  extractDetailsFromHtml,
  extractChiefComplaints,
  extractPhysicalExamination,
  extractMedicalHistory,
  transformVisitSummaryResponse,
  transformObsToDocuments,
} from '../../../modules/visit-summary/visit-summary.service';
import { OpenMRSApi } from '../../../services/openmrs';
import type { VisitDetailsResponse, VisitDetailsEncounter } from '../../../modules/visit-details/visit-details.types';

vi.mock('../../../services/openmrs', () => ({
  OpenMRSApi: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

/* ── Helpers ── */

function makeObs(conceptUuid: string, value: string | { uuid: string; display: string }) {
  return {
    uuid: 'obs-uuid',
    display: `obs-display`,
    concept: { uuid: conceptUuid, display: 'concept-display' },
    value,
  };
}

function makeEncounter(obs: ReturnType<typeof makeObs>[] = [], providerName?: string): VisitDetailsEncounter {
  return {
    uuid: 'enc-uuid',
    display: 'encounter',
    encounterDatetime: '2026-01-15T10:00:00.000+0000',
    encounterType: { uuid: 'et-uuid', display: 'ADULTINITIAL' },
    encounterProviders: providerName
      ? [
          {
            uuid: 'ep-uuid',
            display: providerName,
            provider: {
              uuid: 'prov-uuid',
              display: providerName,
              person: { uuid: 'person-uuid', display: providerName },
              attributes: [],
            },
          },
        ]
      : [],
    obs,
  };
}

function makeResponse(overrides?: Partial<VisitDetailsResponse>): VisitDetailsResponse {
  return {
    uuid: 'visit-uuid-12345678',
    display: 'Visit',
    startDatetime: '2026-01-15T10:00:00.000+0000',
    stopDatetime: null,
    encounters: [],
    patient: {
      uuid: 'patient-uuid',
      display: 'John Doe',
      person: {
        uuid: 'person-uuid',
        display: 'John Doe',
        gender: 'M',
        age: 30,
        birthdate: '1996-05-12T00:00:00.000+0000',
        preferredName: {
          uuid: 'name-uuid',
          display: 'John Doe',
          givenName: 'John',
          familyName: 'Doe',
        },
        attributes: [],
      },
      identifiers: [
        {
          uuid: 'id-uuid',
          display: 'ABC-123',
          identifier: 'ABC-123',
          identifierType: { uuid: 'type-uuid', display: 'OpenMRS ID' },
        },
      ],
    },
    attributes: [],
    visitType: { uuid: 'vt-uuid', display: 'Facility Visit' },
    location: { uuid: 'loc-uuid', display: 'Location' },
    ...overrides,
  };
}

/* ── Tests ── */

describe('visitSummaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API_ENDPOINTS', () => {
    it('should have VISIT endpoint', () => {
      expect(API_ENDPOINTS.VISIT).toBe('/visit');
    });
  });

  describe('CONCEPT_UUIDS', () => {
    it('should have all vital concept UUIDs', () => {
      expect(CONCEPT_UUIDS.HEIGHT).toBeDefined();
      expect(CONCEPT_UUIDS.WEIGHT).toBeDefined();
      expect(CONCEPT_UUIDS.BMI).toBeDefined();
      expect(CONCEPT_UUIDS.BP_SYSTOLIC).toBeDefined();
      expect(CONCEPT_UUIDS.BP_DIASTOLIC).toBeDefined();
      expect(CONCEPT_UUIDS.PULSE).toBeDefined();
      expect(CONCEPT_UUIDS.TEMPERATURE).toBeDefined();
      expect(CONCEPT_UUIDS.SPO2).toBeDefined();
      expect(CONCEPT_UUIDS.RESPIRATORY_RATE).toBeDefined();
      expect(CONCEPT_UUIDS.CHIEF_COMPLAINT).toBeDefined();
      expect(CONCEPT_UUIDS.PHYSICAL_EXAMINATION).toBeDefined();
    });
  });

  describe('closeVisit', () => {
    it('should call OpenMRSApi.post with correct URL', async () => {
      const mockPost = vi.mocked(OpenMRSApi.post).mockResolvedValue({});
      const visitUuid = 'test-uuid-123';

      await visitSummaryService.closeVisit(visitUuid);

      expect(mockPost).toHaveBeenCalledWith(
        `/visit/${visitUuid}`,
        expect.any(Object),
      );
    });

    it('should send stopDatetime in payload', async () => {
      const mockPost = vi.mocked(OpenMRSApi.post).mockResolvedValue({});

      await visitSummaryService.closeVisit('test-uuid-456');

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          stopDatetime: expect.any(String),
        }),
      );
    });

    it('should send a valid ISO date string as stopDatetime', async () => {
      const mockPost = vi.mocked(OpenMRSApi.post).mockResolvedValue({});

      await visitSummaryService.closeVisit('test-uuid-789');

      const payload = mockPost.mock.calls[0][1] as { stopDatetime: string };
      const date = new Date(payload.stopDatetime);
      expect(date.toISOString()).toBe(payload.stopDatetime);
    });

    it('should return the API response', async () => {
      const mockResponse = { data: 'success' };
      vi.mocked(OpenMRSApi.post).mockResolvedValue(mockResponse);

      const result = await visitSummaryService.closeVisit('test-uuid');

      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from the API', async () => {
      vi.mocked(OpenMRSApi.post).mockRejectedValue(new Error('Network error'));

      await expect(visitSummaryService.closeVisit('test-uuid')).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getVisitSummary', () => {
    it('should call OpenMRSApi.get with correct URL containing visitUuid', async () => {
      const mockGet = vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse());

      await visitSummaryService.getVisitSummary('my-visit-uuid');

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/visit/my-visit-uuid?v=custom:'),
      );
    });

    it('should return transformed VisitData', async () => {
      const response = makeResponse({
        encounters: [
          makeEncounter(
            [
              makeObs(CONCEPT_UUIDS.HEIGHT, '168'),
              makeObs(CONCEPT_UUIDS.WEIGHT, '72'),
              makeObs(CONCEPT_UUIDS.BMI, '25.51'),
              makeObs(CONCEPT_UUIDS.BP_SYSTOLIC, '130'),
              makeObs(CONCEPT_UUIDS.BP_DIASTOLIC, '85'),
              makeObs(CONCEPT_UUIDS.PULSE, '75'),
            ],
            'Kiran Devi',
          ),
        ],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(response);

      const result = await visitSummaryService.getVisitSummary('visit-uuid');

      expect(result.patient.name).toBe('John Doe');
      expect(result.patient.gender).toBe('Male');
      expect(result.vitals.height.value).toBe(168);
      expect(result.vitals.weight.value).toBe(72);
      expect(result.vitals.bmi.value).toBe(25.51);
      expect(result.vitals.bp.systolic).toBe(130);
      expect(result.vitals.bp.diastolic).toBe(85);
      expect(result.vitals.pulse.value).toBe(75);
    });

    it('should propagate errors from the API', async () => {
      vi.mocked(OpenMRSApi.get).mockRejectedValue(new Error('API failure'));

      await expect(
        visitSummaryService.getVisitSummary('test-uuid'),
      ).rejects.toThrow('API failure');
    });
  });

  describe('getObsNumericValue', () => {
    it('should extract numeric value from string obs', () => {
      const encounters = [makeEncounter([makeObs('concept-1', '168')])];
      expect(getObsNumericValue(encounters, 'concept-1')).toBe(168);
    });

    it('should extract numeric value from object obs display', () => {
      const encounters = [
        makeEncounter([makeObs('concept-1', { uuid: 'u', display: '72' })]),
      ];
      expect(getObsNumericValue(encounters, 'concept-1')).toBe(72);
    });

    it('should return null for non-numeric string', () => {
      const encounters = [makeEncounter([makeObs('concept-1', 'abc')])];
      expect(getObsNumericValue(encounters, 'concept-1')).toBeNull();
    });

    it('should return null when concept not found', () => {
      const encounters = [makeEncounter([makeObs('concept-1', '10')])];
      expect(getObsNumericValue(encounters, 'concept-999')).toBeNull();
    });

    it('should return null for empty encounters', () => {
      expect(getObsNumericValue([], 'concept-1')).toBeNull();
    });
  });

  describe('extractDetailsFromHtml', () => {
    it('should extract label-value pairs from bullet-point HTML', () => {
      const html =
        '<b>Pain</b>: <br/>• Site - Upper (R) - Right Hypochondrium.<br/>• Onset - Rapidly increasing.';
      const details = extractDetailsFromHtml(html);
      expect(details).toEqual([
        { label: 'Site', value: 'Upper (R) - Right Hypochondrium' },
        { label: 'Onset', value: 'Rapidly increasing' },
      ]);
    });

    it('should return empty array for HTML without bullets', () => {
      expect(extractDetailsFromHtml('<b>No details</b>')).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(extractDetailsFromHtml('')).toEqual([]);
    });
  });

  describe('extractChiefComplaints', () => {
    it('should extract chief complaints from encounters', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, 'Abdominal pain'),
        ]),
      ];
      const result = extractChiefComplaints(encounters);
      expect(result.chiefComplaints).toEqual(['Abdominal pain']);
    });

    it('should parse JSON chief complaint value', () => {
      const jsonValue = JSON.stringify({
        en: '<b>Fever</b>: <br/>• Duration - 3 days.',
      });
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, jsonValue)]),
      ];
      const result = extractChiefComplaints(encounters);
      expect(result.chiefComplaints).toEqual(['Fever']);
      expect(result.details).toEqual([{ label: 'Duration', value: '3 days' }]);
    });

    it('should return "No information" when no complaints found', () => {
      const result = extractChiefComplaints([makeEncounter()]);
      expect(result.chiefComplaints).toEqual(['No information']);
      expect(result.details).toEqual([]);
    });

    it('should deduplicate complaint names', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, 'Fever'),
          makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, 'Fever'),
        ]),
      ];
      const result = extractChiefComplaints(encounters);
      expect(result.chiefComplaints).toEqual(['Fever']);
    });
  });

  describe('extractPhysicalExamination', () => {
    it('should parse JSON physical exam obs', () => {
      const jsonValue = JSON.stringify({ Eyes: 'Normal', Arm: 'Swollen' });
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.PHYSICAL_EXAMINATION, jsonValue)]),
      ];
      const result = extractPhysicalExamination(encounters);
      expect(result.generalExams).toEqual([
        { label: 'Eyes', value: 'Normal' },
        { label: 'Arm', value: 'Swollen' },
      ]);
    });

    it('should handle non-JSON physical exam obs as raw text', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.PHYSICAL_EXAMINATION, 'General exam notes'),
        ]),
      ];
      const result = extractPhysicalExamination(encounters);
      expect(result.generalExams).toEqual([
        { label: 'concept-display', value: 'General exam notes' },
      ]);
    });

    it('should return fallback when no physical exam data', () => {
      const result = extractPhysicalExamination([makeEncounter()]);
      expect(result.generalExams).toEqual([
        { label: 'No information', value: 'No physical examination data' },
      ]);
    });
  });

  describe('transformVisitSummaryResponse', () => {
    it('should transform patient name from preferredName', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.patient.name).toBe('John Doe');
    });

    it('should fall back to patient display when preferredName is absent', () => {
      const response = makeResponse();
      (response.patient.person as Record<string, unknown>).preferredName = null;
      const result = transformVisitSummaryResponse(response);
      expect(result.patient.name).toBe('John Doe');
    });

    it('should map gender M to Male', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.patient.gender).toBe('Male');
    });

    it('should map gender F to Female', () => {
      const response = makeResponse();
      response.patient.person.gender = 'F';
      const result = transformVisitSummaryResponse(response);
      expect(result.patient.gender).toBe('Female');
    });

    it('should format age with Years suffix', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.patient.age).toBe('30 Years');
    });

    it('should extract patient identifier', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.patient.id).toBe('ABC-123');
    });

    it('should truncate visit UUID for visitId', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.patient.visitId).toBe('12345678');
    });

    it('should include full visit UUID as visitUuid', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.visitUuid).toBe('visit-uuid-12345678');
    });

    it('should show "No information" for missing phone', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.patient.phoneNumber).toBe('No information');
    });

    it('should extract phone from patient person attributes', () => {
      const response = makeResponse();
      response.patient.person.attributes = [
        {
          uuid: 'attr-uuid',
          display: 'Telephone Number = 9876543210',
          attributeType: { uuid: 'at-uuid', display: 'Telephone Number' },
          value: '9876543210',
        },
      ];
      const result = transformVisitSummaryResponse(response);
      expect(result.patient.phoneNumber).toBe('+91 9876543210');
    });

    it('should extract CHW worker from encounter provider', () => {
      const response = makeResponse({
        encounters: [makeEncounter([], 'Kiran Devi')],
      });
      const result = transformVisitSummaryResponse(response);
      expect(result.patient.chwWorker).toBe('Kiran Devi');
    });

    it('should return "Unknown" when no provider found', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.patient.chwWorker).toBe('Unknown');
    });

    it('should set null vitals with "No information" note for spo2 and respiratory rate', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.vitals.spo2.value).toBeNull();
      expect(result.vitals.spo2.note).toBe('No information');
      expect(result.vitals.respiratoryRate.value).toBeNull();
      expect(result.vitals.respiratoryRate.note).toBe('No information');
    });

    it('should set 0 for missing BP values', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.vitals.bp.systolic).toBe(0);
      expect(result.vitals.bp.diastolic).toBe(0);
    });

    it('should format birthdate', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.patient.dateOfBirth).toContain('1996');
    });

    it('should return "Unknown" when birthdate is absent', () => {
      const response = makeResponse();
      (response.patient.person as Record<string, unknown>).birthdate = null;
      const result = transformVisitSummaryResponse(response);
      expect(result.patient.dateOfBirth).toBe('Unknown');
    });

    it('should extract phone when attribute type contains "phone"', () => {
      const response = makeResponse();
      response.patient.person.attributes = [
        {
          uuid: 'attr-uuid',
          display: 'Phone Number = 1234567890',
          attributeType: { uuid: 'at-uuid', display: 'Phone Number' },
          value: '1234567890',
        },
      ];
      const result = transformVisitSummaryResponse(response);
      expect(result.patient.phoneNumber).toBe('+91 1234567890');
    });

    it('should return empty identifier when no identifiers present', () => {
      const response = makeResponse();
      response.patient.identifiers = [];
      const result = transformVisitSummaryResponse(response);
      expect(result.patient.id).toBe('');
    });

    it('should not add "No information" note when spo2 has a value', () => {
      const response = makeResponse({
        encounters: [makeEncounter([makeObs(CONCEPT_UUIDS.SPO2, '98')])],
      });
      const result = transformVisitSummaryResponse(response);
      expect(result.vitals.spo2.value).toBe(98);
      expect(result.vitals.spo2.note).toBeUndefined();
    });

    it('should not add "No information" note when respiratory rate has a value', () => {
      const response = makeResponse({
        encounters: [
          makeEncounter([makeObs(CONCEPT_UUIDS.RESPIRATORY_RATE, '18')]),
        ],
      });
      const result = transformVisitSummaryResponse(response);
      expect(result.vitals.respiratoryRate.value).toBe(18);
      expect(result.vitals.respiratoryRate.note).toBeUndefined();
    });
  });

  describe('extractChiefComplaints edge cases', () => {
    it('should parse JSON with l-en key', () => {
      const jsonValue = JSON.stringify({ 'l-en': '<b>Cough</b>: dry cough' });
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, jsonValue)]),
      ];
      const result = extractChiefComplaints(encounters);
      expect(result.chiefComplaints).toEqual(['Cough']);
    });

    it('should handle JSON with empty en and l-en', () => {
      const jsonValue = JSON.stringify({ other: 'data' });
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, jsonValue)]),
      ];
      const result = extractChiefComplaints(encounters);
      // Falls back to the original JSON string as name
      expect(result.chiefComplaints.length).toBe(1);
    });

    it('should handle plain text complaint without HTML', () => {
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, 'Headache')]),
      ];
      const result = extractChiefComplaints(encounters);
      expect(result.chiefComplaints).toEqual(['Headache']);
    });

    it('should handle object obs value for chief complaint', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, {
            uuid: 'val-uuid',
            display: 'Back pain',
          }),
        ]),
      ];
      const result = extractChiefComplaints(encounters);
      expect(result.chiefComplaints).toEqual(['Back pain']);
    });
  });

  describe('extractPhysicalExamination edge cases', () => {
    it('should handle object obs value for physical exam', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.PHYSICAL_EXAMINATION, {
            uuid: 'val-uuid',
            display: 'Normal findings',
          }),
        ]),
      ];
      const result = extractPhysicalExamination(encounters);
      expect(result.generalExams).toEqual([
        { label: 'concept-display', value: 'Normal findings' },
      ]);
    });

    it('should handle empty string physical exam obs', () => {
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.PHYSICAL_EXAMINATION, '')]),
      ];
      const result = extractPhysicalExamination(encounters);
      expect(result.generalExams).toEqual([
        { label: 'No information', value: 'No physical examination data' },
      ]);
    });
  });

  describe('getObsNumericValue edge cases', () => {
    it('should return numeric obs.value directly when type is number', () => {
      const encounters: VisitDetailsEncounter[] = [
        {
          uuid: 'enc-uuid',
          display: 'encounter',
          encounterDatetime: '2026-01-15T10:00:00.000+0000',
          encounterType: { uuid: 'et-uuid', display: 'ADULTINITIAL' },
          encounterProviders: [],
          obs: [
            {
              uuid: 'obs-uuid',
              display: 'obs-display',
              concept: { uuid: 'concept-1', display: 'concept' },
              value: 42 as unknown as string,
            },
          ],
        },
      ];
      expect(getObsNumericValue(encounters, 'concept-1')).toBe(42);
    });

    it('should return null when obs value is null-like object display', () => {
      const encounters = [
        makeEncounter([
          makeObs('concept-1', { uuid: 'u', display: undefined as unknown as string }),
        ]),
      ];
      expect(getObsNumericValue(encounters, 'concept-1')).toBeNull();
    });
  });

  describe('transformVisitSummaryResponse — null person branch', () => {
    it('should handle patient.person being null', () => {
      const response = makeResponse();
      (response.patient as unknown as Record<string, unknown>).person = null;
      const result = transformVisitSummaryResponse(response);
      // Line 172: person?.attributes ?? [] → empty → no phone
      expect(result.patient.phoneNumber).toBe('No information');
      // Line 195-197: person?.preferredName falsy → patient.display
      expect(result.patient.name).toBe('John Doe');
      // Line 199: person?.gender undefined → not 'M' → Female
      expect(result.patient.gender).toBe('Female');
      // Line 200: person?.age ?? 0
      expect(result.patient.age).toBe('0 Years');
      // Line 201: person?.birthdate falsy → Unknown
      expect(result.patient.dateOfBirth).toBe('Unknown');
    });

    it('should return empty name when person and display are both absent', () => {
      const response = makeResponse();
      (response.patient as unknown as Record<string, unknown>).person = null;
      (response.patient as unknown as Record<string, unknown>).display = undefined;
      const result = transformVisitSummaryResponse(response);
      // Line 197: patient.display ?? '' → ''
      expect(result.patient.name).toBe('');
    });
  });

  describe('extractChiefComplaints — catch block fallback', () => {
    it('should use value as name when extractNameFromHtml returns empty in catch block', () => {
      // Non-JSON HTML with only tags, no text content → extractNameFromHtml returns '' → falls back to value
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, '<span></span>'),
        ]),
      ];
      const result = extractChiefComplaints(encounters);
      // extractNameFromHtml('<span></span>') → no <b> match → replace removes tags → '' → || value → '<span></span>'
      expect(result.chiefComplaints).toEqual(['<span></span>']);
    });

    it('should extract name from non-JSON HTML with <b> tags in catch block', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, '<b>Migraine</b>: severe'),
        ]),
      ];
      const result = extractChiefComplaints(encounters);
      expect(result.chiefComplaints).toEqual(['Migraine']);
    });
  });

  describe('extractChiefComplaints — object obs with missing display', () => {
    it('should fall back to empty string when object obs display is undefined', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, {
            uuid: 'val-uuid',
            display: undefined as unknown as string,
          }),
        ]),
      ];
      const result = extractChiefComplaints(encounters);
      // obs.value?.display → undefined → ?? '' → parseChiefComplaintValue('')
      // JSON.parse('') throws → catch → extractNameFromHtml('') → '' → || '' → ''
      // empty name → not pushed → falls to 'No information'
      expect(result.chiefComplaints).toEqual(['No information']);
    });
  });

  describe('extractPhysicalExamination — object obs with missing display', () => {
    it('should fall back to empty string when object obs display is undefined', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.PHYSICAL_EXAMINATION, {
            uuid: 'val-uuid',
            display: undefined as unknown as string,
          }),
        ]),
      ];
      const result = extractPhysicalExamination(encounters);
      // obs.value?.display → undefined → ?? '' → empty raw
      // JSON.parse('') throws → catch → raw is '' → falsy → not pushed
      // Falls to default
      expect(result.generalExams).toEqual([
        { label: 'No information', value: 'No physical examination data' },
      ]);
    });

    it('should use "Exam" fallback when concept display is absent', () => {
      const encounters: VisitDetailsEncounter[] = [
        {
          uuid: 'enc-uuid',
          display: 'encounter',
          encounterDatetime: '2026-01-15T10:00:00.000+0000',
          encounterType: { uuid: 'et-uuid', display: 'ADULTINITIAL' },
          encounterProviders: [],
          obs: [
            {
              uuid: 'obs-uuid',
              display: 'obs-display',
              concept: {
                uuid: CONCEPT_UUIDS.PHYSICAL_EXAMINATION,
                display: undefined as unknown as string,
              },
              value: 'Some raw exam text',
            },
          ],
        },
      ];
      const result = extractPhysicalExamination(encounters);
      expect(result.generalExams).toEqual([
        { label: 'Exam', value: 'Some raw exam text' },
      ]);
    });
  });

  describe('getChwWorker — provider.person fallback', () => {
    it('should fall back to provider.display when provider.person is null', () => {
      const response = makeResponse({
        encounters: [
          {
            uuid: 'enc-uuid',
            display: 'encounter',
            encounterDatetime: '2026-01-15T10:00:00.000+0000',
            encounterType: { uuid: 'et-uuid', display: 'ADULTINITIAL' },
            encounterProviders: [
              {
                uuid: 'ep-uuid',
                display: 'Dr. Smith',
                provider: {
                  uuid: 'prov-uuid',
                  display: 'Dr. Smith',
                  person: null as unknown as { uuid: string; display: string },
                  attributes: [],
                },
              },
            ],
            obs: [],
          },
        ],
      });
      const result = transformVisitSummaryResponse(response);
      expect(result.patient.chwWorker).toBe('Dr. Smith');
    });

    it('should return "Unknown" when provider.person and provider.display are absent', () => {
      const response = makeResponse({
        encounters: [
          {
            uuid: 'enc-uuid',
            display: 'encounter',
            encounterDatetime: '2026-01-15T10:00:00.000+0000',
            encounterType: { uuid: 'et-uuid', display: 'ADULTINITIAL' },
            encounterProviders: [
              {
                uuid: 'ep-uuid',
                display: 'provider',
                provider: {
                  uuid: 'prov-uuid',
                  display: undefined as unknown as string,
                  person: null as unknown as { uuid: string; display: string },
                  attributes: [],
                },
              },
            ],
            obs: [],
          },
        ],
      });
      const result = transformVisitSummaryResponse(response);
      expect(result.patient.chwWorker).toBe('Unknown');
    });
  });

  describe('extractDetailsFromHtml — fallback line-by-line parser', () => {
    it('should parse colon-separated items from <br> delimited HTML', () => {
      const html = '<b>General exams: </b><br/>? Eyes: Jaundice<br/>? Arm: Swollen';
      const result = extractDetailsFromHtml(html);
      expect(result).toEqual([
        { label: 'Eyes', value: 'Jaundice' },
        { label: 'Arm', value: 'Swollen' },
      ]);
    });

    it('should parse dash-separated items from <br> delimited HTML', () => {
      const html = '? In-person consultation.<br/>? Arm-Pinch skin*<br/>';
      const result = extractDetailsFromHtml(html);
      expect(result).toEqual([
        { label: 'In', value: 'person consultation' },
        { label: 'Arm', value: 'Pinch skin*' },
      ]);
    });

    it('should strip trailing dots and dashes from values', () => {
      const html = '? Eyes: Jaundice-<br/>? Ankle--<br/>';
      const result = extractDetailsFromHtml(html);
      expect(result[0].value).toBe('Jaundice');
      expect(result[1].label).toBe('Ankle');
      expect(result[1].value).toBe('No information');
    });

    it('should skip header lines ending with colon', () => {
      const html = '<b>General exams: </b><br/>? Eyes: Normal<br/>';
      const result = extractDetailsFromHtml(html);
      expect(result).toEqual([{ label: 'Eyes', value: 'Normal' }]);
    });

    it('should handle single value items with no separator', () => {
      const html = '? Some finding<br/>';
      const result = extractDetailsFromHtml(html);
      expect(result).toEqual([{ label: 'Some finding', value: 'No information' }]);
    });

    it('should skip lines that are only non-word characters after cleaning', () => {
      const html = '? •••<br/>? Eyes: Normal<br/>';
      const result = extractDetailsFromHtml(html);
      expect(result).toEqual([{ label: 'Eyes', value: 'Normal' }]);
    });

    it('should not activate fallback when no <br> tags present', () => {
      expect(extractDetailsFromHtml('plain text')).toEqual([]);
    });

    it('should skip empty lines after splitting', () => {
      const html = '<br/><br/>? Eyes: Normal<br/><br/>';
      const result = extractDetailsFromHtml(html);
      expect(result).toEqual([{ label: 'Eyes', value: 'Normal' }]);
    });

    it('should use "No information" when colon value is empty after stripping', () => {
      const html = '? Label: ...<br/>';
      const result = extractDetailsFromHtml(html);
      expect(result).toEqual([{ label: 'Label', value: 'No information' }]);
    });
  });

  describe('extractChiefComplaints — associated symptoms', () => {
    it('should separate associated symptoms from details', () => {
      const html = '<b>Fever</b>: <br/>• Duration - 3 days.<br/>• Patient reports - Chills.<br/>• Patient denies - Nausea.';
      const jsonValue = JSON.stringify({ en: html });
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, jsonValue)]),
      ];
      const result = extractChiefComplaints(encounters);
      expect(result.details).toEqual([{ label: 'Duration', value: '3 days' }]);
      expect(result.associatedSymptoms).toEqual([
        { heading: 'Patient reports', values: ['Chills'] },
        { heading: 'Patient denies', values: ['Nausea'] },
      ]);
    });

    it('should not include associatedSymptoms when none exist', () => {
      const html = '<b>Cough</b>: <br/>• Duration - 2 days.';
      const jsonValue = JSON.stringify({ en: html });
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, jsonValue)]),
      ];
      const result = extractChiefComplaints(encounters);
      expect(result.associatedSymptoms).toBeUndefined();
    });

    it('should handle numeric obs value for chief complaint', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.CHIEF_COMPLAINT, 12345 as unknown as string),
        ]),
      ];
      const result = extractChiefComplaints(encounters);
      expect(result.chiefComplaints).toEqual(['12345']);
    });
  });

  describe('extractPhysicalExamination — en/l-en JSON format', () => {
    it('should parse HTML from en key in JSON', () => {
      const jsonValue = JSON.stringify({
        en: '• Eyes - Normal.<br/>• Arm - Swollen.',
      });
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.PHYSICAL_EXAM_DISPLAY, jsonValue)]),
      ];
      const result = extractPhysicalExamination(encounters);
      expect(result.generalExams).toEqual([
        { label: 'Eyes', value: 'Normal' },
        { label: 'Arm', value: 'Swollen' },
      ]);
    });

    it('should fallback to l-en key when en is absent', () => {
      const jsonValue = JSON.stringify({
        'l-en': '• Eyes - Normal.',
      });
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.PHYSICAL_EXAMINATION, jsonValue)]),
      ];
      const result = extractPhysicalExamination(encounters);
      expect(result.generalExams).toEqual([{ label: 'Eyes', value: 'Normal' }]);
    });

    it('should handle numeric obs value for physical exam', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.PHYSICAL_EXAMINATION, 99 as unknown as string),
        ]),
      ];
      const result = extractPhysicalExamination(encounters);
      // JSON.parse('99') succeeds but returns a number (not an object), so nothing is pushed
      expect(result.generalExams).toEqual([
        { label: 'No information', value: 'No physical examination data' },
      ]);
    });

    it('should handle non-JSON raw text with bullet details', () => {
      const html = '• Eyes - Normal.<br/>• Arm - Swollen.';
      const encounters = [
        makeEncounter([makeObs(CONCEPT_UUIDS.PHYSICAL_EXAMINATION, html)]),
      ];
      const result = extractPhysicalExamination(encounters);
      expect(result.generalExams).toEqual([
        { label: 'Eyes', value: 'Normal' },
        { label: 'Arm', value: 'Swollen' },
      ]);
    });

    it('should also match PHYSICAL_EXAM_DISPLAY concept UUID', () => {
      const encounters = [
        makeEncounter([
          makeObs(CONCEPT_UUIDS.PHYSICAL_EXAM_DISPLAY, 'Some exam text'),
        ]),
      ];
      const result = extractPhysicalExamination(encounters);
      expect(result.generalExams).toEqual([
        { label: 'concept-display', value: 'Some exam text' },
      ]);
    });
  });

  describe('extractMedicalHistory', () => {
    const MEDICAL_HISTORY_UUID = '62bff84b-795a-45ad-aae1-80e7f5163a82';
    const FAMILY_HISTORY_UUID = 'd63ae965-47fb-40e8-8f08-1f46a8a60b2b';

    it('should return empty array when no history obs found', () => {
      const result = extractMedicalHistory([makeEncounter()]);
      expect(result).toEqual([]);
    });

    it('should parse JSON-wrapped patient history with bullet format', () => {
      const jsonValue = JSON.stringify({
        en: '• Diabetes - Type 2.<br/>• Hypertension - Controlled.',
      });
      const encounters = [
        makeEncounter([makeObs(MEDICAL_HISTORY_UUID, jsonValue)]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([
        {
          title: 'Patient History',
          details: [
            { label: 'Diabetes', value: 'Type 2' },
            { label: 'Hypertension', value: 'Controlled' },
          ],
        },
      ]);
    });

    it('should filter out "None" entries from patient history', () => {
      const jsonValue = JSON.stringify({
        en: '• Medical History - None.',
      });
      const encounters = [
        makeEncounter([makeObs(MEDICAL_HISTORY_UUID, jsonValue)]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([]);
    });

    it('should parse family history with "Question : • items" format', () => {
      const jsonValue = JSON.stringify({
        en: 'Do you have a family history of any of the following? : • Diabetes (Father), Hypertension (Mother).',
      });
      const encounters = [
        makeEncounter([makeObs(FAMILY_HISTORY_UUID, jsonValue)]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([
        {
          title: 'Family History',
          details: [
            { label: 'Diabetes', value: 'Father' },
            { label: 'Hypertension', value: 'Mother' },
          ],
        },
      ]);
    });

    it('should skip family history when content is "None"', () => {
      const jsonValue = JSON.stringify({
        en: 'Do you have a family history of any of the following? : • None.',
      });
      const encounters = [
        makeEncounter([makeObs(FAMILY_HISTORY_UUID, jsonValue)]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([]);
    });

    it('should handle family history items without relation parentheses', () => {
      const jsonValue = JSON.stringify({
        en: 'Family history : • Diabetes, Asthma.',
      });
      const encounters = [
        makeEncounter([makeObs(FAMILY_HISTORY_UUID, jsonValue)]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([
        {
          title: 'Family History',
          details: [
            { label: 'Diabetes', value: '' },
            { label: 'Asthma', value: '' },
          ],
        },
      ]);
    });

    it('should handle non-JSON obs values', () => {
      const encounters = [
        makeEncounter([
          makeObs(MEDICAL_HISTORY_UUID, '• Asthma - Childhood onset.'),
        ]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([
        {
          title: 'Patient History',
          details: [{ label: 'Asthma', value: 'Childhood onset' }],
        },
      ]);
    });

    it('should handle numeric obs value for medical history', () => {
      const encounters = [
        makeEncounter([
          makeObs(MEDICAL_HISTORY_UUID, 42 as unknown as string),
        ]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([]);
    });

    it('should handle object obs value for medical history', () => {
      const encounters = [
        makeEncounter([
          makeObs(MEDICAL_HISTORY_UUID, { uuid: 'u', display: '• Asthma - Mild.' }),
        ]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([
        {
          title: 'Patient History',
          details: [{ label: 'Asthma', value: 'Mild' }],
        },
      ]);
    });

    it('should return both patient and family history sections', () => {
      const patJson = JSON.stringify({ en: '• Diabetes - Type 2.' });
      const famJson = JSON.stringify({
        en: 'Family : • Hypertension (Mother).',
      });
      const encounters = [
        makeEncounter([
          makeObs(MEDICAL_HISTORY_UUID, patJson),
          makeObs(FAMILY_HISTORY_UUID, famJson),
        ]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result.length).toBe(2);
      expect(result[0].title).toBe('Patient History');
      expect(result[1].title).toBe('Family History');
    });

    it('should use extractDetailsFromHtml when family history has bullet format with br tags', () => {
      const jsonValue = JSON.stringify({
        en: '• Diabetes - Father.<br/>• Hypertension - Mother.',
      });
      const encounters = [
        makeEncounter([makeObs(FAMILY_HISTORY_UUID, jsonValue)]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([
        {
          title: 'Family History',
          details: [
            { label: 'Diabetes', value: 'Father' },
            { label: 'Hypertension', value: 'Mother' },
          ],
        },
      ]);
    });

    it('should handle family history with no bullet character', () => {
      const jsonValue = JSON.stringify({ en: 'No relevant family history' });
      const encounters = [
        makeEncounter([makeObs(FAMILY_HISTORY_UUID, jsonValue)]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([]);
    });

    it('should handle object obs value with undefined display for medical history', () => {
      const encounters = [
        makeEncounter([
          makeObs(MEDICAL_HISTORY_UUID, { uuid: 'u', display: undefined as unknown as string }),
        ]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([]);
    });

    it('should handle JSON with neither en nor l-en in resolveObsHtml', () => {
      const jsonValue = JSON.stringify({ other: 'value' });
      const encounters = [
        makeEncounter([makeObs(MEDICAL_HISTORY_UUID, jsonValue)]),
      ];
      const result = extractMedicalHistory(encounters);
      // resolveObsHtml returns original string since neither en nor l-en exist
      // extractDetailsFromHtml on the JSON string returns empty (no bullets/br tags)
      expect(result).toEqual([]);
    });

    it('should use l-en key when en is absent in JSON', () => {
      const jsonValue = JSON.stringify({
        'l-en': '• Asthma - Chronic.',
      });
      const encounters = [
        makeEncounter([makeObs(MEDICAL_HISTORY_UUID, jsonValue)]),
      ];
      const result = extractMedicalHistory(encounters);
      expect(result).toEqual([
        {
          title: 'Patient History',
          details: [{ label: 'Asthma', value: 'Chronic' }],
        },
      ]);
    });
  });

  describe('transformVisitSummaryResponse — speciality and priorityVisit', () => {
    it('should extract speciality from visit attributes', () => {
      const response = makeResponse({
        attributes: [
          {
            uuid: 'attr-uuid',
            display: 'Speciality',
            attributeType: {
              uuid: '3f296939-c6d3-4d2e-b8ca-d7f4bfd42c2d',
              display: 'Speciality',
            },
            value: 'Cardiology',
          },
        ],
      });
      const result = transformVisitSummaryResponse(response);
      expect(result.speciality).toBe('Cardiology');
    });

    it('should return undefined when no speciality attribute', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.speciality).toBeUndefined();
    });

    it('should detect priority visit from encounter type', () => {
      const response = makeResponse({
        encounters: [
          {
            uuid: 'enc-uuid',
            display: 'Priority',
            encounterDatetime: '2026-01-15T10:00:00.000+0000',
            encounterType: {
              uuid: 'ca5f5dc3-4f0b-4097-9cae-5cf2eb44a09c',
              display: 'PRIORITY',
            },
            encounterProviders: [],
            obs: [],
          },
        ],
      });
      const result = transformVisitSummaryResponse(response);
      expect(result.priorityVisit).toBe(true);
    });

    it('should return false for priorityVisit when no priority encounter', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.priorityVisit).toBe(false);
    });

    it('should include medicalHistory when history obs are present', () => {
      const response = makeResponse({
        encounters: [
          makeEncounter([
            makeObs('62bff84b-795a-45ad-aae1-80e7f5163a82', '• Diabetes - Type 2.'),
          ]),
        ],
      });
      const result = transformVisitSummaryResponse(response);
      expect(result.medicalHistory).toBeDefined();
      expect(result.medicalHistory!.length).toBeGreaterThan(0);
      expect(result.medicalHistory![0].title).toBe('Patient History');
    });

    it('should return undefined medicalHistory when no history obs present', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.medicalHistory).toBeUndefined();
    });

    it('should extract doctorNotes from visit attributes', () => {
      const response = makeResponse({
        attributes: [
          {
            uuid: 'attr-uuid',
            display: 'Doctor Notes',
            attributeType: {
              uuid: '64aa50c8-e913-48c6-b8ad-dfa0bccb202b',
              display: 'Doctor Notes',
            },
            value: 'Patient should follow up in 2 weeks',
          },
        ],
      });
      const result = transformVisitSummaryResponse(response);
      expect(result.doctorNotes).toBe('Patient should follow up in 2 weeks');
    });

    it('should return undefined doctorNotes when no notes attribute exists', () => {
      const result = transformVisitSummaryResponse(makeResponse());
      expect(result.doctorNotes).toBeUndefined();
    });

    it('should return undefined doctorNotes when notes attribute has empty value', () => {
      const response = makeResponse({
        attributes: [
          {
            uuid: 'attr-uuid',
            display: 'Doctor Notes',
            attributeType: {
              uuid: '64aa50c8-e913-48c6-b8ad-dfa0bccb202b',
              display: 'Doctor Notes',
            },
            value: '',
          },
        ],
      });
      const result = transformVisitSummaryResponse(response);
      expect(result.doctorNotes).toBeUndefined();
    });
  });

  describe('transformObsToDocuments', () => {
    it('should filter documents by visit UUID', () => {
      const results = [
        {
          uuid: 'obs-1',
          comment: 'report.pdf',
          value: { display: 'file', links: { rel: 'self', uri: 'http://example.com/obs/1/value' } },
          encounter: { visit: { uuid: 'visit-123' } },
        },
        {
          uuid: 'obs-2',
          comment: 'other.pdf',
          value: { display: 'file', links: { rel: 'self', uri: 'http://example.com/obs/2/value' } },
          encounter: { visit: { uuid: 'different-visit' } },
        },
      ];
      const docs = transformObsToDocuments(results, 'visit-123');
      expect(docs).toHaveLength(1);
      expect(docs[0].name).toBe('report.pdf');
    });

    it('should identify image files correctly', () => {
      const results = [
        {
          uuid: 'obs-1',
          comment: 'photo.jpg',
          value: { display: 'file', links: { rel: 'self', uri: 'http://example.com/obs/1' } },
          encounter: { visit: { uuid: 'visit-1' } },
        },
        {
          uuid: 'obs-2',
          comment: 'document.pdf',
          value: { display: 'file', links: { rel: 'self', uri: 'http://example.com/obs/2' } },
          encounter: { visit: { uuid: 'visit-1' } },
        },
      ];
      const docs = transformObsToDocuments(results, 'visit-1');
      expect(docs[0].isImage).toBe(true);
      expect(docs[1].isImage).toBe(false);
    });

    it('should recognize all image extensions', () => {
      const extensions = ['photo.jpg', 'img.jpeg', 'pic.png', 'anim.gif', 'modern.webp'];
      const results = extensions.map((name, i) => ({
        uuid: `obs-${i}`,
        comment: name,
        value: { display: 'file', links: { rel: 'self', uri: `http://example.com/${i}` } },
        encounter: { visit: { uuid: 'v1' } },
      }));
      const docs = transformObsToDocuments(results, 'v1');
      docs.forEach(doc => expect(doc.isImage).toBe(true));
    });

    it('should handle missing comment with fallback name', () => {
      const results = [
        {
          uuid: 'obs-1',
          comment: '',
          value: { display: 'file', links: { rel: 'self', uri: 'http://example.com' } },
          encounter: { visit: { uuid: 'visit-1' } },
        },
      ];
      const docs = transformObsToDocuments(results, 'visit-1');
      expect(docs[0].name).toBe('Untitled document');
      expect(docs[0].isImage).toBe(false);
    });

    it('should handle null encounter gracefully', () => {
      const results = [
        {
          uuid: 'obs-1',
          comment: 'file.pdf',
          value: { display: 'file', links: { rel: 'self', uri: 'http://example.com' } },
          encounter: null,
        },
      ];
      const docs = transformObsToDocuments(results, 'visit-1');
      expect(docs).toHaveLength(0);
    });

    it('should return empty array for empty results', () => {
      const docs = transformObsToDocuments([], 'visit-1');
      expect(docs).toHaveLength(0);
    });

    it('should extract fileUrl from value.links.uri', () => {
      const results = [
        {
          uuid: 'obs-1',
          comment: 'file.pdf',
          value: { display: 'file', links: { rel: 'self', uri: 'http://server/obs/1/value' } },
          encounter: { visit: { uuid: 'v1' } },
        },
      ];
      const docs = transformObsToDocuments(results, 'v1');
      expect(docs[0].fileUrl).toBe('http://server/obs/1/value');
    });

    it('should return empty fileUrl when value.links is undefined', () => {
      const results = [
        {
          uuid: 'obs-1',
          comment: 'file.pdf',
          value: { display: 'file', links: undefined as unknown as { rel: string; uri: string } },
          encounter: { visit: { uuid: 'v1' } },
        },
      ];
      const docs = transformObsToDocuments(results, 'v1');
      expect(docs[0].fileUrl).toBe('');
    });
  });

  describe('getAdditionalDocuments', () => {
    it('should call OpenMRSApi.get with correct URL', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue({ results: [] });
      await visitSummaryService.getAdditionalDocuments('patient-uuid', 'visit-uuid');
      expect(OpenMRSApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/obs?patient=patient-uuid')
      );
      expect(OpenMRSApi.get).toHaveBeenCalledWith(
        expect.stringContaining('concept=07a816ce-ffc0-49b9-ad92-a1bf9bf5e2ba')
      );
    });

    it('should return transformed documents filtered by visit UUID', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue({
        results: [
          {
            uuid: 'obs-1',
            comment: 'test.jpg',
            value: { display: 'file', links: { rel: 'self', uri: 'http://example.com/obs/1' } },
            encounter: { visit: { uuid: 'visit-uuid' } },
          },
          {
            uuid: 'obs-2',
            comment: 'other.pdf',
            value: { display: 'file', links: { rel: 'self', uri: 'http://example.com/obs/2' } },
            encounter: { visit: { uuid: 'other-visit' } },
          },
        ],
      });
      const docs = await visitSummaryService.getAdditionalDocuments('patient-uuid', 'visit-uuid');
      expect(docs).toHaveLength(1);
      expect(docs[0].name).toBe('test.jpg');
      expect(docs[0].isImage).toBe(true);
    });

    it('should handle undefined results in response', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue({});
      const docs = await visitSummaryService.getAdditionalDocuments('patient-uuid', 'visit-uuid');
      expect(docs).toHaveLength(0);
    });
  });
});
