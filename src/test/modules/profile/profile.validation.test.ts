import { describe, expect, it } from 'vitest';
import { profileSchema } from '../../../modules/profile/profile.validation';

const baseValidProfile = {
  username: 'jdoe',
  firstName: 'John',
  middleName: '',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '9876543210',
  dateOfBirth: '1990-01-01',
  gender: 'male' as const,
  setupLocation: 'Mumbai',
};

const validateEmail = (email: string) =>
  profileSchema.validateAt('email', { ...baseValidProfile, email });

describe('profileSchema email validation', () => {
  it('accepts a standard email with .com TLD', async () => {
    await expect(validateEmail('john@example.com')).resolves.toBe(
      'john@example.com'
    );
  });

  it('accepts an email with a country-code TLD', async () => {
    await expect(validateEmail('user@example.in')).resolves.toBe(
      'user@example.in'
    );
  });

  it('accepts a multi-part domain like co.in', async () => {
    await expect(validateEmail('user@example.co.in')).resolves.toBe(
      'user@example.co.in'
    );
  });

  it('accepts a new gTLD like .tech', async () => {
    await expect(validateEmail('user@example.tech')).resolves.toBe(
      'user@example.tech'
    );
  });

  it('trims surrounding whitespace', async () => {
    await expect(validateEmail('  john@example.com  ')).resolves.toBe(
      'john@example.com'
    );
  });

  it('rejects an empty email as required', async () => {
    await expect(validateEmail('')).rejects.toThrow('Email is required');
  });

  it('rejects an email missing the @ symbol', async () => {
    await expect(validateEmail('johnexample.com')).rejects.toThrow(
      'Email is invalid'
    );
  });

  it('rejects an email missing a TLD', async () => {
    await expect(validateEmail('john@example')).rejects.toThrow(
      'Email is invalid'
    );
  });

  it('rejects a single-letter TLD', async () => {
    await expect(validateEmail('john@example.c')).rejects.toThrow(
      'Email is invalid'
    );
  });

  it('rejects a made-up TLD not in the allowlist', async () => {
    await expect(validateEmail('john@example.tecloy')).rejects.toThrow(
      'Email is invalid'
    );
  });

  it('rejects a typo TLD like .or', async () => {
    await expect(validateEmail('john@example.or')).rejects.toThrow(
      'Email is invalid'
    );
  });
});
