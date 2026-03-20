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

/* ── Dummy Data (TODO: Replace with API call) ── */
export const DUMMY_PRESCRIPTION: PrescriptionData = {
  patientName: 'Test S',
  age: 19,
  gender: 'Male',
  patientIdentifier: '163KG-9',
  doctorName: 'Rohith M S',
  doctorQualification: 'MBBS, MD',
  visitDate: '27 January 2026, 10:31 AM',
  diagnosis: 'Infestation by Sarcoptes Scabiei Var Hominis',
  medications: [
    {
      name: 'Ambroxol + Levosalbutamol + Guaifenesin Oral Drops',
      strength: '10 mg',
      frequency: '3 times/day',
      duration: '7 days',
    },
    {
      name: 'Paracetamol Suspension',
      strength: '250 mg/5ml',
      frequency: 'As needed',
      duration: '5 days',
    },
  ],
  advice: [
    'Drink plenty of water',
    'Take adequate rest',
    'Avoid spicy and oily food',
  ],
  testsRecommended: [
    'Liver Function Tests (LFT)',
    'Complete Blood Count (CBC)',
  ],
  referredSpecialist:
    'CHO – Community Health Officer (Elective General Checkup)',
  followUpDate: '3 February 2026',
};
