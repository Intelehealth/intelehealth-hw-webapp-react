import { yupResolver } from '@hookform/resolvers/yup';
import React, { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { InferType } from 'yup';
import iconRightArrow from '../../../assets/icons/icon-right-arrow.svg';
import iconQuestionMark from '../../../assets/icons/icon-rounded-question-mark.svg';
import {
  Button,
  Checkbox,
  Dropdown,
  Input,
  ReCaptcha,
} from '../../../components/common';
import Card from '../../../components/common/card.component';
import Tooltip from '../../../components/common/tooltip.component';
import { env } from '../../../config/env';
import { useLogin } from './login.hooks';
import { loginSchema } from './login.validation';

type LoginFormValues = InferType<typeof loginSchema>;

const LoginComponent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleLogin, loading } = useLogin();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const captchaSiteKey = useMemo(() => {
    if (env.ENABLE_SITE_CAPTCHA !== 'true') return null;
    const key = env.RECAPTCHA_SITE_KEY?.trim();
    return key ? key : null;
  }, []);

  const handleCaptchaChange = useCallback((token: string | null) => {
    setCaptchaToken(token);
    if (token) setCaptchaError(null);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      username: '',
      password: '',
      role: 'nurse',
      terms: true,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (captchaSiteKey && !captchaToken) {
      setCaptchaError('Please verify that you are not a robot');
      return;
    }
    setCaptchaError(null);
    await handleLogin({ username: data.username, password: data.password });
  };

  return (
    <Card className="w-full lg:w-[431px]">
      {/* FORM START */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Title */}
        <div className="flex items-center mb-3">
          <h2 className="text-lg font-semibold text-[--color-dark]">
            {t('Auth.Please_Enter_Your_Login_Details')}
          </h2>
          <span className="ml-2 lg:flex align-middle">
            <Tooltip text={t('Auth.Tooltip_Credentials')}>
              <img src={iconQuestionMark} alt="info" />
            </Tooltip>
          </span>
        </div>

        {/* Username */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <label className="text-base text-(--color-muted)">
              {t('Auth.Username')}
            </label>
            <a
              className="inline text-base underline cursor-pointer text-(--color-muted)"
              onClick={() => navigate('/auth/forgot-username')}
            >
              {t('Auth.Forgot_Username')}
            </a>
          </div>
          {/* Input component can be used here */}
          <Input
            {...register('username')}
            placeholder={t('Auth.Enter_Username_Placeholder')}
          />
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <div className="flex justify-between">
            <label className="small-label text-base text-(--color-muted)">
              {t('Auth.Password')}
            </label>
            <a
              className="inline text-base underline cursor-pointer text-(--color-muted)"
              onClick={() => navigate('/auth/forgot-password')}
            >
              {t('Auth.Forgot_Password')}
            </a>
          </div>

          <div className="relative mt-2">
            <Input
              {...register('password')}
              className="input-base pr-10"
              type="password"
              placeholder={t('Auth.Enter_Password_Placeholder')}
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Role select - visible desktop only */}
        <div className="mb-4">
          <Dropdown
            label={t('Auth.Select_Role')}
            placeholder={t('Auth.Select_Role_Placeholder')}
            options={[
              { label: 'Doctor', value: 'doctor' },
              { label: t('User_Role.Health_Worker'), value: 'nurse' },
              { label: 'Admin', value: 'admin' },
            ]}
            labelClassName="text-(--color-muted)"
            error={errors.role?.message}
            value={watch('role') ?? ''}
            onChange={(value: string | string[]) => {
              const selectedValue = Array.isArray(value) ? value[0] : value;
              setValue('role', selectedValue as 'nurse' | 'doctor' | 'admin');
            }}
            disabled={true}
          />
        </div>

        {/* Terms (desktop only) */}
        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            label={
              <div className="text-sm text-[--color-dark]">
                {t('Auth.Agree_To')}&nbsp;
                <a
                  className="text-[--color-primary] underline"
                  href="https://intelehealth.org/terms-of-use"
                  target="_blank"
                >
                  {t('Legal.Terms_And_Conditions')}
                </a>{' '}
                and&nbsp;
                <a
                  className="text-[--color-primary] underline"
                  href="https://intelehealth.org/privacy-policy"
                  target="_blank"
                >
                  {t('Legal.Privacy_Policy')}
                </a>
              </div>
            }
            {...register('terms')}
          ></Checkbox>
        </div>
        {errors.terms && (
          <p className="text-red-500 text-xs mt-1">{errors.terms.message}</p>
        )}

        {captchaSiteKey && (
          <div className="mb-4">
            <ReCaptcha
              siteKey={captchaSiteKey}
              onChange={handleCaptchaChange}
            />
            {captchaError && (
              <p className="text-red-500 text-xs mt-1">{captchaError}</p>
            )}
          </div>
        )}

        {/* Login button */}
        <div className="mt-[50px] lg:mt-2">
          <Button
            variant="primary"
            className="w-full"
            type="submit"
            rightIcon={<img src={iconRightArrow} />}
            isLoading={loading}
            name="login-button"
          >
            <span className="mx-auto w-full text-base">{t('Auth.Login')}</span>
          </Button>
        </div>
      </form>
      {/* FORM END */}
    </Card>
  );
};

export default LoginComponent;
