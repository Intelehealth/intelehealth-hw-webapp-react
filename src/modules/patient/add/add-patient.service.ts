import { identifierSources } from '../../../assets/data/openmrs_uuids';
import { CONCEPT_UUIDS } from '../../../assets/data/visit-summary.data';
import { OpenMRSApi } from '../../../services/openmrs';
import type { AddPatientData } from '../../../types/patient/add/add-patient.types';
import type {
  OpenMRSPatient,
  OpenMRSVisit,
  OpenMRSVisitProtocolObs,
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

  updatePatient: (uuid: string, patientData: Partial<AddPatientData>) =>
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    OpenMRSApi.post<any>(`${API_ENDPOINTS.PATIENT}/${uuid}`, patientData),

  getPatient: (uuid: string) =>
    OpenMRSApi.get<OpenMRSPatient>(`${API_ENDPOINTS.PATIENT}/${uuid}?v=full`),

  // No `limit`: OpenMRS applies its default page size (50, newest first), so a
  // patient with a longer history sees only their most recent visits.
  getPatientVisits: (patientUuid: string) =>
    OpenMRSApi.get<{ results: OpenMRSVisit[] }>(
      `/visit?patient=${patientUuid}&includeInactive=true&v=custom:(uuid,startDatetime,stopDatetime,visitType:(display),encounters:(encounterType:(display)))`
    ),

  // The chief-complaint observation holds each visit's protocol names. Fetched
  // on its own so the visits request does not carry every observation. Like the
  // visits request, it has no `limit` and so covers the newest 50 results.
  getPatientVisitProtocols: (patientUuid: string) =>
    OpenMRSApi.get<{ results: OpenMRSVisitProtocolObs[] }>(
      `/obs?patient=${patientUuid}&concept=${CONCEPT_UUIDS.CHIEF_COMPLAINT}&v=custom:(value,encounter:(visit:(uuid)))`
    ),

  // idgen's REST API takes the same Authorization header as every other
  // OpenMRS call. The legacy generateIdentifier.form page needs the OpenMRS
  // session cookie instead, which the browser does not send cross-site.
  // This is idgen's batch generation on /identifiersource (the
  // /identifiersource/{uuid}/identifier sub-resource is not routed by older
  // REST modules). It answers {"identifiers": ["..."]}.
  genratePatientIdentifier: () =>
    OpenMRSApi.post<{ identifiers?: unknown[] }>('/idgen/identifiersource', {
      generateIdentifiers: true,
      sourceUuid: identifierSources.default,
      numberToGenerate: 1,
      comment: 'Patient registration (HW webapp)',
    }),
};

export default patientService;
