import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ProfileFormData } from '../../hooks/useProfileFormCompletion';
import { useProfileFormCompletion } from '../../hooks/useProfileFormCompletion';

describe('useProfileFormCompletion', () => {
  const mockCompleteFormData: ProfileFormData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    setupLocation: 'telemedicine-clinic1',
    address: {
      street: '123 Main St',
      city: 'Telemedicine Clinic 1',
      state: 'CA',
      country: 'USA',
      zipCode: '94102',
    },
    role: 'Doctor',
    department: 'Cardiology',
    employeeId: 'EMP001',
  };

  beforeEach(() => {
    // No mocks needed for this hook
  });

  describe('Completion Status', () => {
    it('should return isComplete true when all required fields are present', () => {
      const { result } = renderHook(() =>
        useProfileFormCompletion(mockCompleteFormData)
      );

      expect(result.current.isComplete).toBe(true);
      expect(result.current.completedFields.length).toBe(15);
      expect(result.current.missingFields.length).toBe(0);
      expect(result.current.completionPercentage).toBe(100);
      expect(result.current.totalFields).toBe(15);
      expect(result.current.completedCount).toBe(15);
    });

    it('should return isComplete false when required field is missing', () => {
      const incompleteFormData: ProfileFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        // Missing phone, dateOfBirth, etc.
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(incompleteFormData)
      );

      expect(result.current.isComplete).toBe(false);
      expect(result.current.completedFields.length).toBeLessThan(15);
      expect(result.current.missingFields.length).toBeGreaterThan(0);
      expect(result.current.completionPercentage).toBeLessThan(100);
    });

    it('should return isComplete false when required field is empty string', () => {
      const formDataWithEmptyField: ProfileFormData = {
        ...mockCompleteFormData,
        phone: '',
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(formDataWithEmptyField)
      );

      expect(result.current.isComplete).toBe(false);
      expect(result.current.missingFields).toContain('phone');
      expect(result.current.completedFields).not.toContain('phone');
    });

    it('should return isComplete false when required field is null', () => {
      const formDataWithNullField: ProfileFormData = {
        ...mockCompleteFormData,
        email: null as any,
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(formDataWithNullField)
      );

      expect(result.current.isComplete).toBe(false);
      expect(result.current.missingFields).toContain('email');
    });

    it('should return isComplete false when required field is undefined', () => {
      const formDataWithUndefinedField: ProfileFormData = {
        ...mockCompleteFormData,
        dateOfBirth: undefined,
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(formDataWithUndefinedField)
      );

      expect(result.current.isComplete).toBe(false);
      expect(result.current.missingFields).toContain('dateOfBirth');
    });
  });

  describe('Nested Address Fields', () => {
    it('should return false when nested address field is missing', () => {
      const formDataWithMissingAddressField: ProfileFormData = {
        ...mockCompleteFormData,
        address: {
          street: '123 Main St',
          city: 'Telemedicine Clinic 1',
          // Missing state, country, zipCode
        },
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(formDataWithMissingAddressField)
      );

      expect(result.current.isComplete).toBe(false);
      expect(result.current.missingFields.length).toBeGreaterThan(0);
      expect(result.current.missingFields).toContain('address.state');
    });

    it('should return false when nested address field is empty string', () => {
      const formDataWithEmptyAddressField: ProfileFormData = {
        ...mockCompleteFormData,
        address: {
          ...mockCompleteFormData.address!,
          street: '',
        },
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(formDataWithEmptyAddressField)
      );

      expect(result.current.isComplete).toBe(false);
      expect(result.current.missingFields).toContain('address.street');
    });

    it('should return false when nested address field is null', () => {
      const formDataWithNullAddressField: ProfileFormData = {
        ...mockCompleteFormData,
        address: {
          ...mockCompleteFormData.address!,
          city: null as any,
        },
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(formDataWithNullAddressField)
      );

      expect(result.current.isComplete).toBe(false);
      expect(result.current.missingFields).toContain('address.city');
    });

    it('should return false when address parent is null', () => {
      const formDataWithNullAddress: ProfileFormData = {
        ...mockCompleteFormData,
        address: null as any,
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(formDataWithNullAddress)
      );

      expect(result.current.isComplete).toBe(false);
      expect(result.current.missingFields.length).toBeGreaterThan(0);
      expect(result.current.missingFields).toContain('address.street');
      expect(result.current.missingFields).toContain('address.city');
    });

    it('should return false when address parent is not an object', () => {
      const formDataWithInvalidAddress: ProfileFormData = {
        ...mockCompleteFormData,
        address: 'invalid' as any,
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(formDataWithInvalidAddress)
      );

      expect(result.current.isComplete).toBe(false);
      expect(result.current.missingFields.length).toBeGreaterThan(0);
      // All address fields should be missing
      expect(result.current.missingFields).toContain('address.street');
    });
  });

  describe('Completed Fields List', () => {
    it('should return all completed fields when all are present', () => {
      const { result } = renderHook(() =>
        useProfileFormCompletion(mockCompleteFormData)
      );

      expect(result.current.completedFields.length).toBe(15);
      expect(result.current.completedFields).toContain('firstName');
      expect(result.current.completedFields).toContain('lastName');
      expect(result.current.completedFields).toContain('email');
      expect(result.current.completedFields).toContain('address.street');
    });

    it('should return only completed fields when some are missing', () => {
      const partialFormData: ProfileFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        // Missing other fields
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(partialFormData)
      );

      expect(result.current.completedFields.length).toBe(3);
      expect(result.current.completedFields).toContain('firstName');
      expect(result.current.completedFields).toContain('lastName');
      expect(result.current.completedFields).toContain('email');
      expect(result.current.completedFields).not.toContain('phone');
    });

    it('should return empty array when no fields are present', () => {
      const emptyFormData: ProfileFormData = {};

      const { result } = renderHook(() =>
        useProfileFormCompletion(emptyFormData)
      );

      expect(result.current.completedFields.length).toBe(0);
    });
  });

  describe('Missing Fields List', () => {
    it('should return all missing fields when formData is empty', () => {
      const emptyFormData: ProfileFormData = {};

      const { result } = renderHook(() =>
        useProfileFormCompletion(emptyFormData)
      );

      expect(result.current.missingFields.length).toBe(15);
      expect(result.current.missingFields).toContain('firstName');
      expect(result.current.missingFields).toContain('lastName');
      expect(result.current.missingFields).toContain('email');
    });

    it('should return only missing fields when some are present', () => {
      const partialFormData: ProfileFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(partialFormData)
      );

      expect(result.current.missingFields.length).toBe(12);
      expect(result.current.missingFields).not.toContain('firstName');
      expect(result.current.missingFields).not.toContain('lastName');
      expect(result.current.missingFields).not.toContain('email');
      expect(result.current.missingFields).toContain('phone');
    });

    it('should return empty array when all fields are present', () => {
      const { result } = renderHook(() =>
        useProfileFormCompletion(mockCompleteFormData)
      );

      expect(result.current.missingFields).toEqual([]);
    });
  });

  describe('Completion Percentage', () => {
    it('should return 100% when all fields are complete', () => {
      const { result } = renderHook(() =>
        useProfileFormCompletion(mockCompleteFormData)
      );

      expect(result.current.completionPercentage).toBe(100);
    });

    it('should return 0% when no fields are complete', () => {
      const emptyFormData: ProfileFormData = {};

      const { result } = renderHook(() =>
        useProfileFormCompletion(emptyFormData)
      );

      expect(result.current.completionPercentage).toBe(0);
    });

    it('should return correct percentage for partial completion', () => {
      const partialFormData: ProfileFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        // 3 out of 15 fields = 20%
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(partialFormData)
      );

      expect(result.current.completionPercentage).toBe(20);
    });

    it('should round completion percentage correctly', () => {
      const partialFormData: ProfileFormData = {
        firstName: 'John',
        // 1 out of 15 fields = 6.666...% = 7% rounded
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(partialFormData)
      );

      expect(result.current.completionPercentage).toBe(7);
    });
  });

  describe('Total and Completed Count', () => {
    it('should return correct total fields count', () => {
      const { result } = renderHook(() =>
        useProfileFormCompletion(mockCompleteFormData)
      );

      expect(result.current.totalFields).toBe(15);
    });

    it('should return correct completed count', () => {
      const partialFormData: ProfileFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const { result } = renderHook(() =>
        useProfileFormCompletion(partialFormData)
      );

      expect(result.current.completedCount).toBe(3);
      expect(result.current.completedCount).toBe(
        result.current.completedFields.length
      );
    });

    it('should return 0 completed count when no fields are present', () => {
      const emptyFormData: ProfileFormData = {};

      const { result } = renderHook(() =>
        useProfileFormCompletion(emptyFormData)
      );

      expect(result.current.completedCount).toBe(0);
    });
  });

  describe('Memoization', () => {
    it('should recalculate when formData changes', () => {
      const { result, rerender } = renderHook(
        ({ formData }) => useProfileFormCompletion(formData),
        {
          initialProps: { formData: {} as ProfileFormData },
        }
      );

      expect(result.current.isComplete).toBe(false);
      expect(result.current.completedCount).toBe(0);

      rerender({ formData: mockCompleteFormData });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.completedCount).toBe(15);
    });
  });
});

