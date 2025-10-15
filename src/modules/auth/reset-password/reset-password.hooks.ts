// src/modules/auth/reset-password/reset-password.hooks.ts
import { useState } from 'react';
import { showToast } from '../../../services/toast';
import type { ResetPasswordModel } from '../auth.types';
import resetPasswordService from './reset-password.service';

interface useResetPasswordReturn {
  handleResetPassword: (
    userUuid: string,
    payload: ResetPasswordModel
  ) => Promise<void>;
  handleGenerateNewPassword: () => string;
  isResetSuccessful: boolean;
  loading: boolean;
}

export const useResetPassword = (): useResetPasswordReturn => {
  const [isResetSuccessful, setIsResetSuccessful] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateNewPassword = (): string => {
    // Genrate random 8 character password with letters and numbers
    const specialChars = '!@#$%';
    const numbers = '0123456789';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';

    const getRandomChar = (charset: string) =>
      charset[Math.floor(Math.random() * charset.length)];

    // Ensure required characters
    const specialChar = getRandomChar(specialChars);
    const number = getRandomChar(numbers);
    const upper = getRandomChar(uppercase);

    // Fill remaining with random characters from all sets
    const allChars = specialChars + numbers + uppercase + lowercase;
    const remainingLength = 5; // 8 total - 3 (special, number, upper)

    const remainingChars = Array.from({ length: remainingLength }, () =>
      getRandomChar(allChars)
    );

    // Combine all characters and shuffle
    const passwordArray = [specialChar, number, upper, ...remainingChars];

    // Shuffle the array
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [
        passwordArray[j],
        passwordArray[i],
      ];
    }

    return passwordArray.join('');
  };

  const handleResetPassword = async (
    userUuid: string,
    payload: ResetPasswordModel
  ): Promise<void> => {
    try {
      setLoading(true);
      await resetPasswordService.resetPassword(userUuid, payload);
      showToast(
        'Reset Password',
        'Your password has been reset successfully',
        'success'
      );
      setIsResetSuccessful(true);
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      let message = 'Forgot Password Failed';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        message = axiosError.response?.data?.message || message;
      }

      //show toast message
      showToast('Reset Password Failed', message, 'error');
      setIsResetSuccessful(false);
    }
  };

  return {
    handleResetPassword,
    handleGenerateNewPassword,
    isResetSuccessful,
    loading,
  };
};
