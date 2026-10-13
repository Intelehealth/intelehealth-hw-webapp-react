// src/modules/auth/login/login.hooks.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../../services/toast';
import type {
  RequestOtpModel,
  VerifyOtpModel,
} from '../../../types/auth/verify-otp.types';
import requestOtpService from './verify-otp.service';

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
  verifyOtp: () => Promise<void>;
  formatTime: (seconds: number) => string;
  requestOtp: () => Promise<void>;
  userUuid: string;
}

// How long the portal accepts an OTP (auth.service.js `verifyOtp`): password
// and verification OTPs only while `diff(updatedAt, 'minutes') < 1`, i.e. under
// 1 minute, username OTPs for 3 minutes. The Resend countdown must match,
// otherwise users keep typing an OTP that has already expired while the screen
// still says "Resend in 2:xx". The portal does not send the validity yet; if it
// ever returns `expiresInSeconds` that value overrides these defaults.
export const SHORT_OTP_VALIDITY_SECONDS = 60;
export const DEFAULT_OTP_VALIDITY_SECONDS = 180;
const SHORT_LIVED_OTP_PURPOSES = ['password', 'verification'];

export const useVerifyOtp = (stateData?: {
  value: string;
  type: 'username' | 'phonenumber' | 'email';
  otpFor: string;
  countryCode?: string;
}): UseVerifyOtpReturn => {
  const navigate = useNavigate();
  const otpValiditySeconds = SHORT_LIVED_OTP_PURPOSES.includes(
    stateData?.otpFor ?? ''
  )
    ? SHORT_OTP_VALIDITY_SECONDS
    : DEFAULT_OTP_VALIDITY_SECONDS;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(otpValiditySeconds);
  const [loading, setLoading] = useState(false);
  const [userUuid, setUserUuid] = useState<string>('');
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const didRequestOtp = useRef(false);
  const verifyInFlight = useRef(false);

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
        // Only when the backend states the validity does it override the
        // per-purpose default the countdown already started from
        const expiresInSeconds = response.data.expiresInSeconds;
        if (typeof expiresInSeconds === 'number' && expiresInSeconds > 0) {
          setTimeLeft(expiresInSeconds);
        }
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
    if (!stateData?.value || !stateData?.type || !stateData?.otpFor) {
      navigate('/auth/login');
      return;
    }

    if (!userUuid || otp.includes('')) return;

    // Defensive: never run two verify requests at once. The ref is per hook
    // instance and is always released in `finally`.
    if (verifyInFlight.current) return;
    verifyInFlight.current = true;

    const enteredOtp = otp.join('');

    try {
      setLoading(true);
      const payload: VerifyOtpModel = {
        otp: enteredOtp,
        [stateData.type]: stateData?.value || '',
        verifyFor: stateData?.otpFor || '',
        countryCode: stateData.countryCode || undefined,
      };
      const result = await requestOtpService.verifyOtp(payload);

      if (result.success === false) {
        // The backend answers HTTP 200 + success:false with "Otp expired!" or
        // "Otp incorrect!" - show that instead of a blanket "Invalid OTP".
        const message = result.message || 'Invalid OTP';
        // Prefer the portal's machine-readable reason when it sends one; until
        // it does, fall back to matching the "Otp expired!" wording.
        const reason = result.data?.reason;
        const expired = reason
          ? reason === 'EXPIRED'
          : /expired/i.test(message);
        // An expired OTP can never be accepted again, so don't make the user
        // wait for the countdown before they can ask for a new one.
        if (expired) setTimeLeft(0);
        setLoading(false);
        showToast(expired ? 'OTP Expired' : 'Invalid OTP', message, 'error');
        return;
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
      const response = (
        error as {
          response?: { status?: number; data?: { message?: string } };
        } | null
      )?.response;
      if (response && (response.status ?? 0) < 500) {
        showToast(
          'Invalid OTP',
          response.data?.message || 'Invalid OTP',
          'error'
        );
      } else {
        // Network failure, timeout or 5xx: the OTP itself may well be valid.
        showToast(
          'Verify OTP Failed',
          response?.data?.message ||
            'Could not verify the OTP right now. Please check your connection and try again.',
          'error'
        );
      }
    } finally {
      verifyInFlight.current = false;
    }
  };

  // ✅ Resend OTP
  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']);
    setTimeLeft(otpValiditySeconds);
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
