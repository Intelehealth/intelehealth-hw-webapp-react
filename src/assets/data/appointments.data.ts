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
