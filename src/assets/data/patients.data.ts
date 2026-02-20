export interface Patient {
  id: number;
  name: string;
  age: string;
  date: string;
  clinic: string;
  complaint: string;
  time: string;
  type: string;
}

export const patientsData: Patient[] = [
  {
    id: 1,
    name: 'Sarrah Paul (F)',
    age: '41y 3m',
    date: '21 Apr, 2025',
    clinic: 'TM Clinic 2',
    complaint: 'Fever, Headache & Cough',
    time: '1 hr ago',
    type: 'Pendings',
  },
  {
    id: 2,
    name: 'Nikita Agrawal (F)',
    age: '61y 4m',
    date: '20 Apr, 2025',
    clinic: 'TM Clinic 2',
    complaint: 'Headache & Cough',
    time: '2 hr ago',
    type: 'Pendings',
  },
  {
    id: 3,
    name: 'Suresh Deshmukh (M)',
    age: '67y 4m',
    date: '18 Apr, 2025',
    clinic: 'TM Clinic 2',
    complaint: 'Chest Pain',
    time: '4 hr ago',
    type: 'Pendings',
  },
  {
    id: 4,
    name: 'Nirmala Sharma (F)',
    age: '45y 1m',
    date: '18 Apr, 2025',
    clinic: 'TM Clinic 2',
    complaint: 'Cough',
    time: '7 hr ago',
    type: 'Pendings',
  },
  {
    id: 5,
    name: 'Kashinath Patil (M)',
    age: '77y 6m',
    date: '18 Apr, 2025',
    clinic: 'TM Clinic 2',
    complaint: 'Fever',
    time: '1 day ago',
    type: 'upcoming',
  },
  {
    id: 6,
    name: 'Kamli Sharma (F)',
    age: '82y 6m',
    date: '17 Apr, 2025',
    clinic: 'TM Clinic 2',
    complaint: 'Neck Pain',
    time: '2 days ago',
    type: 'upcoming',
  },
];
