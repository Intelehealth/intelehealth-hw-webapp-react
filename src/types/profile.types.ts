export interface Profile {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  avatar?: string;
  role: string;
  department: string;
  employeeId: string;
  joinDate: string;
  lastLogin: string;
  isActive: boolean;
  username: string;
  age?: number;
  setupLocation?: string;
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

export interface ProfileUpdateRequest {
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

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileResponse {
  success: boolean;
  data: Profile;
  message?: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  data: Profile;
  message?: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message?: string;
}
