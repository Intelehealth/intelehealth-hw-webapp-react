import { describe, expect, it } from 'vitest';
import { patientInfoSchema } from '../../../../../../modules/patient/add/steps/patient-info/patient-info.component';

describe('patientInfoSchema (merged personal + address + other)', () => {
  const validData = {
    // personal
    firstName: 'John',
    middleName: '',
    lastName: 'Doe',
    gender: 'M',
    dateOfBirth: '1990-01-01',
    age: '34',
    phoneNumber: '1234567890',
    phoneNumberCountryCode: '+91',
    contactType: 'Family',
    emergencyContactName: 'Jane',
    emergencyContactNumber: '0987654321',
    emergencyContactNumberCountryCode: '+91',
    profilePhoto: null,
    // address
    postalCode: '123456',
    country: 'India',
    state: 'Maharashtra',
    district: 'Mumbai',
    city: 'Mumbai',
    correspondingAddress1: 'Street 1',
    correspondingAddress2: 'Area 2',
    // other
    sonDaughterWifeOf: '',
    occupation: '',
    caste: '',
    education: 'Graduate',
    economicStatus: '',
  };

  it('passes when all required fields from all three sections are valid', async () => {
    await expect(patientInfoSchema.isValid(validData)).resolves.toBe(true);
  });

  it('fails when a personal-info field is missing (firstName)', async () => {
    const data = { ...validData, firstName: '' };
    await expect(patientInfoSchema.validate(data)).rejects.toThrow(
      'First name is required'
    );
  });

  it('fails when an address-info field is missing (country)', async () => {
    const data = { ...validData, country: '' };
    await expect(patientInfoSchema.isValid(data)).resolves.toBe(false);
  });

  it('fails when an other-info field is missing (education)', async () => {
    const data = { ...validData, education: '' };
    await expect(patientInfoSchema.validate(data)).rejects.toThrow(
      'Education is required'
    );
  });

  it('enforces 6-digit Indian postal code from the address section', async () => {
    const data = { ...validData, postalCode: '12345' };
    await expect(patientInfoSchema.validate(data)).rejects.toThrow(
      'Postal Code must be exactly 6 digits for India'
    );
  });
});
