// ─── Appointment Scheduling Types ─────────────────────────────────────────────

export type SlotPeriod = 'Morning' | 'Afternoon' | 'Evening';

export interface AppointmentSlot {
  slotId: string;
  date: string;
  time: string;
  isAvailable: boolean;
  period: SlotPeriod;
  speciality?: string;
}

export interface RawAppointmentSlot {
  slotDay: string;
  slotDate: string; // DD/MM/YYYY
  slotDuration: number;
  slotDurationUnit: string;
  slotTime: string; // e.g. "5:00 PM"
  speciality: string;
  userUuid: string;
  drName: string;
}

export interface AppointmentSlotsApiResponse {
  status: boolean;
  dates: RawAppointmentSlot[];
  bookedAppointments: unknown[];
  rescheduledAppointments: unknown[];
}

export interface RawEncounterProvider {
  encounterRole: { uuid: string };
  provider: { uuid: string };
}

export interface RawObs {
  uuid: string;
  concept: { uuid: string };
  value: string | { uuid: string; display: string };
  comment: string | null;
}

export interface RawEncounter {
  uuid: string;
  encounterDatetime: string;
  encounterType: { uuid: string };
  encounterProviders: RawEncounterProvider[];
  obs: RawObs[];
}

export interface RawVisitAttribute {
  uuid: string;
  attributeType: { uuid: string };
  value: string;
}

export interface RawVisitResponse {
  uuid: string;
  startDatetime: string;
  location: { uuid: string };
  visitType: { uuid: string };
  patient: { uuid: string };
  attributes: RawVisitAttribute[];
  encounters: RawEncounter[];
}

// Custom rep that fetches all UUIDs needed for the pushdata payload
export const PUSHDATA_CUSTOM_REP =
  'custom:(uuid,startDatetime,' +
  'location:(uuid),' +
  'visitType:(uuid),' +
  'patient:(uuid),' +
  'attributes:(uuid,attributeType:(uuid),value),' +
  'encounters:(uuid,encounterDatetime,' +
  'encounterType:(uuid),' +
  'encounterProviders:(encounterRole:(uuid),provider:(uuid)),' +
  'obs:(uuid,concept:(uuid),value,comment)))';

// Visit attribute type UUID for appointment scheduled datetime
export const APPOINTMENT_SCHEDULE_ATTR_TYPE =
  'e76eee5e-9d73-4d07-8f30-16b77e626ccf';

// API endpoints
export const PUSH_DATA_ENDPOINT = '/push/pushdata';

// ─── Appointment List Types ───────────────────────────────────────────────────

export interface AppointmentListItem {
  id: number;
  patientName: string;
  gender: string;
  age: string;
  visitId: string;
  symptom: string;
  dateTime: string;
  clinic: string;
  prescription: boolean;
  status: string;
  speciality: string;
  type: 'upcoming' | 'past';
  timeUntil: string;
}

export interface AppointmentDetailItem {
  id: number;
  patientName: string;
  gender: string;
  age: string;
  visitId: string;
  symptom: string;
  date: string;
  time: string;
  status: string;
  speciality: string;
  type: 'upcoming' | 'past';
  clinic?: string;
  prescription?: boolean;
}

export const appointmentsListData: AppointmentListItem[] = [
  {
    id: 1,
    patientName: 'Bapu Mali',
    gender: 'M',
    age: '73y',
    visitId: '987654JK',
    symptom: 'Headache and body pain',
    dateTime: '10 Oct 2025, at 10:00 am',
    clinic: 'TM Clinic 1',
    prescription: false,
    status: 'PRIORITY',
    speciality: 'General physician',
    type: 'upcoming',
    timeUntil: 'in 4 Hours 54 min at 10:00 am',
  },
  {
    id: 2,
    patientName: 'Vimla Jadhav',
    gender: 'F',
    age: '75y 2m',
    visitId: '12345AB',
    symptom: 'Cough',
    dateTime: '24 May 2025, at 3:15 pm',
    clinic: 'TM Clinic 2',
    prescription: true,
    status: 'Completed',
    speciality: 'General physician',
    type: 'past',
    timeUntil: '',
  },
  {
    id: 3,
    patientName: 'Shantaram Rathod',
    gender: 'M',
    age: '76y 2m',
    clinic: 'TM Clinic 2',
    dateTime: '26 May, at 11:00 am',
    prescription: false,
    symptom: 'Fever',
    status: 'Completed',
    type: 'past',
    timeUntil: '',
    visitId: 'RPT78901',
    speciality: 'General physician',
  },
  {
    id: 4,
    patientName: 'Ramesh Patil',
    gender: 'M',
    age: '55y',
    clinic: 'TM Clinic 1',
    dateTime: '28 May, at 10:30 am',
    prescription: false,
    symptom: 'Headache',
    status: 'Scheduled',
    type: 'upcoming',
    timeUntil: 'in 2 Days at 10:30 am',
    visitId: 'RPT78902',
    speciality: 'General physician',
  },
];

export const appointmentsDetailData: AppointmentDetailItem[] = [
  {
    id: 1,
    patientName: 'Bapu Mali',
    gender: 'M',
    age: '73',
    visitId: '987654JK',
    symptom: 'Headache and body pain',
    date: '10 Oct 2025',
    time: '10:00 am',
    status: 'PRIORITY',
    speciality: 'General physician',
    type: 'upcoming',
  },
  {
    id: 2,
    patientName: 'Vimla Jadhav',
    gender: 'F',
    age: '75y 2m',
    visitId: '12345AB',
    symptom: 'Cough',
    date: '24 May 2025',
    time: '3:15 pm',
    status: 'COMPLETED',
    speciality: 'General physician',
    type: 'past',
  },
  {
    id: 3,
    patientName: 'Shantaram Rathod',
    gender: 'M',
    age: '76y 2m',
    clinic: 'TM Clinic 2',
    date: '26 May 2025',
    time: '11:00 am',
    visitId: 'RPT78901',
    prescription: false,
    symptom: 'Fever',
    status: 'Completed',
    speciality: 'General physician',
    type: 'past',
  },
  {
    id: 4,
    patientName: 'Ramesh Patil',
    gender: 'M',
    age: '55y',
    clinic: 'TM Clinic 1',
    date: '28 May 2025',
    time: '10:30 am',
    visitId: 'RPT78902',
    prescription: false,
    symptom: 'Headache',
    status: 'Scheduled',
    speciality: 'General physician',
    type: 'upcoming',
  },
];
