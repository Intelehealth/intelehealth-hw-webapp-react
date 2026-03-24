import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock('../../../services/openmrs', () => ({
  OpenMRSApi: { get: mockGet },
}));

import { prescriptionDetailService, API_ENDPOINTS } from '../../../modules/prescription-detail/prescription-detail.service';
import type { VisitDetailsResponse } from '../../../modules/visit-details/visit-details.types';

/* ── Helpers ── */

function buildVisitResponse(overrides: Partial<VisitDetailsResponse> = {}): VisitDetailsResponse {
  return {
    uuid: 'visit-abc-123',
    display: 'Test Visit',
    startDatetime: '2026-01-27T10:31:00.000+0000',
    stopDatetime: null,
    patient: {
      uuid: 'patient-1',
      display: 'Test S',
      person: {
        uuid: 'person-1',
        display: 'Test S',
        gender: 'M',
        age: 19,
        birthdate: '2007-01-01',
        preferredName: {
          uuid: 'name-1',
          display: 'Test S',
          givenName: 'Test',
          familyName: 'S',
        },
        attributes: [],
      },
      identifiers: [
        {
          uuid: 'id-1',
          display: '163KG-9',
          identifier: '163KG-9',
          identifierType: { uuid: 'type-1', display: 'OpenMRS ID' },
        },
      ],
    },
    encounters: [
      {
        uuid: 'enc-1',
        display: 'Visit Complete',
        encounterDatetime: '2026-01-27T11:00:00.000+0000',
        encounterType: { uuid: 'et-1', display: 'Visit Complete' },
        encounterProviders: [
          {
            uuid: 'ep-1',
            display: 'Dr. Rohith',
            provider: {
              uuid: 'prov-1',
              display: 'Rohith M S',
              person: { uuid: 'pp-1', display: 'Rohith M S' },
              attributes: [
                {
                  uuid: 'attr-1',
                  display: 'Qualification: MBBS, MD',
                  attributeType: { uuid: 'at-1', display: 'Qualification' },
                  value: 'MBBS, MD',
                },
              ],
            },
          },
        ],
        obs: [
          {
            uuid: 'obs-diag',
            display: 'Telemedicine Diagnosis: Scabies',
            concept: { uuid: 'c-diag', display: 'Telemedicine Diagnosis' },
            value: 'Scabies',
          },
          {
            uuid: 'obs-med',
            display: 'JSV Medications',
            concept: { uuid: 'c-med', display: 'JSV Medications' },
            value: JSON.stringify([
              { drug: 'Ambroxol', strength: '10 mg', frequency: '3 times/day', duration: '7 days' },
            ]),
          },
          {
            uuid: 'obs-advice',
            display: 'Medical Advice',
            concept: { uuid: 'c-advice', display: 'Medical Advice' },
            value: JSON.stringify(['Drink water', 'Take rest']),
          },
          {
            uuid: 'obs-test',
            display: 'Test Recommended',
            concept: { uuid: 'c-test', display: 'Test Recommended' },
            value: JSON.stringify(['CBC', 'LFT']),
          },
          {
            uuid: 'obs-ref',
            display: 'Referral',
            concept: { uuid: 'c-ref', display: 'Referral' },
            value: 'Dermatologist',
          },
          {
            uuid: 'obs-fu',
            display: 'Follow up visit',
            concept: { uuid: 'e8caffd6-5571-11e7-907b-a6006ad3dba0', display: 'Follow up visit' },
            value: '2026-02-03T00:00:00.000+0000',
          },
        ],
      },
    ],
    attributes: [],
    visitType: { uuid: 'vt-1', display: 'Telemedicine' },
    location: { uuid: 'loc-1', display: 'TM Clinic' },
    ...overrides,
  };
}

/* ── Tests ── */

