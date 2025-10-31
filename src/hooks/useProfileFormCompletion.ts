import { useMemo } from 'react';

interface ProfileFormData {
  id?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  avatar?: string;
  role?: string;
  department?: string;
  employeeId?: string;
  joinDate?: string;
  lastLogin?: string;
  isActive?: boolean;
  username?: string;
  age?: number;
  setupLocation?: string;
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };
}

export const useProfileFormCompletion = (formData: ProfileFormData) => {
  // Memoize completion status based on form data
  const completionStatus = useMemo(() => {
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

    const completedFields = requiredFields.filter(field => {
      if (field.includes('.')) {
        // Handle nested fields like address.street
        const [parent, child] = field.split('.');
        const parentValue = formData[parent as keyof ProfileFormData];
        if (parentValue && typeof parentValue === 'object') {
          const value = (parentValue as Record<string, unknown>)[child];
          return value !== null && value !== undefined && value !== '';
        }
        return false;
      } else {
        const value = formData[field as keyof ProfileFormData];
        return value !== null && value !== undefined && value !== '';
      }
    });

    const missingFields = requiredFields.filter(field => {
      if (field.includes('.')) {
        // Handle nested fields like address.street
        const [parent, child] = field.split('.');
        const parentValue = formData[parent as keyof ProfileFormData];
        if (parentValue && typeof parentValue === 'object') {
          const value = (parentValue as Record<string, unknown>)[child];
          return value === null || value === undefined || value === '';
        }
        return true;
      } else {
        const value = formData[field as keyof ProfileFormData];
        return value === null || value === undefined || value === '';
      }
    });

    const completionPercentage =
      (completedFields.length / requiredFields.length) * 100;

    return {
      isComplete: completedFields.length === requiredFields.length,
      completedFields,
      missingFields,
      completionPercentage: Math.round(completionPercentage),
      totalFields: requiredFields.length,
      completedCount: completedFields.length,
    };
  }, [formData]);

  return completionStatus;
};
