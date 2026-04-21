export interface DiagnosisItem {
  diagnosisName: string;
  diagnosisType: string;
  diagnosisStatus: string;
}
export interface MedicineItem {
  drug: string;
  strength: string;
  days: string;
  timing: string;
  frequency: string;
  remark: string;
}
export interface FollowUpData {
  wantFollowUp: string;
  followUpType: string | null;
  followUpDate: string | null;
  followUpTime: string | null;
  followUpReason: string | null;
}

export interface VitalsData {
  height: string | null;
  weight: string | null;
  bpSystolic: string | null;
  bpDiastolic: string | null;
  pulse: string | null;
  temperature: string | null;
  spo2: string | null;
  respiratoryRate: string | null;
}

export interface PrescriptionData {
  visitUuid: string;
  patientName: string;
  patientUuid: string;
  patientId: string;
  gender: string;
  age: string;
  phone: string | null;
  address: string | null;
  nationalId: string | null;
  occupation: string | null;
  consultationDate: string;
  location: string;
  doctorName: string;
  doctorQualification: string;
  doctorRegNumber: string;
  doctorSignatureUrl: string | null;
  vitals: VitalsData;
  diagnoses: DiagnosisItem[];
  medicines: MedicineItem[];
  advices: string[];
  tests: string[];
  referrals: { speciality: string; reason: string }[];
  followUp: FollowUpData | null;
}
