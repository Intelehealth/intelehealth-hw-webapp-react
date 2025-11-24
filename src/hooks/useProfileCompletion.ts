import { useMemo } from 'react';
import { useProfile } from '../modules/profile/profile.hooks';

export const useProfileCompletion = () => {
  const { profile } = useProfile();

  // Memoize profile completion check to avoid unnecessary recalculations
  const isProfileComplete = useMemo(() => {
    if (!profile) return false;

    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'setupLocation',
      'address.street',
      'address.city',
      'address.state',
      'address.country',
      'address.zipCode',
      'role',
      'department',
      'employeeId',
    ];

    return requiredFields.every(field => {
      if (field.includes('.')) {
        // Handle nested fields like address.street
        const [parent, child] = field.split('.');
        const parentValue = profile[parent as keyof typeof profile];
        if (parentValue && typeof parentValue === 'object') {
          const value = (parentValue as Record<string, unknown>)[child];
          return value !== null && value !== undefined && value !== '';
        }
        return false;
      } else {
        const value = profile[field as keyof typeof profile];
        return value !== null && value !== undefined && value !== '';
      }
    });
  }, [profile]);

  // Memoize missing fields for debugging/display purposes
  const missingFields = useMemo(() => {
    if (!profile) return [];

    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'setupLocation',
      'address.street',
      'address.city',
      'address.state',
      'address.country',
      'address.zipCode',
      'role',
      'department',
      'employeeId',
    ];

    return requiredFields.filter(field => {
      if (field.includes('.')) {
        // Handle nested fields like address.street
        const [parent, child] = field.split('.');
        const parentValue = profile[parent as keyof typeof profile];
        if (parentValue && typeof parentValue === 'object') {
          const value = (parentValue as Record<string, unknown>)[child];
          return value === null || value === undefined || value === '';
        }
        return true;
      } else {
        const value = profile[field as keyof typeof profile];
        return value === null || value === undefined || value === '';
      }
    });
  }, [profile]);

  return {
    isProfileComplete,
    missingFields,
  };
};
