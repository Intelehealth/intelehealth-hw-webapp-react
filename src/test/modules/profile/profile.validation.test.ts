import { describe, expect, it } from 'vitest';
import { profileSchema } from '../../../modules/profile/profile.validation';

describe('profileSchema', () => {
  it('should validate a complete profile successfully', async () => {
    const validProfile = {
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      setupLocation: 'sf-clinic',
      middleName: 'Michael',
    };

    const result = await profileSchema.isValid(validProfile);
    expect(result).toBe(true);
  });

  it('should require firstName', async () => {
    const invalidProfile = {
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      setupLocation: 'sf-clinic',
    };

    const result = await profileSchema.isValid(invalidProfile);
    expect(result).toBe(false);
  });

  it('should require lastName', async () => {
    const invalidProfile = {
      firstName: 'John',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      setupLocation: 'sf-clinic',
    };

    const result = await profileSchema.isValid(invalidProfile);
    expect(result).toBe(false);
  });

  it('should require email', async () => {
    const invalidProfile = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      setupLocation: 'sf-clinic',
    };

    const result = await profileSchema.isValid(invalidProfile);
    expect(result).toBe(false);
  });

  it('should require phone', async () => {
    const invalidProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      setupLocation: 'sf-clinic',
    };

    const result = await profileSchema.isValid(invalidProfile);
    expect(result).toBe(false);
  });

  it('should require dateOfBirth', async () => {
    const invalidProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      gender: 'male',
      setupLocation: 'sf-clinic',
    };

    const result = await profileSchema.isValid(invalidProfile);
    expect(result).toBe(false);
  });

  it('should require gender', async () => {
    const invalidProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      setupLocation: 'sf-clinic',
    };

    const result = await profileSchema.isValid(invalidProfile);
    expect(result).toBe(false);
  });

  it('should require setupLocation', async () => {
    const invalidProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
    };

    const result = await profileSchema.isValid(invalidProfile);
    expect(result).toBe(false);
  });

  it('should validate email format', async () => {
    const invalidProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      setupLocation: 'sf-clinic',
    };

    const result = await profileSchema.isValid(invalidProfile);
    expect(result).toBe(false);
  });

  it('should validate gender enum values', async () => {
    const invalidProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'invalid-gender',
      setupLocation: 'sf-clinic',
    };

    const result = await profileSchema.isValid(invalidProfile);
    expect(result).toBe(false);
  });

  it('should accept valid gender values', async () => {
    const validGenders = ['male', 'female', 'other'];

    for (const gender of validGenders) {
      const profile = {
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender,
        setupLocation: 'sf-clinic',
        middleName: 'Michael',
      };

      const result = await profileSchema.isValid(profile);
      expect(result).toBe(true);
    }
  });

  it('should trim string values', async () => {
    const profileWithSpaces = {
      username: '  johndoe  ',
      firstName: '  John  ',
      middleName: '  Michael  ',
      lastName: '  Doe  ',
      email: '  john@example.com  ',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      setupLocation: 'sf-clinic',
    };

    const result = await profileSchema.validate(profileWithSpaces);
    expect(result.username).toBe('johndoe');
    expect(result.firstName).toBe('John');
    expect(result.middleName).toBe('Michael');
    expect(result.lastName).toBe('Doe');
    expect(result.email).toBe('john@example.com');
  });

  it('should make username optional', async () => {
    const profileWithoutUsername = {
      username: '', // Empty string is allowed for defined() fields
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      setupLocation: 'sf-clinic',
      middleName: '',
    };

    const result = await profileSchema.isValid(profileWithoutUsername);
    expect(result).toBe(true);
  });

  it('should make middleName optional', async () => {
    const profileWithoutMiddleName = {
      username: '',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      setupLocation: 'sf-clinic',
      middleName: '', // Empty string is allowed for defined() fields
    };

    const result = await profileSchema.isValid(profileWithoutMiddleName);
    expect(result).toBe(true);
  });
});
