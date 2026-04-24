export interface HelpVideoProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  showAll?: boolean;
}

export interface HelpFaqProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export const helpCategories = [
  'All',
  'Check-up',
  'Appointment',
  'Registration',
  'Visit',
];

export const videoCategories = [
  'All',
  'Check-up',
  'Appointment',
  'Registration',
  'Visit',
];

export const videoList = [
  {
    title: 'Treat mild fever at home',
    duration: '2:30',
    thumbnail: 'https://img.youtube.com/vi/TqNiRWOBNTs/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=TqNiRWOBNTs',
    category: 'Check-up',
  },
  {
    title: 'What is Anemia?',
    duration: '3:45',
    thumbnail: 'https://img.youtube.com/vi/LCG6eJ0j-Cg/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=LCG6eJ0j-Cg',
    category: 'Check-up',
  },
  {
    title: 'Treat cough at home',
    duration: '1:15',
    thumbnail: 'https://img.youtube.com/vi/qbDHSwMOYg4/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=qbDHSwMOYg4',
    category: 'Check-up',
  },
  {
    title: 'Benefits of walking',
    duration: '4:10',
    thumbnail: 'https://img.youtube.com/vi/E0UAHVoqcm0/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=E0UAHVoqcm0',
    category: 'Visit',
  },
];

export const questionAnswerList = [
  {
    question: 'How intelehealth works?',
    answer:
      "Intelehealth has developed a comprehensive technology platform that Governments, NGO's and Hospitals can use to deliver telemedicine-based care to their beneficiaries. Built with powerful features like a digital assistant with 80+ care protocols makes it easy for any organization to use and adapt it to meet their needs!",
    category: 'Check-up',
  },
  {
    question: 'Why Intelehealth exists?',
    answer:
      'Team at Intelehealth has a vision of "Health for all". Thus, Intelehealth exists to keep this vision of universal health coverage alive. It strive to achieve that every single citizen in this world should be able to receive the health services they need, when and where they need them, without facing any financial hardship.',
    category: 'Check-up',
  },
  {
    question: 'How intelehealth help patients?',
    answer:
      "Our Telemedicine app makes specialist doctor consultations available to the rural populations coming to primary healthcare. Using app, the HWs are able to capture details of patient's medication history, diagnostics, prescriptions and treatment. All these details our then shared with the remote doctors to provide consultation. It helps in saving patients from traveling miles for healthcare.",
    category: 'Check-up',
  },
  {
    question: 'How to register new patient?',
    answer:
      'To register a patient, click on the "Add Patient" tab on the home screen. Read out the privacy policy to the patient. If they accept, fill out all the details to successfully register a patient.',
    category: 'Registration',
  },
  {
    question: 'How to add a new visit?',
    answer:
      'Once the patient is registered, on patient details screen, click "Start Visit" button to create a new visit for the patient.',
    category: 'Visit',
  },
  {
    question: 'How to book an appointment?',
    answer:
      'Once the patient is registered and the visit is created, on visit summary screen, click "Appointment" button. Select the date and time (from available slots) which is suitable to the patient. Click on "Book Appointment"',
    category: 'Appointment',
  },
];
