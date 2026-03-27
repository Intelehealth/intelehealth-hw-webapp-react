export const PRESCRIPTION_TABS = {
  RECEIVED: 'Received',
  PENDING: 'Pending',
} as const;

export interface Medication {
  name: string;
  strength: string;
  frequency: string;
  duration: string;
}

export interface PrescriptionData {
  patientName: string;
  age: number;
  gender: string;
  patientIdentifier: string;
  doctorName: string;
  doctorQualification: string;
  visitDate: string;
  diagnosis: string;
  medications: Medication[];
  advice: string[];
  testsRecommended: string[];
  referredSpecialist: string | null;
  followUpDate: string | null;
}
