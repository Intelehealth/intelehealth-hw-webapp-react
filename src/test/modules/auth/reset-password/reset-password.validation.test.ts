import { describe, expect, it } from 'vitest';
import { resetPasswordSchema } from '../../../../modules/auth/reset-password/reset-password.validation';

describe('resetPasswordSchema', () => {
  describe('newPassword validation', () => {
    it('should validate a valid password', async () => {
      const validData = {
        newPassword: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
      };

      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should require newPassword field', async () => {
      const invalidData = {
        confirmPassword: 'ValidPass123!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow();
    });

    it('should require newPassword to be at least 8 characters', async () => {
      const invalidData = {
        newPassword: 'Pass1!',
        confirmPassword: 'Pass1!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should require uppercase letter in password', async () => {
      const invalidData = {
        newPassword: 'password123!',
        confirmPassword: 'password123!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    });

    it('should require lowercase letter in password', async () => {
      const invalidData = {
        newPassword: 'PASSWORD123!',
        confirmPassword: 'PASSWORD123!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    });

    it('should require number in password', async () => {
      const invalidData = {
        newPassword: 'ValidPass!',
        confirmPassword: 'ValidPass!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    });

    it('should require special character in password', async () => {
      const invalidData = {
        newPassword: 'ValidPass123',
        confirmPassword: 'ValidPass123',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    });

    it('should accept password with exactly 8 characters and all requirements', async () => {
      const validData = {
        newPassword: 'Valid1@a',
        confirmPassword: 'Valid1@a',
      };

      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should accept password with more than 8 characters', async () => {
      const validData = {
        newPassword: 'VeryLongPassword123!',
        confirmPassword: 'VeryLongPassword123!',
      };

      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject empty string', async () => {
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
        newPassword: 'ValidPass123!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Please confirm your password');
    });

    it('should require confirmPassword to match newPassword', async () => {
      const invalidData = {
        newPassword: 'ValidPass123!',
        confirmPassword: 'DifferentPass123!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Passwords must match');
    });

    it('should accept matching passwords', async () => {
      const validData = {
        newPassword: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
      };

      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should be case sensitive for password matching', async () => {
      const invalidData = {
        newPassword: 'ValidPass123!',
        confirmPassword: 'validpass123!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Passwords must match');
    });

    it('should handle empty confirmPassword', async () => {
      const invalidData = {
        newPassword: 'ValidPass123!',
        confirmPassword: '',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow();
    });
  });

  describe('Combined validation', () => {
    it('should validate both fields together', async () => {
      const validData = {
        newPassword: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
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
        newPassword: 'ValidPass123!',
        confirmPassword: 'DifferentPass123!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Passwords must match');
    });

    it('should fail if confirmPassword matches but newPassword is too short', async () => {
      const invalidData = {
        newPassword: 'Pass1!',
        confirmPassword: 'Pass1!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should fail if confirmPassword matches but newPassword lacks complexity', async () => {
      const invalidData = {
        newPassword: 'password',
        confirmPassword: 'password',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle various special characters in passwords', async () => {
      const validData = {
        newPassword: 'Pass@123!',
        confirmPassword: 'Pass@123!',
      };

      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should accept all allowed special characters', async () => {
      const validData = {
        newPassword: 'ValidP@ss1',
        confirmPassword: 'ValidP@ss1',
      };

      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject unicode characters that are not allowed', async () => {
      const invalidData = {
        newPassword: 'Páss123!',
        confirmPassword: 'Páss123!',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    });

    it('should handle very long passwords with all requirements', async () => {
      const longPassword = 'ValidPass123!' + 'a'.repeat(987);
      const validData = {
        newPassword: longPassword,
        confirmPassword: longPassword,
      };

      await expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject passwords with spaces', async () => {
      const invalidData = {
        newPassword: 'Pass 123!Aa',
        confirmPassword: 'Pass 123!Aa',
      };

      await expect(resetPasswordSchema.validate(invalidData)).rejects.toThrow('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    });

    it('should accept passwords with different special characters', async () => {
      const specialChars = ['@', '$', '!', '%', '*', '?', '&'];
      const promises = specialChars.map((char) => {
        const validData = {
          newPassword: `ValidPass123${char}`,
          confirmPassword: `ValidPass123${char}`,
        };
        return expect(resetPasswordSchema.validate(validData)).resolves.toEqual(validData);
      });

      await Promise.all(promises);
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
