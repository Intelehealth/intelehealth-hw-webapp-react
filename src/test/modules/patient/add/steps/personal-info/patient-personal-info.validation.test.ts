import { describe, expect, it } from 'vitest';
import { patientPersonalInfoSchema } from '../../../../../../modules/patient/add/steps/personal-info/patient-personal-info.validation';

describe('patientPersonalInfoSchema', () => {
  const validData = {
    firstName: 'John',
    middleName: 'M',
    lastName: 'Doe',
    gender: 'M',
    dateOfBirth: '1990-01-01',
    age: '33',
    phoneNumberCountryCode: '+91',
    phoneNumber: '1234567890',
    contactType: 'Family',
    emergencyContactName: 'Jane Doe',
    emergencyContactNumber: '9876543210',
    emergencyContactNumberCountryCode: '+91',
    profilePhoto: null,
  };

  describe('firstName validation', () => {
    it('should validate when firstName is provided', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when firstName is missing', async () => {
      const data = { ...validData, firstName: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when firstName is missing', async () => {
      const data = { ...validData, firstName: '' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'First name is required'
        );
      }
    });
  });

  describe('middleName validation', () => {
    it('should validate when middleName is provided', async () => {
      const data = { ...validData, middleName: 'Middle' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should validate when middleName is empty', async () => {
      const data = { ...validData, middleName: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should have default value of empty string', async () => {
      const data = { ...validData };
      delete (data as { middleName?: string }).middleName;
      const validated = await patientPersonalInfoSchema.validate(data);
      expect(validated.middleName).toBe('');
    });
  });

  describe('lastName validation', () => {
    it('should validate when lastName is provided', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when lastName is missing', async () => {
      const data = { ...validData, lastName: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when lastName is missing', async () => {
      const data = { ...validData, lastName: '' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Last name is required'
        );
      }
    });
  });

  describe('gender validation', () => {
    it('should validate when gender is provided', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when gender is missing', async () => {
      const data = { ...validData, gender: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when gender is missing', async () => {
      const data = { ...validData, gender: '' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Gender is required'
        );
      }
    });

    it('should validate with different gender values', async () => {
      const maleData = { ...validData, gender: 'M' };
      const femaleData = { ...validData, gender: 'F' };
      const otherData = { ...validData, gender: 'O' };

      expect(await patientPersonalInfoSchema.isValid(maleData)).toBe(true);
      expect(await patientPersonalInfoSchema.isValid(femaleData)).toBe(true);
      expect(await patientPersonalInfoSchema.isValid(otherData)).toBe(true);
    });
  });

  describe('dateOfBirth and age validation', () => {
    it('should validate when both dateOfBirth and age are provided', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should validate when only dateOfBirth is provided', async () => {
      const data = { ...validData, age: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should validate when only age is provided', async () => {
      const data = { ...validData, dateOfBirth: '', age: '33' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should fail when both dateOfBirth and age are missing', async () => {
      const data = { ...validData, dateOfBirth: '', age: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when both dateOfBirth and age are missing', async () => {
      const data = { ...validData, dateOfBirth: '', age: '' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Date of birth or age is required'
        );
      }
    });

    it('should fail when both dateOfBirth and age are undefined', async () => {
      const data = { ...validData };
      delete (data as { dateOfBirth?: string }).dateOfBirth;
      delete (data as { age?: string }).age;
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when both dateOfBirth and age are undefined', async () => {
      const data = { ...validData };
      delete (data as { dateOfBirth?: string }).dateOfBirth;
      delete (data as { age?: string }).age;
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Date of birth or age is required'
        );
      }
    });

    it('should validate when age is undefined but dateOfBirth is provided', async () => {
      const data = { ...validData };
      delete (data as { age?: string }).age;
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should fail when age exceeds 120', async () => {
      const data = { ...validData, age: '121' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when age exceeds 120', async () => {
      const data = { ...validData, age: '121' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Age must be between 0 and 120'
        );
      }
    });

    it('should fail when age is negative', async () => {
      const data = { ...validData, age: '-1' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when age is negative', async () => {
      const data = { ...validData, age: '-1' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Age must be between 0 and 120'
        );
      }
    });

    it('should fail when age contains non-numeric characters', async () => {
      const data = { ...validData, age: 'abc' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when age contains non-numeric characters', async () => {
      const data = { ...validData, age: 'abc' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Age must be between 0 and 120'
        );
      }
    });

    it('should validate with age 0', async () => {
      const data = { ...validData, age: '0' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should validate with age 120', async () => {
      const data = { ...validData, age: '120' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should validate with 1 character age', async () => {
      const data = { ...validData, age: '5' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should validate with 2 character age', async () => {
      const data = { ...validData, age: '25' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should validate with 3 character age', async () => {
      const data = { ...validData, age: '100' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should fail when age has decimal point', async () => {
      const data = { ...validData, age: '25.5' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when age has decimal point', async () => {
      const data = { ...validData, age: '25.5' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Age must be between 0 and 120'
        );
      }
    });

    it('should validate when dateOfBirth is undefined and age is provided', async () => {
      const data = { ...validData, age: '30' };
      delete (data as { dateOfBirth?: string }).dateOfBirth;
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });
  });

  describe('phoneNumber validation', () => {
    it('should validate when phoneNumber is provided', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when phoneNumber is missing', async () => {
      const data = { ...validData, phoneNumber: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when phoneNumber is missing', async () => {
      const data = { ...validData, phoneNumber: '' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Phone number is required'
        );
      }
    });
  });

  describe('phoneNumberCountryCode validation', () => {
    it('should validate when phoneNumberCountryCode is provided', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when phoneNumberCountryCode is missing', async () => {
      const data = { ...validData, phoneNumberCountryCode: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when phoneNumberCountryCode is missing', async () => {
      const data = { ...validData, phoneNumberCountryCode: '' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Country code is required'
        );
      }
    });
  });

  describe('contactType validation', () => {
    it('should validate when contactType is provided', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when contactType is missing', async () => {
      const data = { ...validData, contactType: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when contactType is missing', async () => {
      const data = { ...validData, contactType: '' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Contact type is required'
        );
      }
    });
  });

  describe('emergencyContactName validation', () => {
    it('should validate when emergencyContactName is provided', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when emergencyContactName is missing', async () => {
      const data = { ...validData, emergencyContactName: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when emergencyContactName is missing', async () => {
      const data = { ...validData, emergencyContactName: '' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Emergency contact name is required'
        );
      }
    });
  });

  describe('emergencyContactNumber validation', () => {
    it('should validate when emergencyContactNumber is provided', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when emergencyContactNumber is missing', async () => {
      const data = { ...validData, emergencyContactNumber: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when emergencyContactNumber is missing', async () => {
      const data = { ...validData, emergencyContactNumber: '' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Emergency contact number is required'
        );
      }
    });
  });

  describe('emergencyContactNumberCountryCode validation', () => {
    it('should validate when emergencyContactNumberCountryCode is provided', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when emergencyContactNumberCountryCode is missing', async () => {
      const data = { ...validData, emergencyContactNumberCountryCode: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when emergencyContactNumberCountryCode is missing', async () => {
      const data = { ...validData, emergencyContactNumberCountryCode: '' };
      try {
        await patientPersonalInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Emergency contact number country code is required'
        );
      }
    });
  });

  describe('profilePhoto validation', () => {
    it('should validate when profilePhoto is null', async () => {
      const data = { ...validData, profilePhoto: null };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should validate when profilePhoto is a string', async () => {
      const data = { ...validData, profilePhoto: 'data:image/png;base64,abc' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should validate when profilePhoto is empty string', async () => {
      const data = { ...validData, profilePhoto: '' };
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should validate when profilePhoto is not provided', async () => {
      const data = { ...validData };
      delete (data as { profilePhoto?: string | null }).profilePhoto;
      const result = await patientPersonalInfoSchema.isValid(data);
      expect(result).toBe(true);
    });
  });

  describe('complete schema validation', () => {
    it('should validate with all valid fields', async () => {
      const result = await patientPersonalInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should return validated data with all fields', async () => {
      const validated = await patientPersonalInfoSchema.validate(validData);
      expect(validated).toEqual(validData);
    });

    it('should handle validation errors for multiple fields', async () => {
      const data = {
        ...validData,
        firstName: '',
        lastName: '',
        gender: '',
      };

      try {
        await patientPersonalInfoSchema.validate(data, { abortEarly: false });
      } catch (error) {
        expect((error as { errors: string[] }).errors).toHaveLength(3);
      }
    });
  });
});
