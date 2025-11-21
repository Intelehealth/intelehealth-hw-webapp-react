import { yupResolver } from '@hookform/resolvers/yup';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import type { InferType } from 'yup';
import iconRightArrow from '../../../assets/icons/icon-right-arrow.svg';
import iconRoundedLock from '../../../assets/icons/icon-rounded-lock.svg';
import iconQuestionMark from '../../../assets/icons/icon-rounded-question-mark.svg';
import iconSmileyYellow from '../../../assets/images/smiley-yellow.png';
import { Button, Input } from '../../../components/common';
import Card from '../../../components/common/card.component';
import Tooltip from '../../../components/common/tooltip.component';
import AuthCardTitle from '../common/auth-card-title.component';
import { useResetPassword } from './reset-password.hooks';
import { resetPasswordSchema } from './reset-password.validation';

interface resetPasswordState {
  userUuid: string;
}

type ResetPasswordFormValues = InferType<typeof resetPasswordSchema>;

interface ResetPasswordComponentProps {
  changeTitle: (title: string) => void;
  changeDescription: (description: string) => void;
}

const ResetPasswordComponent: React.FC<ResetPasswordComponentProps> = ({
  changeTitle,
  changeDescription,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    handleResetPassword,
    handleGenerateNewPassword,
    isResetSuccessful,
    loading,
  } = useResetPassword();
  const stateData = location.state as resetPasswordState;

  if (!stateData || !stateData.userUuid) {
    // If no data passed, redirect to login page
    navigate('/auth/login');
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    await handleResetPassword(stateData.userUuid, {
      newPassword: data.newPassword,
    });
  };

  useEffect(() => {
    if (isResetSuccessful) {
      changeTitle('Password Reset!');
      changeDescription(
        'Follow the instructions below to use your account again.'
      );
    }
  }, [changeDescription, changeTitle, isResetSuccessful]);

  const onGenerateNewPassword = () => {
    const generatedPassword = handleGenerateNewPassword();
    setValue('newPassword', generatedPassword);
    setValue('confirmPassword', generatedPassword);
  };

  return (
    <Card className="w-full lg:w-[431px]">
      {!isResetSuccessful && (
        <>
          <AuthCardTitle
            title="Reset Password ?"
            description="Follow the instructions below to use your account again."
            icon={iconRoundedLock}
          />
          <hr className="border-t border-[#DFDEE3] my-3" />
          {/* FORM START */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Title */}
            <div className="flex items-center mb-3">
              <h2 className="text-lg font-semibold text-[--color-dark]">
                Enter your new password
              </h2>
              <span className="ml-2 lg:flex align-middle">
                <Tooltip text="Enter a strong password that meets the security requirements">
                  <img src={iconQuestionMark} alt="info" />
                </Tooltip>
              </span>
            </div>

            {/* Title */}
            <div className="flex items-center mb-3">
              <h3
                className="text-base font-semibold text-(--color-primary) underline cursor-pointer"
                onClick={onGenerateNewPassword}
              >
                Generate a new password
              </h3>
              <span className="ml-2 lg:flex align-middle">
                <Tooltip text="Generate a new random password for you">
                  <img src={iconQuestionMark} alt="info" />
                </Tooltip>
              </span>
            </div>

            {/* New Password */}
            <div className="mb-4">
              {/* Input component can be used here */}
              <Input
                {...register('newPassword')}
                type="password"
                placeholder="Enter your new password"
                label="New Password"
              />
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <div className="flex justify-between">
                <label className="small-label text-base text-(--color-muted)">
                  Confirm Password
                </label>
              </div>

              <div className="relative mt-2">
                <Input
                  {...register('confirmPassword')}
                  className="input-base pr-10"
                  type="password"
                  placeholder="Enter your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Login button */}
            <div className="mt-[50px] lg:mt-2">
              <Button
                variant="primary"
                className="w-full"
                type="submit"
                rightIcon={<img src={iconRightArrow} />}
                isLoading={loading}
              >
                <span className="mx-auto w-full text-base">Submit</span>
              </Button>
            </div>
          </form>
          {/* FORM END */}
        </>
      )}
      {isResetSuccessful && (
        <>
          <AuthCardTitle
            title="Password Reset!"
            description="Follow the instructions below to use your account again."
            icon={iconRoundedLock}
          />
          <hr className="border-t border-[#DFDEE3] my-3" />
          <div className="w-full text-center">
            <img
              src={iconSmileyYellow}
              alt="success"
              className="w-[60px] mx-auto my-6"
            />
            {/* Success Message */}
            <h2 className="text-lg font-semibold text-[#0FD197] mb-6">
              Your password has changed <br /> successfully!
            </h2>
          </div>

          {/* Login button */}
          <div className="mt-[50px] lg:mt-2">
            <Button
              variant="primary"
              className="w-full"
              type="button"
              rightIcon={<img src={iconRightArrow} />}
              onClick={() => navigate('/auth/login')}
            >
              <span className="mx-auto w-full text-base">Go to Login</span>
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default ResetPasswordComponent;
