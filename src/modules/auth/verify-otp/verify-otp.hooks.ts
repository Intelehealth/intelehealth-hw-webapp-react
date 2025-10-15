// src/modules/auth/login/login.hooks.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../../services/toast';
import requestOtpService from './verify-otp.service';
import type { RequestOtpModel, VerifyOtpModel } from './verify-otp.types';

interface UseVerifyOtpReturn {
  otp: string[];
  timeLeft: number;
  loading: boolean;
  inputsRef: React.RefObject<Array<HTMLInputElement | null>>;
  handleChange: (index: number, value: string) => void;
  handleKeyDown: (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => void;
  handleResend: () => Promise<void>;
  verifyOtp: () => void;
  formatTime: (seconds: number) => string;
  requestOtp: () => Promise<void>;
  userUuid: string;
}

export const useVerifyOtp = (stateData?: {
  value: string;
  type: 'username' | 'phonenumber' | 'email';
  otpFor: string;
  countryCode?: string;
}): UseVerifyOtpReturn => {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(180);
  const [loading, setLoading] = useState(false);
  const [userUuid, setUserUuid] = useState<string>('');
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const didRequestOtp = useRef(false);

  // ✅ Request OTP (initial & resend)
  const requestOtp = useCallback(async () => {
    if (!stateData?.value || !stateData?.type || !stateData?.otpFor) {
      navigate('/auth/login');
      return;
    }

    try {
      setLoading(true);
      const payload: RequestOtpModel = {
        [stateData.type]: stateData.value,
        otpFor: stateData.otpFor,
        countryCode: stateData.countryCode || undefined,
      };
      const response = await requestOtpService.requestOtp(payload);

      if (response.success && response.data?.userUuid) {
        setUserUuid(response.data.userUuid);
        showToast('Request OTP', 'OTP sent successfully', 'success');
      } else {
        showToast(
          'Request OTP Failed',
          response.message || 'Unknown error',
          'error'
        );
        navigate(-1);
      }
    } catch (error: unknown) {
      let message = 'Request OTP Failed';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        message = axiosError.response?.data?.message || message;
      }
      showToast('Request OTP Failed', message, 'error');
      // Redirect to back page
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [navigate, stateData]);

  // ✅ Verify OTP
  const verifyOtp = async () => {
    if (!userUuid || otp.includes('')) return;

    const enteredOtp = otp.join('');

    try {
      setLoading(true);
      const payload: VerifyOtpModel = {
        otp: enteredOtp,
        username: stateData?.value || '',
        verifyFor: stateData?.otpFor || '',
      };
      const result = await requestOtpService.verifyOtp(payload);

      if (result.success === false) {
        throw new Error(result.message || 'OTP verification failed');
      }

      showToast('Verify OTP', 'OTP verified successfully', 'success');
      navigate('/auth/reset-password', {
        state: {
          username: stateData?.value,
          userUuid,
        },
      });
    } catch (error: unknown) {
      setLoading(false);
      let message = 'Verify OTP Failed';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        message = axiosError.response?.data?.message || message;
      }
      showToast('Verify OTP Failed', message, 'error');
    }
  };

  // ✅ Resend OTP
  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']);
    setTimeLeft(180);
    inputsRef.current[0]?.focus();
    await requestOtp();
  };

  // ✅ Handle OTP input changes
  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  // ✅ Handle backspace navigation
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // ✅ Format timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ✅ Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // ✅ Request OTP once on mount
  useEffect(() => {
    if (didRequestOtp.current) return;
    didRequestOtp.current = true;
    requestOtp();
  }, [requestOtp]);

  return {
    otp,
    timeLeft,
    loading,
    inputsRef,
    handleChange,
    handleKeyDown,
    handleResend,
    verifyOtp,
    formatTime,
    requestOtp,
    userUuid,
  };
};
