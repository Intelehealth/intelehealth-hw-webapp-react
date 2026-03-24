import { OpenMRSApi } from '../../../services/openmrs';
import type { AddPatientData } from '../../../types/patient/add/add-patient.types';
import type {
  OpenMRSPatient,
  OpenMRSVisit,
} from '../../../types/patient/profile/patient-profile.types';

// Basic API endpoints
export const API_ENDPOINTS = {
  PATIENT: '/patient',
} as const;

// Basic API functions
export const patientService = {
  createPatient: (patientData: AddPatientData) =>
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    OpenMRSApi.post<any>(API_ENDPOINTS.PATIENT, patientData),

  getPatient: (uuid: string) =>
    OpenMRSApi.get<OpenMRSPatient>(`${API_ENDPOINTS.PATIENT}/${uuid}?v=full`),

  getPatientVisits: (patientUuid: string) =>
    OpenMRSApi.get<{ results: OpenMRSVisit[] }>(
      `/visit?patient=${patientUuid}&includeInactive=false&v=custom:(uuid,startDatetime,visitType:(display),encounters:(encounterType:(display)))`
    ),

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
};

export default patientService;
