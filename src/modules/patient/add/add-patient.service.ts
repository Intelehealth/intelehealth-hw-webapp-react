import { OpenMRSApi } from '../../../services/openmrs';
import type { AddPatientData, PersonImage } from './add-patient.types';

// Basic API endpoints
export const API_ENDPOINTS = {
  PATIENT: '/patient',
} as const;

// Basic API functions
export const patientService = {
  createPatient: (patientData: AddPatientData) =>
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    OpenMRSApi.post<any>(API_ENDPOINTS.PATIENT, patientData),

  genratePatientIdentifier: () =>
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    OpenMRSApi.get<any>(
      `/module/idgen/generateIdentifier.form?source=1&username=nurse1&password=Nurse@123`,
      {
        baseURL: import.meta.env.VITE_OPENMRS_API_URL.replace(
          '/ws/rest/v1',
          ''
        ),
      }
    ),

  updatePersonImage: (personImageData: PersonImage) =>
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    OpenMRSApi.post<any>(`/personimage`, personImageData),
};

export default patientService;
