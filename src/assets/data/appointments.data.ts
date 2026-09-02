// ─── Appointment Scheduling Types ─────────────────────────────────────────────

export type SlotPeriod = 'Morning' | 'Afternoon' | 'Evening';

export interface AppointmentSlot {
  slotId: string;
  date: string;
  time: string;
  isAvailable: boolean;
  period: SlotPeriod;
  speciality?: string;
  slotDay: string;
  slotDate: string;
  slotTime: string;
  slotDuration: number;
  slotDurationUnit: string;
  userUuid: string;
  drName: string;
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
  bookedAppointments: RawUserAppointment[];
  rescheduledAppointments: RawUserAppointment[];
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

export const GET_SLOTS_ENDPOINT = '/appointment/getSlots';

export const CANCEL_APPOINTMENT_ENDPOINT = '/appointment/cancelAppointment';

export const BOOKING_VISIT_REP =
  'custom:(uuid,location:(uuid),' +
  'patient:(uuid,identifiers:(identifier),' +
  'person:(display,gender,age)))';

export interface BookingVisitResponse {
  uuid: string;
  location: { uuid: string };
  patient: {
    uuid: string;
    identifiers: { identifier: string }[];
    person: { display: string; gender: string | null; age: number | null };
  };
}

export interface PushAppointment {
  appointmentId: number;
  uuid: string;
  visitUuid: string;
  patientId: string;
  openMrsId: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientPic: string;
  hwUUID: string;
  hwName: string;
  hwAge: string;
  hwGender: string;
  userUuid: string;
  drName: string;
  locationUuid: string;
  slotDay: string;
  slotDate: string;
  slotTime: string;
  slotDuration: number;
  slotDurationUnit: string;
  speciality: string;
  sync: string;
  reason?: string;
}

export interface BookingHealthWorker {
  hwUUID: string;
  hwName: string;
  hwAge: string;
  hwGender: string;
}

export interface RawBookedAppointment {
  id: number;
  slotDay: string;
  slotDate: string;
  slotJsDate: string;
  slotDuration: number;
  slotDurationUnit: string;
  slotTime: string;
  speciality: string;
  userUuid: string;
  drName: string;
  visitUuid: string;
  patientId: string;
  locationUuid: string;
  hwUUID: string;
  patientName: string;
  openMrsId: string;
  status: string;
  reason: string | null;
  patientAge: string | null;
  patientGender: string | null;
  hwName: string | null;
  type: string;
  createdAt: string;
  rescheduledAppointments?: RawBookedAppointment[];
}

export interface GetSlotsApiResponse {
  status: boolean;
  data: RawBookedAppointment[];
  cancelledAppointments: RawBookedAppointment[];
}

// ─── Appointment List API Types ───────────────────────────────────────────────

export interface RawUserAppointment {
  appointmentId: number;
  slotDay: string;
  slotDate: string; // DD/MM/YYYY
  slotDuration: number;
  slotDurationUnit: string;
  slotTime: string; // e.g. "9:00 PM"
  speciality: string;
  userUuid: string;
  drName: string;
  visitUuid: string;
  patientName: string;
  openMrsId: string;
  patientId: string;
  locationUuid: string;
  hwUUID: string;
  reason: string | null;
  voided: boolean | null;
  syncd: boolean;
  patientGender: string;
  patientAge: string;
  hwName: string;
  hwAge: string;
  hwGender: string;
}

export interface AppointmentListApiResponse {
  status: string;
  message: string;
  data: {
    AppointmentList: RawUserAppointment[];
  };
  label: string;
}

// ─── Appointment List Types ───────────────────────────────────────────────────

export interface AppointmentListItem {
  id: number;
  patientName: string;
  gender: string;
  age: string;
  visitId: string;
  openMrsId: string;
  symptom: string;
  dateTime: string;
  slotDay: string;
  clinic: string;
  prescription: boolean;
  status: string;
  speciality: string;
  drName: string;
  hwName: string;
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
    openMrsId: '100GL-1',
    symptom: 'Headache and body pain',
    dateTime: '10 Oct 2025, at 10:00 am',
    slotDay: 'Friday',
    clinic: 'TM Clinic 1',
    prescription: false,
    status: 'PRIORITY',
    speciality: 'General physician',
    drName: 'Dr. Sharma',
    hwName: 'Nurse One',
    type: 'upcoming',
    timeUntil: 'in 4 Hours 54 min at 10:00 am',
  },
  {
    id: 2,
    patientName: 'Vimla Jadhav',
    gender: 'F',
    age: '75y 2m',
    visitId: '12345AB',
    openMrsId: '100GL-2',
    symptom: 'Cough',
    dateTime: '24 May 2025, at 3:15 pm',
    slotDay: 'Saturday',
    clinic: 'TM Clinic 2',
    prescription: true,
    status: 'Completed',
    speciality: 'General physician',
    drName: 'Dr. Patel',
    hwName: 'Nurse Two',
    type: 'past',
    timeUntil: '',
  },
  {
    id: 3,
    patientName: 'Shantaram Rathod',
    gender: 'M',
    age: '76y 2m',
    visitId: 'RPT78901',
    openMrsId: '100GL-3',
    symptom: 'Fever',
    dateTime: '26 May, at 11:00 am',
    slotDay: 'Monday',
    clinic: 'TM Clinic 2',
    prescription: false,
    status: 'Completed',
    speciality: 'General physician',
    drName: 'Dr. Sharma',
    hwName: 'Nurse One',
    type: 'past',
    timeUntil: '',
  },
  {
    id: 4,
    patientName: 'Ramesh Patil',
    gender: 'M',
    age: '55y',
    visitId: 'RPT78902',
    openMrsId: '100GL-4',
    symptom: 'Headache',
    dateTime: '28 May, at 10:30 am',
    slotDay: 'Wednesday',
    clinic: 'TM Clinic 1',
    prescription: false,
    status: 'Scheduled',
    speciality: 'General physician',
    drName: 'Dr. Patel',
    hwName: 'Nurse Two',
    type: 'upcoming',
    timeUntil: 'in 2 Days at 10:30 am',
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
