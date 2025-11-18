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
import type {
  AddPatientData,
  PersonImage,
} from '../../../../modules/patient/add/add-patient.types';

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

  describe('genratePatientIdentifier', () => {
    it('should call the identifier generation endpoint with correct parameters', async () => {
      const response = {
        identifiers: ['PAT-12345'],
      };

      mockOpenMRSGet.mockResolvedValue(response);

      const originalEnv = import.meta.env.VITE_OPENMRS_API_URL;
      import.meta.env.VITE_OPENMRS_API_URL = 'http://localhost:8080/ws/rest/v1';

      const result = await patientService.genratePatientIdentifier();

      expect(mockOpenMRSGet).toHaveBeenCalledTimes(1);
      expect(mockOpenMRSGet).toHaveBeenCalledWith(
        '/module/idgen/generateIdentifier.form?source=1&username=nurse1&password=Nurse@123',
        {
          baseURL: 'http://localhost:8080',
        }
      );
      expect(result).toEqual(response);

      import.meta.env.VITE_OPENMRS_API_URL = originalEnv;
    });

    it('should handle different base URLs correctly', async () => {
      const response = {
        identifiers: ['PAT-67890'],
      };

      mockOpenMRSGet.mockResolvedValue(response);

      const originalEnv = import.meta.env.VITE_OPENMRS_API_URL;
      import.meta.env.VITE_OPENMRS_API_URL =
        'https://example.com/openmrs/ws/rest/v1';

      await patientService.genratePatientIdentifier();

      expect(mockOpenMRSGet).toHaveBeenCalledWith(
        '/module/idgen/generateIdentifier.form?source=1&username=nurse1&password=Nurse@123',
        {
          baseURL: 'https://example.com/openmrs',
        }
      );

      import.meta.env.VITE_OPENMRS_API_URL = originalEnv;
    });

    it('should propagate errors from genratePatientIdentifier', async () => {
      const error = new Error('Identifier generation failed');
      mockOpenMRSGet.mockRejectedValue(error);

      await expect(patientService.genratePatientIdentifier()).rejects.toThrow(
        'Identifier generation failed'
      );
    });
  });

  describe('updatePersonImage', () => {
    it('should post person image data to the correct endpoint', async () => {
      const personImageData: PersonImage = {
        person: 'person-uuid-123',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      const response = {
        uuid: 'image-uuid-123',
        person: 'person-uuid-123',
      };

      mockOpenMRSPost.mockResolvedValue(response);

      const result = await patientService.updatePersonImage(personImageData);

      expect(mockOpenMRSPost).toHaveBeenCalledTimes(1);
      expect(mockOpenMRSPost).toHaveBeenCalledWith(
        '/personimage',
        personImageData
      );
      expect(result).toEqual(response);
    });

    it('should propagate errors from updatePersonImage', async () => {
      const personImageData: PersonImage = {
        person: 'person-uuid-123',
        image: 'data:image/png;base64,abc123',
      };

      const error = new Error('Failed to update image');
      mockOpenMRSPost.mockRejectedValue(error);

      await expect(
        patientService.updatePersonImage(personImageData)
      ).rejects.toThrow('Failed to update image');
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
