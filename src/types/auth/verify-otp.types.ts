export interface RequestOtpModel {
  otpFor?: string;
  phoneNumber?: string;
  countryCode?: string;
  email?: string;
  username?: string;
}

export interface RequestOtpResponseModel {
  success: boolean;
  message: string;
  data?: {
    userUuid: string;
  };
}

export interface VerifyOtpModel {
  verifyFor?: string;
  phoneNumber?: string;
  countryCode?: string;
  email?: string;
  username?: string;
  otp?: string;
}

export interface VerifyOtpResponseModel {
  success: boolean;
  message: string;
}

export interface VerifyOtpState {
  title?: string;
  description?: string;
  icon?: string;
  value: string; // e.g., username or email
  type: 'username' | 'email'; // Type of the value
  otpFor: 'reset-password' | 'login' | 'other'; // Purpose of the OTP
  countryCode?: string; // Optional country code for phone numbers
}
