import React from 'react';
import { useLocation } from 'react-router-dom';
import iconRightArrow from '../../../assets/icons/icon-right-arrow.svg';
import iconRoundedLock from '../../../assets/icons/icon-rounded-lock.svg';
import { Button } from '../../../components/common';
import Card from '../../../components/common/card.component';
import AuthCardTitle from '../common/auth-card-title.component';
import { useVerifyOtp } from './verify-otp.hooks';
import type { VerifyOtpState } from '../../../types/auth/verify-otp.types';

const VerifyOtpComponent: React.FC = () => {
  const location = useLocation();
  const stateData = location.state as VerifyOtpState;

  // Use the updated hook
  const {
    otp,
    timeLeft,
    loading,
    inputsRef,
    handleChange,
    handleKeyDown,
    handleResend,
    verifyOtp,
    formatTime,
  } = useVerifyOtp(stateData);

  return (
    <Card className="w-full lg:w-[431px]">
      {/* Title */}
      <AuthCardTitle
        title={stateData?.title || 'Verify OTP'}
        description={stateData?.description || ''}
        icon={stateData?.icon || iconRoundedLock}
      />
      <hr className="border-t border-[#DFDEE3] my-3" />

      <div className="flex flex-col items-center">
        <h3 className="text-lg w-full mt-4 mb-2 font-semibold">
          Enter verification code
        </h3>
        <p className="text-(--color-muted) text-base mb-6 w-full">
          6-digit OTP sent to your registered number or email.Please check and
          enter the OTP
        </p>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-3 mb-6 w-full">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="w-1/6 h-12 text-center text-lg font-semibold
                border border-gray-200 rounded-lg
                bg-(--color-bg) text-(--color-dark)
                focus:outline-none focus:ring-1 focus:ring-(--color-primary-light) focus:bg-white
                transition input-base"
            />
          ))}
        </div>

        {/* Resend Timer */}
        <p className="text-sm text-(--color-muted) w-full">
          Didn’t receive OTP?{' '}
          {timeLeft > 0 ? (
            <span className="text-indigo-600 text-base">
              Resend in {formatTime(timeLeft)}
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              className={`text-indigo-600 text-base hover:underline cursor-pointer ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Resending...' : 'Resend'}
            </button>
          )}
        </p>

        {/* Continue button */}
        <div className="mt-[50px] lg:mt-4 w-full">
          <Button
            variant="primary"
            className="w-full"
            type="button"
            rightIcon={<img src={iconRightArrow} />}
            onClick={verifyOtp}
            disabled={otp.includes('')}
            isLoading={loading}
          >
            <span className="mx-auto w-full text-base">Continue</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VerifyOtpComponent;
