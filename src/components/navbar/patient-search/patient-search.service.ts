import { OpenMRSApi } from '../../../services/openmrs';

export const API_ENDPOINTS = {
  SEARCH_PATIENT: '/patient',
} as const;

export const PatientSearchService = {
  searchPatient: (query: string) =>
    OpenMRSApi.get(API_ENDPOINTS.SEARCH_PATIENT, {
      params: {
        q: query,
        v: 'custom:(uuid,identifiers:(identifierType:(name),identifier),person)',
      },
    }),
};
