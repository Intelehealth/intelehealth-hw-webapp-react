// ═══════════════════════════════════════════════════════════
// VISIT SUMMARY - CONSTANTS
// ═══════════════════════════════════════════════════════════

export const CONCEPT_UUIDS = {
  HEIGHT: '5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  WEIGHT: '5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  BMI: '9d311fac-538f-11e6-9cfe-86f436325720',
  BP_SYSTOLIC: '5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  BP_DIASTOLIC: '5086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  PULSE: '5087AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  TEMPERATURE: '5088AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  SPO2: '5092AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  RESPIRATORY_RATE: '5242AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  FBS: '2d6845e6-fa7a-4a80-a55a-c4fa6ff4e2af',
  PPBS: 'e2d331f0-3132-4b66-9137-b1f9ace65443',
  RBS: '056f3911-55ee-42c4-8078-5537a620a35a',
  WAIST_CIRCUMFERENCE: '41e7d3ff-d24b-448f-a248-a4feb64ef700',
  HIP_CIRCUMFERENCE: '9f1b264f-2b9b-44f5-9d7a-c809e9f63c51',
  WAIST_TO_HIP_RATIO: '20d3e924-f379-443d-9033-c8d1cdfda2f0',
  OGTT: 'd7a564d7-f104-4186-8e36-68101c7c2952',
  HBA1C: 'f0631271-e0b3-48ca-a4e5-70959a7b76d9',
  BLOOD_GROUP: '9d2df0c6-538f-11e6-9cfe-86f436325720',
  CHIEF_COMPLAINT: '3edb0e09-9135-481e-b8f0-07a26fa9a5ce',
  PHYSICAL_EXAMINATION: '200b7a45-77bc-4986-b879-cc727f5f7d5b',
  PHYSICAL_EXAM_DISPLAY: 'e1761e85-9b50-48ae-8c4d-e6b7eeeba084',
} as const;

export const VISIT_SUMMARY_CUSTOM_REP =
  'custom:(uuid,display,startDatetime,stopDatetime,' +
  'attributes:(display,uuid,value,attributeType:(uuid,display)),' +
  'encounters:(display,uuid,encounterDatetime,encounterType:(uuid,display),' +
  'obs:(display,uuid,value,concept:(uuid,display)),' +
  'encounterProviders:(display,provider:(uuid,display,person:(uuid,display)))),' +
  'patient:(uuid,identifiers:(identifier,identifierType:(name,uuid,display)),' +
  'attributes:(display,attributeType:(display),value),' +
  'person:(display,gender,age,birthdate,' +
  'preferredName:(givenName,familyName),' +
  'attributes:(display,attributeType:(display),value))))';

// ═══════════════════════════════════════════════════════════
// VISIT SUMMARY - TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

export interface Patient {
  name: string;
  gender: string;
  id: string;
  patientUuid: string;
  dateOfBirth: string;
  age: string;
  chwWorker: string;
  visitId: string;
  phoneNumber: string;
}

export interface VitalValue {
  value: number | null;
  unit?: string;
  note?: string;
}

export interface BP {
  systolic: number;
  diastolic: number;
}

export interface BMI {
  value: number;
}

export interface AdditionalMeasurement {
  label: string;
  value: string;
}

export interface Vitals {
  height: VitalValue;
  weight: VitalValue;
  bmi: BMI;
  bp: BP;
  pulse: VitalValue;
  temperature: VitalValue;
  spo2: VitalValue;
  respiratoryRate: VitalValue;
  additionalMeasurements?: AdditionalMeasurement[];
}

export interface Detail {
  label: string;
  value: string;
}

export interface AssociatedSymptom {
  heading: string;
  values: string[];
}

export interface CheckupReason {
  chiefComplaints: string[];
  details: Detail[];
  associatedSymptoms?: AssociatedSymptom[];
}

export interface GeneralExam {
  label: string;
  value: string;
}

export interface PhysicalExamination {
  generalExams: GeneralExam[];
}

export interface HistorySection {
  title: string;
  details: Detail[];
}

export interface AdditionalDocument {
  uuid: string;
  name: string;
  fileUrl: string;
  isImage: boolean;
}

// ═══════════════════════════════════════════════════════════
// MAIN TYPE
// ═══════════════════════════════════════════════════════════

export interface VisitData {
  visitUuid: string;
  patient: Patient;
  vitals: Vitals;
  checkupReason: CheckupReason;
  physicalExamination: PhysicalExamination;
  medicalHistory?: HistorySection[];
  speciality?: string;
  priorityVisit?: boolean;
  doctorNotes?: string;
  additionalDocuments?: AdditionalDocument[];
}

export const visitSummaryData: VisitData[] = [
  {
    visitUuid: '00000000-0000-0000-0000-000000000000',
    patient: {
      name: 'Vimla Jadhav',
      gender: 'Female',
      id: '987654jK',
      patientUuid: '00000000-0000-0000-0000-000000000000',
      dateOfBirth: '12th May 1988',
      age: '24 Years',
      chwWorker: 'Kiran Devi',
      visitId: '987654jK',
      phoneNumber: '+91 9876543210',
    },
    vitals: {
      height: { value: 168, unit: 'cm' },
      weight: { value: 72, unit: 'kg' },
      bmi: { value: 25.51 },
      bp: { systolic: 130, diastolic: 85 },
      pulse: { value: 75, unit: 'bpm' },
      temperature: { value: 99, unit: 'F' },
      spo2: { value: null, note: 'No information' },
      respiratoryRate: { value: null, note: 'No information' },
    },
    checkupReason: {
      chiefComplaints: ['Abdominal pain'],
      details: [
        { label: 'Site', value: 'Upper (R) - Right Hypochondrium' },
        { label: 'Pain radiates to', value: 'Upper (C) - Epigastric' },
        { label: 'Onset', value: 'Rapidly increasing' },
        { label: 'Timing', value: 'Morning' },
        { label: 'Character of pain', value: 'Cramping' },
        { label: 'Severity', value: 'Moderate 4-6' },
      ],
    },
    physicalExamination: {
      generalExams: [
        { label: 'In', value: 'Person Consultation' },
        { label: 'Eyes', value: 'Jaundice - no Jaundice seen' },
        { label: 'Eyes', value: 'Pallor - Normal pallor' },
        { label: 'Arm', value: 'Pinch skin* - appeared slow on pinch test' },
        { label: 'Nail abnormality', value: 'Clubbing' },
        { label: 'Nail anemia', value: 'Nails are normal' },
        { label: 'Ankle', value: 'Pedal oedema in left foot' },
      ],
    },
  },
];
