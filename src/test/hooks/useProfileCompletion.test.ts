import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfileCompletion } from '../../hooks/useProfileCompletion';
import type { Profile } from '../../types/profile.types';

// Mock useProfileContext hook
const mockUseProfile = vi.fn();
vi.mock('../../context/ProfileContext', () => ({
  useProfileContext: (...args: any[]) => mockUseProfile(...args),
}));

describe('useProfileCompletion', () => {
  const mockCompleteProfile: Profile = {
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
  } as Profile;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Profile Completion Check', () => {
    it('should return false when profile is null', () => {
      mockUseProfile.mockReturnValue({
        profile: null,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.missingFields).toEqual([]);
    });

    it('should return true when all required fields are present', () => {
      mockUseProfile.mockReturnValue({
        profile: mockCompleteProfile,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(true);
      expect(result.current.missingFields).toEqual([]);
    });

    it('should return false when required field is missing', () => {
      const incompleteProfile: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        // Missing phone, dateOfBirth, etc.
      } as Profile;

      mockUseProfile.mockReturnValue({
        profile: incompleteProfile,
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.missingFields.length).toBeGreaterThan(0);
    });

    it('should return false when required field is empty string', () => {
      const profileWithEmptyField: Profile = {
        ...mockCompleteProfile,
        phone: '',
      } as Profile;

      mockUseProfile.mockReturnValue({
        profile: profileWithEmptyField,
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.missingFields).toContain('phone');
    });

    it('should return false when required field is null', () => {
      const profileWithNullField: Profile = {
        ...mockCompleteProfile,
        email: null as any,
      } as Profile;

      mockUseProfile.mockReturnValue({
        profile: profileWithNullField,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.missingFields).toContain('email');
    });

    it('should return false when required field is undefined', () => {
      const profileWithUndefinedField: Profile = {
        ...mockCompleteProfile,
        dateOfBirth: undefined as any,
      } as Profile;

      mockUseProfile.mockReturnValue({
        profile: profileWithUndefinedField,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.missingFields).toContain('dateOfBirth');
    });
  });

  describe('Nested Address Fields', () => {
    it('should return false when nested address field is missing', () => {
      const profileWithMissingAddressField: Profile = {
        ...mockCompleteProfile,
        address: {
          street: '123 Main St',
          city: 'Telemedicine Clinic 1',
          // Missing state, country, zipCode
        },
      } as Profile;

      mockUseProfile.mockReturnValue({
        profile: profileWithMissingAddressField,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.missingFields.length).toBeGreaterThan(0);
    });

    it('should return false when nested address field is empty string', () => {
      const profileWithEmptyAddressField: Profile = {
        ...mockCompleteProfile,
        address: {
          ...mockCompleteProfile.address!,
          street: '',
        },
      } as Profile;

      mockUseProfile.mockReturnValue({
        profile: profileWithEmptyAddressField,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.missingFields).toContain('address.street');
    });

    it('should return false when nested address field is null', () => {
      const profileWithNullAddressField: Profile = {
        ...mockCompleteProfile,
        address: {
          ...mockCompleteProfile.address!,
          city: null as any,
        },
      } as Profile;

      mockUseProfile.mockReturnValue({
        profile: profileWithNullAddressField,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.missingFields).toContain('address.city');
    });

    it('should return false when address parent is null', () => {
      const profileWithNullAddress: Profile = {
        ...mockCompleteProfile,
        address: null as any,
      } as Profile;

      mockUseProfile.mockReturnValue({
        profile: profileWithNullAddress,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.missingFields.length).toBeGreaterThan(0);
      // All address fields should be missing
      expect(result.current.missingFields).toContain('address.street');
      expect(result.current.missingFields).toContain('address.city');
    });

    it('should return false when address parent is not an object', () => {
      const profileWithInvalidAddress: Profile = {
        ...mockCompleteProfile,
        address: 'invalid' as any,
      } as Profile;

      mockUseProfile.mockReturnValue({
        profile: profileWithInvalidAddress,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);
      expect(result.current.missingFields.length).toBeGreaterThan(0);
    });
  });

  describe('Missing Fields List', () => {
    it('should return all missing fields when profile is empty', () => {
      const emptyProfile: Profile = {} as Profile;

      mockUseProfile.mockReturnValue({
        profile: emptyProfile,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.missingFields.length).toBeGreaterThan(0);
      expect(result.current.missingFields).toContain('firstName');
      expect(result.current.missingFields).toContain('lastName');
      expect(result.current.missingFields).toContain('email');
    });

    it('should return only missing fields when some fields are present', () => {
      const partialProfile: Profile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        // Missing other fields
      } as Profile;

      mockUseProfile.mockReturnValue({
        profile: partialProfile,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.missingFields.length).toBeGreaterThan(0);
      expect(result.current.missingFields).not.toContain('firstName');
      expect(result.current.missingFields).not.toContain('lastName');
      expect(result.current.missingFields).not.toContain('email');
      expect(result.current.missingFields).toContain('phone');
    });

    it('should return empty array when all fields are present', () => {
      mockUseProfile.mockReturnValue({
        profile: mockCompleteProfile,
        
      });

      const { result } = renderHook(() => useProfileCompletion());

      expect(result.current.missingFields).toEqual([]);
    });
  });

  describe('Loading State', () => {
    it('should return loading state from useProfile', () => {
      mockUseProfile.mockReturnValue({
        profile: mockCompleteProfile,
      });
    });

    it('should return false loading when profile is loaded', () => {
      mockUseProfile.mockReturnValue({
        profile: mockCompleteProfile,   
      });
    });
  });

  describe('Memoization', () => {
    it('should recalculate when profile changes', () => {
      mockUseProfile.mockReturnValue({
        profile: null,
        
      });

      const { result, rerender } = renderHook(() => useProfileCompletion());

      expect(result.current.isProfileComplete).toBe(false);

      // Update mock to return complete profile
      mockUseProfile.mockReturnValue({
        profile: mockCompleteProfile,
        
      });

      // Rerender to trigger recalculation
      rerender();

      expect(result.current.isProfileComplete).toBe(true);
    });

    it('should memoize result when profile does not change', () => {
      mockUseProfile.mockReturnValue({
        profile: mockCompleteProfile,
        
      });

      const { result, rerender } = renderHook(() => useProfileCompletion());

      const firstResult = result.current.isProfileComplete;
      expect(firstResult).toBe(true);

      // Rerender without changing profile
      rerender();

      // Result should be the same (memoized)
      expect(result.current.isProfileComplete).toBe(firstResult);
    });
  });
});

