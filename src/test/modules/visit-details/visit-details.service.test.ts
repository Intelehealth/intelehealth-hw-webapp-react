import { describe, expect, it, vi, beforeEach } from 'vitest';
import { visitDetailsService, API_ENDPOINTS } from '../../../modules/visit-details/visit-details.service';
import { OpenMRSApi } from '../../../services/openmrs';
import type { VisitDetailsResponse } from '../../../modules/visit-details/visit-details.types';

vi.mock('../../../services/openmrs', () => ({
  OpenMRSApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

/* ── helpers ── */

function makePatient(overrides?: Partial<VisitDetailsResponse['patient']>): VisitDetailsResponse['patient'] {
  return {
    uuid: 'patient-uuid-1',
    display: 'Patient Display',
    person: {
      uuid: 'person-uuid-1',
      display: 'Person Display',
      gender: 'M',
      age: 30,
      birthdate: '1996-01-01',
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
        display: 'OpenMRS ID = ABC-123',
        identifier: 'ABC-123',
        identifierType: { uuid: 'id-type-uuid', display: 'OpenMRS ID' },
      },
    ],
    ...overrides,
  };
}

function makeEncounter(overrides?: Record<string, unknown>): VisitDetailsResponse['encounters'][0] {
  return {
    uuid: 'enc-uuid',
    display: 'Encounter',
    encounterDatetime: '2026-01-27T10:31:00.000+0000',
    encounterType: { uuid: 'enc-type-uuid', display: 'ADULTINITIAL' },
    encounterProviders: [],
    obs: [],
    ...overrides,
  } as VisitDetailsResponse['encounters'][0];
}

function makeResponse(overrides?: Partial<VisitDetailsResponse>): VisitDetailsResponse {
  return {
    uuid: 'visit-uuid-12345678',
    display: 'Visit',
    patient: makePatient(),
    visitType: { uuid: 'vt-uuid', display: 'Facility Visit' },
    startDatetime: '2026-01-27T10:31:00.000+0000',
    stopDatetime: null,
    encounters: [],
    attributes: [],
    location: { uuid: 'loc-uuid', display: 'Location' },
    ...overrides,
  };
}

describe('visit-details service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ── API_ENDPOINTS ── */

  describe('API_ENDPOINTS', () => {
    it('should have VISIT endpoint', () => {
      expect(API_ENDPOINTS.VISIT).toBe('/visit');
    });
  });

  /* ── getVisitDetails ── */

  describe('getVisitDetails', () => {
    it('should call OpenMRSApi.get with correct URL', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse());
      await visitDetailsService.getVisitDetails('abc-123');
      expect(OpenMRSApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/visit/abc-123?v=custom:')
      );
    });

    it('should return transformed visit details', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse());
      const result = await visitDetailsService.getVisitDetails('abc-123');
      expect(result).toEqual(
        expect.objectContaining({
          visitUuid: 'visit-uuid-12345678',
          patientName: 'John Doe',
          gender: 'Male',
          age: 30,
          patientIdentifier: 'ABC-123',
          visitStatus: 'Active',
        })
      );
    });

    it('should propagate errors', async () => {
      vi.mocked(OpenMRSApi.get).mockRejectedValue(new Error('Network error'));
      await expect(visitDetailsService.getVisitDetails('x')).rejects.toThrow('Network error');
    });
  });

  /* ── endVisit ── */

  describe('endVisit', () => {
    it('should call OpenMRSApi.post with correct URL and payload', async () => {
      vi.mocked(OpenMRSApi.post).mockResolvedValue({});
      await visitDetailsService.endVisit('visit-uuid');
      expect(OpenMRSApi.post).toHaveBeenCalledWith(
        '/visit/visit-uuid',
        expect.objectContaining({ stopDatetime: expect.any(String) })
      );
    });

    it('should send a valid ISO date string', async () => {
      vi.mocked(OpenMRSApi.post).mockResolvedValue({});
      await visitDetailsService.endVisit('visit-uuid');
      const payload = vi.mocked(OpenMRSApi.post).mock.calls[0][1] as { stopDatetime: string };
      expect(new Date(payload.stopDatetime).toISOString()).toBe(payload.stopDatetime);
    });

    it('should return the API response', async () => {
      vi.mocked(OpenMRSApi.post).mockResolvedValue({ ok: true });
      const result = await visitDetailsService.endVisit('visit-uuid');
      expect(result).toEqual({ ok: true });
    });

    it('should propagate errors', async () => {
      vi.mocked(OpenMRSApi.post).mockRejectedValue(new Error('fail'));
      await expect(visitDetailsService.endVisit('x')).rejects.toThrow('fail');
    });
  });

  /* ── transformVisitResponse (tested via getVisitDetails) ── */

  describe('transformVisitResponse', () => {
    it('should derive visitId from last 8 chars of uuid', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ uuid: 'aaaa-bbbb-12345678' }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.visitId).toBe('12345678');
    });

    it('should use preferredName when available', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse());
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.patientName).toBe('John Doe');
    });

    it('should fall back to patient.display when preferredName is absent', async () => {
      const patient = makePatient({
        person: {
          uuid: 'p', display: 'Fallback', gender: 'F', age: 25, birthdate: '2001-01-01',
          preferredName: undefined as unknown as VisitDetailsResponse['patient']['person']['preferredName'],
          attributes: [],
        },
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ patient }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.patientName).toBe('Patient Display');
    });

    it('should fall back to empty string when both preferredName and patient.display are absent', async () => {
      const patient = makePatient({
        display: undefined as unknown as string,
        person: {
          uuid: 'p', display: 'Fallback', gender: 'M', age: 30, birthdate: '1996-01-01',
          preferredName: undefined as unknown as VisitDetailsResponse['patient']['person']['preferredName'],
          attributes: [],
        },
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ patient }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.patientName).toBe('');
    });

    it('should map gender M to Male', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse());
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.gender).toBe('Male');
    });

    it('should map gender F to Female', async () => {
      const patient = makePatient({
        person: { uuid: 'p', display: 'P', gender: 'F', age: 20, birthdate: '2006-01-01', preferredName: { uuid: 'n', display: 'N', givenName: 'Jane', familyName: 'Doe' }, attributes: [] },
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ patient }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.gender).toBe('Female');
    });

    it('should set visitStatus Active when stopDatetime is null', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ stopDatetime: null }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.visitStatus).toBe('Active');
    });

    it('should set visitStatus Closed when stopDatetime is set', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ stopDatetime: '2026-01-28T00:00:00.000+0000' }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.visitStatus).toBe('Closed');
    });

    it('should use age 0 when person.age is undefined', async () => {
      const patient = makePatient({
        person: { uuid: 'p', display: 'P', gender: 'M', age: undefined as unknown as number, birthdate: '2000-01-01', preferredName: { uuid: 'n', display: 'N', givenName: 'A', familyName: 'B' }, attributes: [] },
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ patient }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.age).toBe(0);
    });
  });

  /* ── getPatientIdentifier ── */

  describe('getPatientIdentifier', () => {
    it('should return identifier from first entry', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse());
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.patientIdentifier).toBe('ABC-123');
    });

    it('should return empty string when identifiers is empty', async () => {
      const patient = makePatient({ identifiers: [] });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ patient }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.patientIdentifier).toBe('');
    });
  });

  /* ── getPhoneNumber ── */

  describe('getPhoneNumber', () => {
    it('should find phone via "telephone" attribute type', async () => {
      const patient = makePatient({
        person: {
          uuid: 'p', display: 'P', gender: 'M', age: 30, birthdate: '1996-01-01',
          preferredName: { uuid: 'n', display: 'N', givenName: 'A', familyName: 'B' },
          attributes: [
            { uuid: 'a1', display: 'Phone', attributeType: { uuid: 'at1', display: 'Telephone Number' }, value: '9876543210' },
          ],
        },
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ patient }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.phoneNumber).toBe('9876543210');
    });

    it('should find phone via "phone" attribute type', async () => {
      const patient = makePatient({
        person: {
          uuid: 'p', display: 'P', gender: 'M', age: 30, birthdate: '1996-01-01',
          preferredName: { uuid: 'n', display: 'N', givenName: 'A', familyName: 'B' },
          attributes: [
            { uuid: 'a1', display: 'Ph', attributeType: { uuid: 'at1', display: 'Phone Number' }, value: '1234567890' },
          ],
        },
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ patient }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.phoneNumber).toBe('1234567890');
    });

    it('should return empty string when no phone attribute', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse());
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.phoneNumber).toBe('');
    });
  });

  /* ── getChiefComplaint ── */

  describe('getChiefComplaint', () => {
    it('should find by concept UUID with string value', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'CC', concept: { uuid: '3edb0e09-9135-481e-b8f0-07a26fa9a5ce', display: 'CC' }, value: 'Fever' }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('Fever');
    });

    it('should find by concept UUID with object value', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'CC', concept: { uuid: '3edb0e09-9135-481e-b8f0-07a26fa9a5ce', display: 'CC' }, value: { uuid: 'v', display: 'Headache' } }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('Headache');
    });

    it('should find by display containing "chief complaint" with string value', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'CC', concept: { uuid: 'other-uuid', display: 'Chief Complaint' }, value: 'Cough' }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('Cough');
    });

    it('should find by display containing "chief complaint" with object value', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'CC', concept: { uuid: 'other-uuid', display: 'Chief Complaint Data' }, value: { uuid: 'v2', display: 'Cold' } }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('Cold');
    });

    it('should return "Not available" when no matching obs', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'Other', concept: { uuid: 'xyz', display: 'Weight' }, value: '70' }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('Not available');
    });

    it('should return "Not available" when encounters is empty', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('Not available');
    });

    it('should handle object value without display (fallback to empty string) via UUID match', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'CC', concept: { uuid: '3edb0e09-9135-481e-b8f0-07a26fa9a5ce', display: 'CC' }, value: { uuid: 'v' } }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('');
    });

    it('should handle object value without display (fallback to empty string) via display match', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'CC', concept: { uuid: 'other-uuid', display: 'Chief Complaint' }, value: { uuid: 'v' } }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('');
    });

    it('should parse JSON value and extract bold complaint name', async () => {
      const jsonValue = JSON.stringify({ en: '►<b>Abdominal Pain</b>: <br/>• Site - All over.' });
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'CC', concept: { uuid: '3edb0e09-9135-481e-b8f0-07a26fa9a5ce', display: 'CC' }, value: jsonValue }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('Abdominal Pain');
    });

    it('should fall back to l-en when en is missing in JSON', async () => {
      const jsonValue = JSON.stringify({ 'l-en': '►<b>Fever</b>: details' });
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'CC', concept: { uuid: '3edb0e09-9135-481e-b8f0-07a26fa9a5ce', display: 'CC' }, value: jsonValue }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('Fever');
    });

    it('should strip HTML when no bold tag in JSON value', async () => {
      const jsonValue = JSON.stringify({ en: '►Headache: some details' });
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'CC', concept: { uuid: '3edb0e09-9135-481e-b8f0-07a26fa9a5ce', display: 'CC' }, value: jsonValue }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe('►Headache: some details');
    });

    it('should return original value when JSON has no en or l-en keys', async () => {
      const jsonValue = JSON.stringify({ other: 'data' });
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'CC', concept: { uuid: '3edb0e09-9135-481e-b8f0-07a26fa9a5ce', display: 'CC' }, value: jsonValue }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.chiefComplaint).toBe(jsonValue);
    });
  });

  /* ── getFollowUpDate ── */

  describe('getFollowUpDate', () => {
    it('should find by concept UUID with string value', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'FU', concept: { uuid: 'e8caffd6-5571-11e7-907b-a6006ad3dba0', display: 'Follow' }, value: '2026-02-03' }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.followUpDate).toBeTruthy();
    });

    it('should find by concept UUID with object value', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'FU', concept: { uuid: 'e8caffd6-5571-11e7-907b-a6006ad3dba0', display: 'FU' }, value: { uuid: 'v', display: '2026-02-03' } }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.followUpDate).toBeTruthy();
    });

    it('should find by display containing "follow"', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'FU', concept: { uuid: 'other-uuid', display: 'Follow-up Date' }, value: '2026-03-01' }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.followUpDate).toBeTruthy();
    });

    it('should return null when no matching obs', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.followUpDate).toBeNull();
    });

    it('should return null when object value has no display', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'FU', concept: { uuid: 'e8caffd6-5571-11e7-907b-a6006ad3dba0', display: 'FU' }, value: { uuid: 'v' } }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.followUpDate).toBeNull();
    });
  });

  /* ── getDoctorInfo ── */

  describe('getDoctorInfo', () => {
    it('should extract doctor name from provider.person.display', async () => {
      const enc = makeEncounter({
        encounterProviders: [{
          uuid: 'ep1', display: 'EP',
          provider: {
            uuid: 'prov1', display: 'Provider Display',
            person: { uuid: 'pp', display: 'Dr. Smith' },
            attributes: [],
          },
        }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.doctorName).toBe('Dr. Smith');
    });

    it('should fall back to provider.display when person is absent', async () => {
      const enc = makeEncounter({
        encounterProviders: [{
          uuid: 'ep1', display: 'EP',
          provider: {
            uuid: 'prov1', display: 'Provider Fallback',
            person: undefined as unknown as { uuid: string; display: string },
            attributes: [],
          },
        }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.doctorName).toBe('Provider Fallback');
    });

    it('should extract speciality from "special" attribute', async () => {
      const enc = makeEncounter({
        encounterProviders: [{
          uuid: 'ep1', display: 'EP',
          provider: {
            uuid: 'prov1', display: 'P',
            person: { uuid: 'pp', display: 'Doc' },
            attributes: [
              { uuid: 'sa', display: 'S', attributeType: { uuid: 'at', display: 'Specialization' }, value: 'Dermatologist' },
            ],
          },
        }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.doctorSpeciality).toBe('Dermatologist');
    });

    it('should extract speciality from "qualification" attribute', async () => {
      const enc = makeEncounter({
        encounterProviders: [{
          uuid: 'ep1', display: 'EP',
          provider: {
            uuid: 'prov1', display: 'P',
            person: { uuid: 'pp', display: 'Doc' },
            attributes: [
              { uuid: 'sa', display: 'Q', attributeType: { uuid: 'at', display: 'Qualification' }, value: 'MBBS' },
            ],
          },
        }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.doctorSpeciality).toBe('MBBS');
    });

    it('should default speciality to "General Physician" when no matching attribute', async () => {
      const enc = makeEncounter({
        encounterProviders: [{
          uuid: 'ep1', display: 'EP',
          provider: {
            uuid: 'prov1', display: 'P',
            person: { uuid: 'pp', display: 'Doc' },
            attributes: [
              { uuid: 'sa', display: 'O', attributeType: { uuid: 'at', display: 'Other Attr' }, value: 'val' },
            ],
          },
        }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.doctorSpeciality).toBe('General Physician');
    });

    it('should return empty name and "General Physician" when no providers', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [makeEncounter()] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.doctorName).toBe('');
      expect(r.doctorSpeciality).toBe('General Physician');
    });

    it('should return empty string when both person and provider display are undefined', async () => {
      const enc = makeEncounter({
        encounterProviders: [{
          uuid: 'ep1', display: 'EP',
          provider: {
            uuid: 'prov1',
            display: undefined as unknown as string,
            person: undefined as unknown as { uuid: string; display: string },
            attributes: [],
          },
        }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.doctorName).toBe('');
    });
  });

  /* ── getPrescriptionDate ── */

  describe('getPrescriptionDate', () => {
    it('should find encounter with "prescription" type', async () => {
      const enc = makeEncounter({
        encounterType: { uuid: 'et', display: 'Prescription' },
        encounterDatetime: '2026-01-28T09:00:00.000+0000',
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.prescriptionDate).toBeTruthy();
    });

    it('should find encounter with "visit complete" type', async () => {
      const enc = makeEncounter({
        encounterType: { uuid: 'et', display: 'Visit Complete' },
        encounterDatetime: '2026-01-29T09:00:00.000+0000',
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.prescriptionDate).toBeTruthy();
    });

    it('should return null when no matching encounter type', async () => {
      const enc = makeEncounter({
        encounterType: { uuid: 'et', display: 'ADULTINITIAL' },
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.prescriptionDate).toBeNull();
    });
  });

  /* ── formatDate / formatTime ── */

  describe('date/time formatting', () => {
    it('should format visitDate', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ startDatetime: '2026-01-27T10:31:00.000+0000' }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.visitDate).toBeTruthy();
      expect(typeof r.visitDate).toBe('string');
    });

    it('should format visitTime', async () => {
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ startDatetime: '2026-01-27T10:31:00.000+0000' }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(r.visitTime).toBeTruthy();
      expect(typeof r.visitTime).toBe('string');
    });

    it('should format prescriptionDate when present', async () => {
      const enc = makeEncounter({
        encounterType: { uuid: 'et', display: 'Prescription' },
        encounterDatetime: '2026-01-28T09:00:00.000+0000',
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(typeof r.prescriptionDate).toBe('string');
    });

    it('should format followUpDate when present', async () => {
      const enc = makeEncounter({
        obs: [{ uuid: 'o1', display: 'FU', concept: { uuid: 'e8caffd6-5571-11e7-907b-a6006ad3dba0', display: 'FU' }, value: '2026-02-03T00:00:00.000+0000' }],
      });
      vi.mocked(OpenMRSApi.get).mockResolvedValue(makeResponse({ encounters: [enc] }));
      const r = await visitDetailsService.getVisitDetails('x');
      expect(typeof r.followUpDate).toBe('string');
    });
  });
});
