import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks
const h = vi.hoisted(() => ({
  mockOpenMRSPost: vi.fn(),
  mockOpenMRSGet: vi.fn(),
}));

vi.mock('../../../../services/openmrs', () => ({
  OpenMRSApi: {
    post: (...args: unknown[]) => h.mockOpenMRSPost(...args),
    get: (...args: unknown[]) => h.mockOpenMRSGet(...args),
  },
}));

import {
  API_ENDPOINTS,
  patientService,
} from '../../../../modules/patient/add/add-patient.service';
import type { AddPatientData } from '../../../../types/patient/add/add-patient.types';

const { mockOpenMRSPost, mockOpenMRSGet } = h;

describe('patientService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPatient', () => {
    it('should post patient data to the correct endpoint', async () => {
      const patientData: AddPatientData = {
        identifiers: [
          {
            identifier: 'PAT-123',
            identifierType: 'id-type-uuid',
            location: 'location-uuid',
            preferred: true,
          },
        ],
        person: {
          birthdate: '1990-01-01',
          gender: 'M',
          names: [
            {
              givenName: 'John',
              middleName: 'M',
              familyName: 'Doe',
            },
          ],
          addresses: [
            {
              address1: 'Street 1',
              address2: 'Area 2',
              address3: '',
              address6: '',
              cityVillage: 'Mumbai',
              country: 'India',
              countyDistrict: 'Mumbai',
              postalCode: '123456',
              stateProvince: 'Maharashtra',
            },
          ],
          attributes: [],
        },
      };

      const response = {
        uuid: 'patient-uuid-123',
        display: 'John Doe',
      };

      mockOpenMRSPost.mockResolvedValue(response);

      const result = await patientService.createPatient(patientData);

      expect(mockOpenMRSPost).toHaveBeenCalledTimes(1);
      expect(mockOpenMRSPost).toHaveBeenCalledWith(
        API_ENDPOINTS.PATIENT,
        patientData
      );
      expect(result).toEqual(response);
    });

    it('should propagate errors from createPatient', async () => {
      const patientData = {
        identifiers: [],
        person: {
          birthdate: '1990-01-01',
          gender: 'M',
          names: [],
          addresses: [],
          attributes: [],
        },
      } as unknown as AddPatientData;

      const error = new Error('Failed to create patient');
      mockOpenMRSPost.mockRejectedValue(error);

      await expect(patientService.createPatient(patientData)).rejects.toThrow(
        'Failed to create patient'
      );
    });
  });

  describe('getPatient', () => {
    it('should call getPatient with the correct endpoint', async () => {
      const patientUuid = 'patient-uuid-123';
      const response = { uuid: patientUuid, display: 'John Doe' };

      mockOpenMRSGet.mockResolvedValue(response);

      const result = await patientService.getPatient(patientUuid);

      expect(mockOpenMRSGet).toHaveBeenCalledTimes(1);
      expect(mockOpenMRSGet).toHaveBeenCalledWith(
        `${API_ENDPOINTS.PATIENT}/${patientUuid}?v=full`
      );
      expect(result).toEqual(response);
    });

    it('should propagate errors from getPatient', async () => {
      const error = new Error('Patient not found');
      mockOpenMRSGet.mockRejectedValue(error);

      await expect(patientService.getPatient('unknown-uuid')).rejects.toThrow(
        'Patient not found'
      );
    });
  });

  describe('getPatientVisits', () => {
    it('should call getPatientVisits with the correct endpoint', async () => {
      const patientUuid = 'patient-uuid-456';
      const response = { results: [] };

      mockOpenMRSGet.mockResolvedValue(response);

      const result = await patientService.getPatientVisits(patientUuid);

      expect(mockOpenMRSGet).toHaveBeenCalledTimes(1);
      expect(mockOpenMRSGet).toHaveBeenCalledWith(
        `/visit?patient=${patientUuid}&includeInactive=true&v=custom:(uuid,startDatetime,stopDatetime,visitType:(display),encounters:(encounterType:(display)))`
      );
      expect(result).toEqual(response);
    });

    it('should propagate errors from getPatientVisits', async () => {
      const error = new Error('Visits fetch failed');
      mockOpenMRSGet.mockRejectedValue(error);

      await expect(
        patientService.getPatientVisits('patient-uuid-456')
      ).rejects.toThrow('Visits fetch failed');
    });
  });

  describe('getPatientVisitProtocols', () => {
    it('should request only the chief-complaint observations of the patient, with their visit', async () => {
      const response = { results: [] };
      mockOpenMRSGet.mockResolvedValue(response);

      const result =
        await patientService.getPatientVisitProtocols('patient-uuid-456');

      expect(mockOpenMRSGet).toHaveBeenCalledTimes(1);
      expect(mockOpenMRSGet).toHaveBeenCalledWith(
        '/obs?patient=patient-uuid-456&concept=3edb0e09-9135-481e-b8f0-07a26fa9a5ce&v=custom:(value,encounter:(visit:(uuid)))'
      );
      expect(result).toEqual(response);
    });

    it('should propagate errors from getPatientVisitProtocols', async () => {
      mockOpenMRSGet.mockRejectedValue(new Error('Obs fetch failed'));

      await expect(
        patientService.getPatientVisitProtocols('patient-uuid-456')
      ).rejects.toThrow('Obs fetch failed');
    });
  });

  describe('genratePatientIdentifier', () => {
    it('should ask REST idgen for one identifier from the OpenMRS ID source', async () => {
      const response = { identifiers: ['10045K'] };
      mockOpenMRSPost.mockResolvedValue(response);

      const result = await patientService.genratePatientIdentifier();

      expect(mockOpenMRSPost).toHaveBeenCalledTimes(1);
      expect(mockOpenMRSPost).toHaveBeenCalledWith('/idgen/identifiersource', {
        generateIdentifiers: true,
        sourceUuid: '691eed12-c0f1-11e2-94be-8c13b969e334',
        numberToGenerate: 1,
        comment: 'Patient registration (HW webapp)',
      });
      expect(mockOpenMRSGet).not.toHaveBeenCalled();
      expect(result).toEqual(response);
    });

    it('should not send fields that would make idgen create a new source', async () => {
      mockOpenMRSPost.mockResolvedValue({ identifiers: ['10045K'] });

      await patientService.genratePatientIdentifier();

      const body = mockOpenMRSPost.mock.calls[0][1] as Record<string, unknown>;
      expect(body).not.toHaveProperty('sourceType');
      expect(body).not.toHaveProperty('name');
      expect(body).not.toHaveProperty('identifierType');
    });

    it('should not use the legacy generateIdentifier.form page or its own base URL', async () => {
      mockOpenMRSPost.mockResolvedValue({ identifiers: ['10045K'] });

      await patientService.genratePatientIdentifier();

      const [url, , config] = mockOpenMRSPost.mock.calls[0];
      expect(url).not.toContain('generateIdentifier.form');
      expect(config).toBeUndefined();
    });

    it('should propagate errors from genratePatientIdentifier', async () => {
      const error = new Error('Identifier generation failed');
      mockOpenMRSPost.mockRejectedValue(error);

      await expect(patientService.genratePatientIdentifier()).rejects.toThrow(
        'Identifier generation failed'
      );
    });
  });

  describe('updatePatient', () => {
    it('should post patient data to the correct endpoint with uuid', async () => {
      const uuid = 'patient-uuid-123';
      const updateData: Partial<AddPatientData> = {
        person: {
          birthdate: '1990-01-01',
          gender: 'M',
          names: [
            {
              givenName: 'John',
              middleName: 'M',
              familyName: 'Doe',
            },
          ],
          addresses: [
            {
              address1: 'Street 1',
              address2: 'Area 2',
              address3: '',
              address6: '',
              cityVillage: 'Mumbai',
              country: 'India',
              countyDistrict: 'Mumbai',
              postalCode: '123456',
              stateProvince: 'Maharashtra',
            },
          ],
          attributes: [],
        },
      };

      const response = { uuid, display: 'John Doe' };
      mockOpenMRSPost.mockResolvedValue(response);

      const result = await patientService.updatePatient(uuid, updateData);

      expect(mockOpenMRSPost).toHaveBeenCalledTimes(1);
      expect(mockOpenMRSPost).toHaveBeenCalledWith(
        `${API_ENDPOINTS.PATIENT}/${uuid}`,
        updateData
      );
      expect(result).toEqual(response);
    });

    it('should propagate errors from updatePatient', async () => {
      const error = new Error('Failed to update patient');
      mockOpenMRSPost.mockRejectedValue(error);

      await expect(
        patientService.updatePatient('unknown-uuid', { person: {} as any })
      ).rejects.toThrow('Failed to update patient');
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should export the correct API endpoints', () => {
      expect(API_ENDPOINTS.PATIENT).toBe('/patient');
    });

    it('should have API_ENDPOINTS as const object', () => {
      expect(API_ENDPOINTS).toBeDefined();
      expect(API_ENDPOINTS.PATIENT).toBe('/patient');
      // Testing that it's a const object (readonly in TypeScript)
      expect(typeof API_ENDPOINTS).toBe('object');
    });
  });

  describe('default export', () => {
    it('should export patientService as default', async () => {
      const defaultExport = await import(
        '../../../../modules/patient/add/add-patient.service'
      );
      expect(defaultExport.default).toBe(patientService);
    });
  });
});
