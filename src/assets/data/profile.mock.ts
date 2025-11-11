import type { Profile } from '../../types/profile.types';

export const mockProfile: Profile = {
  id: 'hw-001',
  firstName: 'Vimla',
  middleName: 'Ramnath',
  lastName: 'Devi',
  email: 'devi@intelehealth.org',
  phone: '9876543210',
  dateOfBirth: '1996-05-10',
  gender: 'male',
  address: {
    street: '123 Healthcare Drive',
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    zipCode: '94102',
  },
  avatar: '/src/assets/images/user-default.png',
  role: 'Health Worker',
  department: 'Community Health',
  employeeId: 'HW-2024-001',
  joinDate: '2020-01-15',
  lastLogin: '2024-01-15T10:30:00Z',
  isActive: true,
  username: 'nurse1',
  age: 28,
  setupLocation: 'sf-clinic',
  preferences: {
    language: 'en',
    timezone: 'Asia/Kolkata',
    notifications: {
      email: true,
      sms: false,
      push: false,
    },
  },
};
