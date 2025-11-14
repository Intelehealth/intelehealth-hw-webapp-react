import { OpenMRSApi } from '../../../services/openmrs';
import type { AddPatientData } from './add-patient.types';

// Basic API endpoints
export const API_ENDPOINTS = {
  PATIENT: '/patient',
} as const;

// Basic API functions
export const patientService = {
  createPatient: (patientData: AddPatientData) =>
    OpenMRSApi.post<any>(API_ENDPOINTS.PATIENT, patientData),
};

export default patientService;
