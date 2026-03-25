import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  visitSummaryService,
  API_ENDPOINTS,
  CONCEPT_UUIDS,
  getObsNumericValue,
  extractDetailsFromHtml,
  extractChiefComplaints,
  extractPhysicalExamination,
  transformVisitSummaryResponse,
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
      (response.patient as Record<string, unknown>).person = null;
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
      (response.patient as Record<string, unknown>).person = null;
      (response.patient as Record<string, unknown>).display = undefined;
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
});
