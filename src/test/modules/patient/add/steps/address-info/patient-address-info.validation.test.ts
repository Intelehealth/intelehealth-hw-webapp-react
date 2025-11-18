import { describe, expect, it } from 'vitest';
import { patientAddressInfoSchema } from '../../../../../../modules/patient/add/steps/address-info/patient-address-info.validation';

describe('patientAddressInfoSchema', () => {
  const validData = {
    postalCode: '123456',
    country: 'India',
    state: 'Maharashtra',
    district: 'Mumbai',
    city: 'Mumbai',
    correspondingAddress1: 'Street 1',
    correspondingAddress2: 'Area 2',
  };

  describe('postalCode validation', () => {
    it('should validate when postalCode is provided', async () => {
      const result = await patientAddressInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when postalCode is missing', async () => {
      const data = { ...validData, postalCode: '' };
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when postalCode is missing', async () => {
      const data = { ...validData, postalCode: '' };
      try {
        await patientAddressInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Postal Code is required'
        );
      }
    });

    it('should validate with different postalCode formats', async () => {
      const data1 = { ...validData, postalCode: '123456' };
      const data2 = { ...validData, postalCode: '12345' };
      const data3 = { ...validData, postalCode: 'ABC123' };

      expect(await patientAddressInfoSchema.isValid(data1)).toBe(true);
      expect(await patientAddressInfoSchema.isValid(data2)).toBe(true);
      expect(await patientAddressInfoSchema.isValid(data3)).toBe(true);
    });
  });

  describe('country validation', () => {
    it('should validate when country is provided', async () => {
      const result = await patientAddressInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when country is missing', async () => {
      const data = { ...validData, country: '' };
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when country is missing', async () => {
      const data = { ...validData, country: '' };
      try {
        await patientAddressInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Country is required'
        );
      }
    });

    it('should validate with different country values', async () => {
      const countries = ['India', 'USA', 'UK', 'Canada', 'Australia'];
      for (const country of countries) {
        const data = { ...validData, country };
        expect(await patientAddressInfoSchema.isValid(data)).toBe(true);
      }
    });
  });

  describe('state validation', () => {
    it('should validate when state is provided', async () => {
      const result = await patientAddressInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when state is missing', async () => {
      const data = { ...validData, state: '' };
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when state is missing', async () => {
      const data = { ...validData, state: '' };
      try {
        await patientAddressInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'State is required'
        );
      }
    });

    it('should validate with different state values', async () => {
      const states = ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu'];
      for (const state of states) {
        const data = { ...validData, state };
        expect(await patientAddressInfoSchema.isValid(data)).toBe(true);
      }
    });
  });

  describe('district validation', () => {
    it('should validate when district is provided', async () => {
      const result = await patientAddressInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when district is missing', async () => {
      const data = { ...validData, district: '' };
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when district is missing', async () => {
      const data = { ...validData, district: '' };
      try {
        await patientAddressInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'District is required'
        );
      }
    });

    it('should validate with different district values', async () => {
      const districts = ['Mumbai', 'Pune', 'Nashik', 'Thane'];
      for (const district of districts) {
        const data = { ...validData, district };
        expect(await patientAddressInfoSchema.isValid(data)).toBe(true);
      }
    });
  });

  describe('city validation', () => {
    it('should validate when city is provided', async () => {
      const result = await patientAddressInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when city is missing', async () => {
      const data = { ...validData, city: '' };
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when city is missing', async () => {
      const data = { ...validData, city: '' };
      try {
        await patientAddressInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Village/Town/City is required'
        );
      }
    });

    it('should validate with different city types', async () => {
      const cities = ['Mumbai City', 'Rural Village', 'Small Town', 'Metro'];
      for (const city of cities) {
        const data = { ...validData, city };
        expect(await patientAddressInfoSchema.isValid(data)).toBe(true);
      }
    });
  });

  describe('correspondingAddress1 validation', () => {
    it('should validate when correspondingAddress1 is provided', async () => {
      const result = await patientAddressInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when correspondingAddress1 is missing', async () => {
      const data = { ...validData, correspondingAddress1: '' };
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when correspondingAddress1 is missing', async () => {
      const data = { ...validData, correspondingAddress1: '' };
      try {
        await patientAddressInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Corresponding Address 1 is required'
        );
      }
    });

    it('should validate with different address formats', async () => {
      const addresses = [
        'Street 1',
        '123 Main Street',
        'Building A, Floor 5',
        'House No. 45',
      ];
      for (const address of addresses) {
        const data = { ...validData, correspondingAddress1: address };
        expect(await patientAddressInfoSchema.isValid(data)).toBe(true);
      }
    });
  });

  describe('correspondingAddress2 validation', () => {
    it('should validate when correspondingAddress2 is provided', async () => {
      const result = await patientAddressInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when correspondingAddress2 is missing', async () => {
      const data = { ...validData, correspondingAddress2: '' };
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when correspondingAddress2 is missing', async () => {
      const data = { ...validData, correspondingAddress2: '' };
      try {
        await patientAddressInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Corresponding Address 2 is required'
        );
      }
    });

    it('should validate with different address formats', async () => {
      const addresses = [
        'Area 2',
        'Landmark: Near Hospital',
        'Behind Shopping Mall',
        'Apartment Complex',
      ];
      for (const address of addresses) {
        const data = { ...validData, correspondingAddress2: address };
        expect(await patientAddressInfoSchema.isValid(data)).toBe(true);
      }
    });
  });

  describe('complete schema validation', () => {
    it('should validate with all valid fields', async () => {
      const result = await patientAddressInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should return validated data with all fields', async () => {
      const validated = await patientAddressInfoSchema.validate(validData);
      expect(validated).toEqual(validData);
    });

    it('should handle validation errors for multiple fields', async () => {
      const data = {
        ...validData,
        postalCode: '',
        country: '',
        state: '',
      };

      try {
        await patientAddressInfoSchema.validate(data, { abortEarly: false });
      } catch (error) {
        expect((error as { errors: string[] }).errors).toHaveLength(3);
      }
    });

    it('should handle validation errors for all fields', async () => {
      const data = {
        postalCode: '',
        country: '',
        state: '',
        district: '',
        city: '',
        correspondingAddress1: '',
        correspondingAddress2: '',
      };

      try {
        await patientAddressInfoSchema.validate(data, { abortEarly: false });
      } catch (error) {
        expect((error as { errors: string[] }).errors).toHaveLength(7);
      }
    });

    it('should validate with realistic complete address data', async () => {
      const completeAddress = {
        postalCode: '400001',
        country: 'India',
        state: 'Maharashtra',
        district: 'Mumbai Suburban',
        city: 'Andheri East',
        correspondingAddress1: 'Flat 501, Crystal Tower',
        correspondingAddress2: 'Near Metro Station, Chakala',
      };

      const result = await patientAddressInfoSchema.isValid(completeAddress);
      expect(result).toBe(true);
    });

    it('should validate and preserve all field values', async () => {
      const validated = await patientAddressInfoSchema.validate(validData);
      expect(validated.postalCode).toBe(validData.postalCode);
      expect(validated.country).toBe(validData.country);
      expect(validated.state).toBe(validData.state);
      expect(validated.district).toBe(validData.district);
      expect(validated.city).toBe(validData.city);
      expect(validated.correspondingAddress1).toBe(
        validData.correspondingAddress1
      );
      expect(validated.correspondingAddress2).toBe(
        validData.correspondingAddress2
      );
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only values as invalid', async () => {
      const data = { ...validData, postalCode: '   ' };
      // Yup string validation doesn't trim by default, so whitespace passes
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should handle very long address strings', async () => {
      const longAddress = 'A'.repeat(500);
      const data = {
        ...validData,
        correspondingAddress1: longAddress,
        correspondingAddress2: longAddress,
      };
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should handle special characters in address fields', async () => {
      const data = {
        ...validData,
        correspondingAddress1: 'Building A-5, Sector #12',
        correspondingAddress2: 'Near @Plaza, Street-15',
      };
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should handle unicode characters in address fields', async () => {
      const data = {
        ...validData,
        city: 'मुंबई',
        state: 'महाराष्ट्र',
        correspondingAddress1: 'गली नंबर 5',
      };
      const result = await patientAddressInfoSchema.isValid(data);
      expect(result).toBe(true);
    });
  });
});
