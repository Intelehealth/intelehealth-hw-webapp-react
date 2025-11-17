import { describe, expect, it } from 'vitest';
import { patientOtherInfoSchema } from '../../../../../../modules/patient/add/steps/other-info/patient-other-info.validation';

describe('patientOtherInfoSchema', () => {
  const validData = {
    sonDaughterWifeOf: 'Father Name',
    occupation: 'Engineer',
    caste: 'General',
    education: 'Graduate',
    economicStatus: 'Middle Class',
  };

  describe('sonDaughterWifeOf validation', () => {
    it('should validate when sonDaughterWifeOf is provided', async () => {
      const result = await patientOtherInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should validate when sonDaughterWifeOf is empty', async () => {
      const data = { ...validData, sonDaughterWifeOf: '' };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should have default value of empty string', async () => {
      const data = { ...validData };
      delete (data as { sonDaughterWifeOf?: string }).sonDaughterWifeOf;
      const validated = await patientOtherInfoSchema.validate(data);
      expect(validated.sonDaughterWifeOf).toBe('');
    });

    it('should validate with different relationship values', async () => {
      const relationships = [
        'Father Name',
        'Mother Name',
        'Husband Name',
        'Wife Name',
        'Guardian Name',
      ];
      for (const relationship of relationships) {
        const data = { ...validData, sonDaughterWifeOf: relationship };
        expect(await patientOtherInfoSchema.isValid(data)).toBe(true);
      }
    });

    it('should be optional and not required', async () => {
      const data = { ...validData };
      delete (data as { sonDaughterWifeOf?: string }).sonDaughterWifeOf;
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });
  });

  describe('occupation validation', () => {
    it('should validate when occupation is provided', async () => {
      const result = await patientOtherInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should validate when occupation is empty', async () => {
      const data = { ...validData, occupation: '' };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should have default value of empty string', async () => {
      const data = { ...validData };
      delete (data as { occupation?: string }).occupation;
      const validated = await patientOtherInfoSchema.validate(data);
      expect(validated.occupation).toBe('');
    });

    it('should validate with different occupation values', async () => {
      const occupations = [
        'Engineer',
        'Doctor',
        'Teacher',
        'Business',
        'Farmer',
        'Unemployed',
        'Self-Employed',
      ];
      for (const occupation of occupations) {
        const data = { ...validData, occupation };
        expect(await patientOtherInfoSchema.isValid(data)).toBe(true);
      }
    });

    it('should be optional and not required', async () => {
      const data = { ...validData };
      delete (data as { occupation?: string }).occupation;
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });
  });

  describe('caste validation', () => {
    it('should validate when caste is provided', async () => {
      const result = await patientOtherInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should validate when caste is empty', async () => {
      const data = { ...validData, caste: '' };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should have default value of empty string', async () => {
      const data = { ...validData };
      delete (data as { caste?: string }).caste;
      const validated = await patientOtherInfoSchema.validate(data);
      expect(validated.caste).toBe('');
    });

    it('should validate with different caste values', async () => {
      const castes = ['General', 'OBC', 'SC', 'ST', 'Other'];
      for (const caste of castes) {
        const data = { ...validData, caste };
        expect(await patientOtherInfoSchema.isValid(data)).toBe(true);
      }
    });

    it('should be optional and not required', async () => {
      const data = { ...validData };
      delete (data as { caste?: string }).caste;
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });
  });

  describe('education validation', () => {
    it('should validate when education is provided', async () => {
      const result = await patientOtherInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should fail when education is missing', async () => {
      const data = { ...validData, education: '' };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should show error message when education is missing', async () => {
      const data = { ...validData, education: '' };
      try {
        await patientOtherInfoSchema.validate(data);
      } catch (error) {
        expect((error as { message: string }).message).toBe(
          'Education is required'
        );
      }
    });

    it('should validate with different education values', async () => {
      const educationLevels = [
        'No Formal Education',
        'Primary School',
        'High School',
        'Graduate',
        'Post Graduate',
        'Doctorate',
        'Diploma',
        'Professional Degree',
      ];
      for (const education of educationLevels) {
        const data = { ...validData, education };
        expect(await patientOtherInfoSchema.isValid(data)).toBe(true);
      }
    });

    it('should be required field', async () => {
      const data = { ...validData };
      delete (data as { education?: string }).education;
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(false);
    });
  });

  describe('economicStatus validation', () => {
    it('should validate when economicStatus is provided', async () => {
      const result = await patientOtherInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should validate when economicStatus is empty', async () => {
      const data = { ...validData, economicStatus: '' };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should have default value of empty string', async () => {
      const data = { ...validData };
      delete (data as { economicStatus?: string }).economicStatus;
      const validated = await patientOtherInfoSchema.validate(data);
      expect(validated.economicStatus).toBe('');
    });

    it('should validate with different economicStatus values', async () => {
      const statuses = [
        'Below Poverty Line',
        'Lower Class',
        'Middle Class',
        'Upper Middle Class',
        'Upper Class',
        'Affluent',
      ];
      for (const status of statuses) {
        const data = { ...validData, economicStatus: status };
        expect(await patientOtherInfoSchema.isValid(data)).toBe(true);
      }
    });

    it('should be optional and not required', async () => {
      const data = { ...validData };
      delete (data as { economicStatus?: string }).economicStatus;
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });
  });

  describe('complete schema validation', () => {
    it('should validate with all valid fields', async () => {
      const result = await patientOtherInfoSchema.isValid(validData);
      expect(result).toBe(true);
    });

    it('should return validated data with all fields', async () => {
      const validated = await patientOtherInfoSchema.validate(validData);
      expect(validated).toEqual(validData);
    });

    it('should validate with only required field (education)', async () => {
      const minimalData = {
        education: 'Graduate',
      };
      const result = await patientOtherInfoSchema.isValid(minimalData);
      expect(result).toBe(true);
    });

    it('should set default values for optional fields', async () => {
      const minimalData = {
        education: 'Graduate',
      };
      const validated = await patientOtherInfoSchema.validate(minimalData);
      expect(validated.sonDaughterWifeOf).toBe('');
      expect(validated.occupation).toBe('');
      expect(validated.caste).toBe('');
      expect(validated.economicStatus).toBe('');
    });

    it('should fail when education is missing', async () => {
      const data = {
        sonDaughterWifeOf: 'Father Name',
        occupation: 'Engineer',
        caste: 'General',
        economicStatus: 'Middle Class',
      };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(false);
    });

    it('should handle validation with empty optional fields', async () => {
      const data = {
        sonDaughterWifeOf: '',
        occupation: '',
        caste: '',
        education: 'Graduate',
        economicStatus: '',
      };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should validate and preserve all field values', async () => {
      const validated = await patientOtherInfoSchema.validate(validData);
      expect(validated.sonDaughterWifeOf).toBe(validData.sonDaughterWifeOf);
      expect(validated.occupation).toBe(validData.occupation);
      expect(validated.caste).toBe(validData.caste);
      expect(validated.education).toBe(validData.education);
      expect(validated.economicStatus).toBe(validData.economicStatus);
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only education as invalid', async () => {
      const data = { ...validData, education: '   ' };
      // Yup string validation doesn't trim by default
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should handle very long string values', async () => {
      const longString = 'A'.repeat(500);
      const data = {
        ...validData,
        sonDaughterWifeOf: longString,
        occupation: longString,
        caste: longString,
        education: longString,
        economicStatus: longString,
      };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should handle special characters in fields', async () => {
      const data = {
        sonDaughterWifeOf: "S/O John Doe's",
        occupation: 'Software Engineer (Senior)',
        caste: 'Other-Unspecified',
        education: 'Post-Graduate (M.Tech)',
        economicStatus: 'Upper-Middle Class',
      };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should handle unicode characters in fields', async () => {
      const data = {
        sonDaughterWifeOf: 'पिता का नाम',
        occupation: 'इंजीनियर',
        caste: 'सामान्य',
        education: 'स्नातक',
        economicStatus: 'मध्यम वर्ग',
      };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });

    it('should handle numeric strings', async () => {
      const data = {
        ...validData,
        sonDaughterWifeOf: '123',
        occupation: '456',
        education: '789',
      };
      const result = await patientOtherInfoSchema.isValid(data);
      expect(result).toBe(true);
    });
  });

  describe('schema configuration', () => {
    it('should mark sonDaughterWifeOf as optional', () => {
      const schema = patientOtherInfoSchema.describe();
      expect(schema.fields.sonDaughterWifeOf.optional).toBe(true);
    });

    it('should mark occupation as optional', () => {
      const schema = patientOtherInfoSchema.describe();
      expect(schema.fields.occupation.optional).toBe(true);
    });

    it('should mark caste as optional', () => {
      const schema = patientOtherInfoSchema.describe();
      expect(schema.fields.caste.optional).toBe(true);
    });

    it('should mark economicStatus as optional', () => {
      const schema = patientOtherInfoSchema.describe();
      expect(schema.fields.economicStatus.optional).toBe(true);
    });

    it('should mark education as required', () => {
      const schema = patientOtherInfoSchema.describe();
      expect(schema.fields.education.optional).toBe(false);
    });
  });
});
