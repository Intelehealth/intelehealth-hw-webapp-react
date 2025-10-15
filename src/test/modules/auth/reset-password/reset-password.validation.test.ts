import { describe, expect, it } from 'vitest';
import { resetPasswordSchema } from '../../../../modules/auth/reset-password/reset-password.validation';

describe('resetPasswordSchema', () => {
  describe('newPassword validation', () => {
    it('should validate a valid password', async () => {
      const validData = {
        newPassword: 'ValidPass123',
        confirmPassword: 'ValidPass123',
      };
      
      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should require newPassword field', async () => {
      const invalidData = {
        confirmPassword: 'ValidPass123',
      };
      
      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow();
    });

    it('should require newPassword to be at least 6 characters', async () => {
      const invalidData = {
        newPassword: '12345',
        confirmPassword: '12345',
      };
      
      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should accept password with exactly 6 characters', async () => {
      const validData = {
        newPassword: '123456',
        confirmPassword: '123456',
      };
      
      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should accept password with more than 6 characters', async () => {
      const validData = {
        newPassword: 'VeryLongPassword123',
        confirmPassword: 'VeryLongPassword123',
      };
      
      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should accept empty string as valid (will be caught by required)', async () => {
      const invalidData = {
        newPassword: '',
        confirmPassword: '',
      };
      
      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow();
    });
  });

  describe('confirmPassword validation', () => {
    it('should require confirmPassword field', async () => {
      const invalidData = {
        newPassword: 'ValidPass123',
      };
      
      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Please confirm your password');
    });

    it('should require confirmPassword to match newPassword', async () => {
      const invalidData = {
        newPassword: 'ValidPass123',
        confirmPassword: 'DifferentPass123',
      };
      
      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Passwords must match');
    });

    it('should accept matching passwords', async () => {
      const validData = {
        newPassword: 'ValidPass123',
        confirmPassword: 'ValidPass123',
      };
      
      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should be case sensitive for password matching', async () => {
      const invalidData = {
        newPassword: 'ValidPass123',
        confirmPassword: 'validpass123',
      };
      
      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Passwords must match');
    });

    it('should handle empty confirmPassword', async () => {
      const invalidData = {
        newPassword: 'ValidPass123',
        confirmPassword: '',
      };
      
      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow();
    });
  });

  describe('Combined validation', () => {
    it('should validate both fields together', async () => {
      const validData = {
        newPassword: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      };
      
      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should fail if both fields are invalid', async () => {
      const invalidData = {
        newPassword: '123',
        confirmPassword: '456',
      };
      
      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow();
    });

    it('should fail if newPassword is valid but confirmPassword is different', async () => {
      const invalidData = {
        newPassword: 'ValidPass123',
        confirmPassword: 'DifferentPass123',
      };
      
      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Passwords must match');
    });

    it('should fail if confirmPassword matches but newPassword is too short', async () => {
      const invalidData = {
        newPassword: '123',
        confirmPassword: '123',
      };
      
      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Password must be at least 6 characters');
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in passwords', async () => {
      const validData = {
        newPassword: 'Pass@123#',
        confirmPassword: 'Pass@123#',
      };
      
      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should handle unicode characters', async () => {
      const validData = {
        newPassword: 'Páss123',
        confirmPassword: 'Páss123',
      };
      
      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'A'.repeat(1000);
      const validData = {
        newPassword: longPassword,
        confirmPassword: longPassword,
      };
      
      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should handle passwords with spaces', async () => {
      const validData = {
        newPassword: 'Pass 123',
        confirmPassword: 'Pass 123',
      };
      
      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });
  });

  describe('Schema structure', () => {
    it('should be a valid yup schema', () => {
      expect(resetPasswordSchema).toBeDefined();
      expect(typeof resetPasswordSchema.validate).toBe('function');
      expect(typeof resetPasswordSchema.isValid).toBe('function');
    });

    it('should have correct field names', () => {
      const schemaFields = Object.keys(resetPasswordSchema.fields);
      expect(schemaFields).toContain('newPassword');
      expect(schemaFields).toContain('confirmPassword');
      expect(schemaFields).toHaveLength(2);
    });
  });
});