describe('prescriptionDetailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API_ENDPOINTS', () => {
    it('should have correct VISIT endpoint', () => {
      expect(API_ENDPOINTS.VISIT).toBe('/visit');
    });
  });

  describe('getPrescriptionData', () => {
    it('should call OpenMRSApi.get with correct URL', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/visit/visit-abc-123?v=custom:')
      );
    });

    it('should transform patient name from preferredName', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.patientName).toBe('Test S');
    });

    it('should fall back to patient.display when preferredName is missing', async () => {
      const resp = buildVisitResponse();
      (resp.patient.person as any).preferredName = undefined;
      resp.patient.display = 'Fallback Name';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.patientName).toBe('Fallback Name');
    });

    it('should transform gender M to Male', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.gender).toBe('Male');
    });

    it('should transform gender F to Female', async () => {
      const resp = buildVisitResponse();
      resp.patient.person.gender = 'F';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.gender).toBe('Female');
    });

    it('should return age from patient.person', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.age).toBe(19);
    });

    it('should return patient identifier', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.patientIdentifier).toBe('163KG-9');
    });

    it('should return empty identifier when none exists', async () => {
      const resp = buildVisitResponse();
      resp.patient.identifiers = [];
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.patientIdentifier).toBe('');
    });

    it('should extract doctor name and qualification', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.doctorName).toBe('Rohith M S');
      expect(result.doctorQualification).toBe('MBBS, MD');
    });

    it('should return empty doctor info when no providers', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].encounterProviders = [];
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.doctorName).toBe('');
      expect(result.doctorQualification).toBe('');
    });

    it('should extract diagnosis from obs', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('Scabies');
    });

    it('should parse diagnosis from JSON with en key', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs[0].value = JSON.stringify({ en: 'Parsed Diagnosis' });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('Parsed Diagnosis');
    });

    it('should parse diagnosis from JSON with l-en key', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs[0].value = JSON.stringify({ 'l-en': 'L-EN Diagnosis' });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('L-EN Diagnosis');
    });

    it('should return raw diagnosis when JSON parse fails', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs[0].value = 'Plain text diagnosis';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('Plain text diagnosis');
    });

    it('should parse structured diagnosis format with Primary qualifier', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs[0].value = 'NA::PEURPERAL FEVER:Primary & Provisional';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('PEURPERAL FEVER');
    });

    it('should parse structured diagnosis format with Confirmed qualifier', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs[0].value = 'J06::UPPER RESPIRATORY INFECTION:Confirmed';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('UPPER RESPIRATORY INFECTION');
    });

    it('should parse structured diagnosis without qualifier', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs[0].value = 'A01::TYPHOID FEVER';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('TYPHOID FEVER');
    });

    it('should return empty diagnosis when no matching obs', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs = resp.encounters[0].obs.filter(
        o => !o.concept.display.toLowerCase().includes('diagnosis')
      );
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('');
    });

    it('should extract medications from JSON array', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications).toEqual([
        { name: 'Ambroxol', strength: '10 mg', frequency: '3 times/day', duration: '7 days' },
      ]);
    });

    it('should parse single medication object', async () => {
      const resp = buildVisitResponse();
      const medObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Medication'));
      medObs!.value = JSON.stringify({ drug: 'Single Med', strength: '5 mg', frequency: 'Once', duration: '3 days' });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications).toEqual([
        { name: 'Single Med', strength: '5 mg', frequency: 'Once', duration: '3 days' },
      ]);
    });

    it('should handle plain text medication value', async () => {
      const resp = buildVisitResponse();
      const medObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Medication'));
      medObs!.value = 'Paracetamol 500mg';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications).toEqual([
        { name: 'Paracetamol 500mg', strength: '', frequency: '', duration: '' },
      ]);
    });

    it('should return empty medications when no matching obs', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs = resp.encounters[0].obs.filter(
        o => !o.concept.display.toLowerCase().includes('medication')
      );
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications).toEqual([]);
    });

    it('should return empty medications for empty string obs value', async () => {
      const resp = buildVisitResponse();
      const medObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Medication'));
      medObs!.value = '';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications).toEqual([]);
    });

    it('should extract advice from JSON array', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.advice).toEqual(['Drink water', 'Take rest']);
    });

    it('should handle plain text advice', async () => {
      const resp = buildVisitResponse();
      const adviceObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Advice'));
      adviceObs!.value = 'Stay hydrated';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.advice).toEqual(['Stay hydrated']);
    });

    it('should return empty advice when no matching obs', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs = resp.encounters[0].obs.filter(
        o => !o.concept.display.toLowerCase().includes('advice')
      );
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.advice).toEqual([]);
    });

    it('should extract tests from JSON array', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.testsRecommended).toEqual(['CBC', 'LFT']);
    });

    it('should return empty tests when no matching obs', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs = resp.encounters[0].obs.filter(
        o => !o.concept.display.toLowerCase().includes('test')
      );
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.testsRecommended).toEqual([]);
    });

    it('should extract referred specialist', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.referredSpecialist).toBe('Dermatologist');
    });

    it('should return null referredSpecialist when no matching obs', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs = resp.encounters[0].obs.filter(
        o => !o.concept.display.toLowerCase().includes('refer')
      );
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.referredSpecialist).toBeNull();
    });

    it('should extract and format follow-up date by UUID', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.followUpDate).toBeTruthy();
      // Should be formatted date string
      expect(typeof result.followUpDate).toBe('string');
    });

    it('should return null followUpDate when no matching obs', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs = resp.encounters[0].obs.filter(
        o => o.concept.uuid !== 'e8caffd6-5571-11e7-907b-a6006ad3dba0' &&
             !o.concept.display.toLowerCase().includes('follow')
      );
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.followUpDate).toBeNull();
    });

    it('should use prescription encounter date for visitDate', async () => {
      mockGet.mockResolvedValue(buildVisitResponse());
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      // Should contain formatted date from Visit Complete encounter
      expect(result.visitDate).toBeTruthy();
      expect(typeof result.visitDate).toBe('string');
    });

    it('should fall back to startDatetime for visitDate when no prescription encounter', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].encounterType.display = 'Other Encounter';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.visitDate).toBeTruthy();
    });

    it('should handle obs value as object with display', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs[0].value = { uuid: 'val-1', display: 'Object Diagnosis' } as any;
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('Object Diagnosis');
    });

    it('should handle empty encounters', async () => {
      const resp = buildVisitResponse();
      resp.encounters = [];
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('');
      expect(result.medications).toEqual([]);
      expect(result.advice).toEqual([]);
      expect(result.testsRecommended).toEqual([]);
      expect(result.referredSpecialist).toBeNull();
      expect(result.followUpDate).toBeNull();
      expect(result.doctorName).toBe('');
    });

    it('should handle advice obs with JSON string value', async () => {
      const resp = buildVisitResponse();
      const adviceObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Advice'));
      adviceObs!.value = JSON.stringify('Single advice string');
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.advice).toEqual(['Single advice string']);
    });

    it('should handle advice obs with JSON containing en key', async () => {
      const resp = buildVisitResponse();
      const adviceObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Advice'));
      adviceObs!.value = JSON.stringify({ en: '<b>Advice</b> text' });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.advice).toEqual(['Advice text']);
    });

    it('should handle empty advice string', async () => {
      const resp = buildVisitResponse();
      const adviceObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Advice'));
      adviceObs!.value = '';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.advice).toEqual([]);
    });

    it('should return null referredSpecialist when obs value is empty string', async () => {
      const resp = buildVisitResponse();
      const refObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Referral'));
      refObs!.value = '';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.referredSpecialist).toBeNull();
    });

    it('should return null followUpDate when obs value is empty', async () => {
      const resp = buildVisitResponse();
      const fuObs = resp.encounters[0].obs.find(
        o => o.concept.uuid === 'e8caffd6-5571-11e7-907b-a6006ad3dba0'
      );
      fuObs!.value = '';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.followUpDate).toBeNull();
    });

    it('should match follow-up by display name when UUID does not match', async () => {
      const resp = buildVisitResponse();
      const fuObs = resp.encounters[0].obs.find(
        o => o.concept.uuid === 'e8caffd6-5571-11e7-907b-a6006ad3dba0'
      );
      fuObs!.concept.uuid = 'different-uuid';
      fuObs!.concept.display = 'Follow-up Date';
      fuObs!.value = '2026-03-01T00:00:00.000+0000';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.followUpDate).toBeTruthy();
    });

    it('should return null followUpDate for invalid date string', async () => {
      const resp = buildVisitResponse();
      const fuObs = resp.encounters[0].obs.find(
        o => o.concept.uuid === 'e8caffd6-5571-11e7-907b-a6006ad3dba0'
      );
      fuObs!.value = 'not-a-date';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.followUpDate).toBeNull();
    });

    it('should use provider display as fallback for doctor name', async () => {
      const resp = buildVisitResponse();
      (resp.encounters[0].encounterProviders[0].provider.person as any) = undefined;
      resp.encounters[0].encounterProviders[0].provider.display = 'Provider Display';
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.doctorName).toBe('Provider Display');
    });

    it('should default age to 0 when person.age is missing', async () => {
      const resp = buildVisitResponse();
      (resp.patient.person as any).age = undefined;
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.age).toBe(0);
    });

    it('should use medication alternative field names (name, dose, timing)', async () => {
      const resp = buildVisitResponse();
      const medObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Medication'));
      medObs!.value = JSON.stringify([
        { name: 'MedName', dose: '5 mg', timing: 'Twice daily', duration: '3 days' },
      ]);
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications[0]).toEqual({
        name: 'MedName',
        strength: '5 mg',
        frequency: 'Twice daily',
        duration: '3 days',
      });
    });

    it('should use medication medicine field as fallback', async () => {
      const resp = buildVisitResponse();
      const medObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Medication'));
      medObs!.value = JSON.stringify({ medicine: 'Aspirin', strength: '', frequency: '', duration: '' });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications[0].name).toBe('Aspirin');
    });

    it('should match concept display with "prescribed" for medications', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs = resp.encounters[0].obs.filter(
        o => !o.concept.display.toLowerCase().includes('medication')
      );
      resp.encounters[0].obs.push({
        uuid: 'obs-presc',
        display: 'Prescribed Medicine',
        concept: { uuid: 'c-presc', display: 'Prescribed Medicine' },
        value: JSON.stringify([{ drug: 'Aspirin', strength: '100mg', frequency: 'OD', duration: '5d' }]),
      });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications[0].name).toBe('Aspirin');
    });

    it('should match concept display with "investigation" for tests', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs = resp.encounters[0].obs.filter(
        o => !o.concept.display.toLowerCase().includes('test')
      );
      resp.encounters[0].obs.push({
        uuid: 'obs-inv',
        display: 'Investigation',
        concept: { uuid: 'c-inv', display: 'Investigation' },
        value: JSON.stringify(['Blood Test']),
      });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.testsRecommended).toEqual(['Blood Test']);
    });

    it('should match concept display with "drug order" for medications', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs = resp.encounters[0].obs.filter(
        o => !o.concept.display.toLowerCase().includes('medication')
      );
      resp.encounters[0].obs.push({
        uuid: 'obs-drug',
        display: 'Drug Order Entry',
        concept: { uuid: 'c-drug', display: 'Drug Order Entry' },
        value: JSON.stringify([{ drug: 'Ibuprofen', strength: '400mg', frequency: 'BD', duration: '5d' }]),
      });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications[0].name).toBe('Ibuprofen');
    });

    it('should match concept display with "special" for doctor qualification', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].encounterProviders[0].provider.attributes = [
        {
          uuid: 'attr-2',
          display: 'Speciality: Dermatology',
          attributeType: { uuid: 'at-2', display: 'Speciality' },
          value: 'Dermatology',
        },
      ];
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.doctorQualification).toBe('Dermatology');
    });

    it('should return empty qualification when no matching attribute', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].encounterProviders[0].provider.attributes = [
        {
          uuid: 'attr-3',
          display: 'Other: Value',
          attributeType: { uuid: 'at-3', display: 'Other' },
          value: 'SomeValue',
        },
      ];
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.doctorQualification).toBe('');
    });

    it('should handle obs with undefined concept display (matchesConcept)', async () => {
      const resp = buildVisitResponse();
      // Add an obs with undefined concept display
      resp.encounters[0].obs.push({
        uuid: 'obs-unknown',
        display: 'Unknown',
        concept: { uuid: 'c-unknown', display: undefined as any },
        value: 'some value',
      });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      // Should not crash and still return valid data
      expect(result.patientName).toBe('Test S');
    });

    it('should return empty doctor name when both person and provider display are undefined', async () => {
      const resp = buildVisitResponse();
      (resp.encounters[0].encounterProviders[0].provider.person as any) = undefined;
      (resp.encounters[0].encounterProviders[0].provider as any).display = undefined;
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.doctorName).toBe('');
    });

    it('should handle obs value as object with undefined display', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs[0].value = { uuid: 'val-1', display: undefined as any } as any;
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe('');
    });

    it('should return raw diagnosis when JSON has neither en nor l-en', async () => {
      const resp = buildVisitResponse();
      resp.encounters[0].obs[0].value = JSON.stringify({ other: 'value' });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.diagnosis).toBe(JSON.stringify({ other: 'value' }));
    });

    it('should handle medication array items with no recognizable name fields', async () => {
      const resp = buildVisitResponse();
      const medObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Medication'));
      medObs!.value = JSON.stringify([{ unknown: 'field' }]);
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications[0].name).toBe('');
      expect(result.medications[0].strength).toBe('');
    });

    it('should fall back to empty string when patient.display is also undefined', async () => {
      const resp = buildVisitResponse();
      (resp.patient.person as any).preferredName = undefined;
      (resp.patient as any).display = undefined;
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.patientName).toBe('');
    });

    it('should handle medications with missing duration field', async () => {
      const resp = buildVisitResponse();
      const medObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Medication'));
      medObs!.value = JSON.stringify([{ drug: 'Med' }]);
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications[0].duration).toBe('');
    });

    it('should handle single medication with no drug/name/medicine fields', async () => {
      const resp = buildVisitResponse();
      const medObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Medication'));
      medObs!.value = JSON.stringify({ other: 'unknown' });
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.medications[0].name).toBe('');
    });

    it('should handle parseListFromObs with JSON string that is empty after trim', async () => {
      const resp = buildVisitResponse();
      const adviceObs = resp.encounters[0].obs.find(o => o.concept.display.includes('Advice'));
      adviceObs!.value = JSON.stringify('   ');
      mockGet.mockResolvedValue(resp);
      const result = await prescriptionDetailService.getPrescriptionData('visit-abc-123');
      expect(result.advice).toEqual([]);
    });
  });
});
