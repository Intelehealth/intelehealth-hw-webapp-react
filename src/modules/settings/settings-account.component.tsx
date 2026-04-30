import { yupResolver } from '@hookform/resolvers/yup';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import IconFemale from '../../assets/icons/icon-female.svg';
import IconGenderOther from '../../assets/icons/icon-gender-other.svg';
import IconMale from '../../assets/icons/icon-male.svg';
import iconPersonWhite from '../../assets/icons/icon-person-white.svg';
import { Button, Calendar, Input } from '../../components/common';
import CountryCodeDropdown from '../../components/common/contry-code-dropdown.component';
import { useProfileContext } from '../../context/ProfileContext';
import { showToast } from '../../services/toast';
import type { RootState } from '../../store/store';
import { cn } from '../../utils/cn';
import { calculateAge } from '../../utils/utils';
import { SETTINGS_TOAST } from './settings.hooks';
import {
  settingsAccountSchema,
  type SettingsAccountFormValues,
} from './settings.validation';

const ADMIN_TOAST_DURATION = 3000;

const SettingsAccount: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfileContext();
  const [showAdminAlert, setShowAdminAlert] = useState(false);

  const isSaving = useSelector(
    (state: RootState) => state.loader.sections['profile-save'] > 0
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SettingsAccountFormValues>({
    resolver: yupResolver(settingsAccountSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      email: profile.email || '',
      phone: profile.phone || '',
    });
  }, [profile, reset]);

  const calculatedAge = useMemo(
    () => calculateAge(profile?.dateOfBirth || ''),
    [profile?.dateOfBirth]
  );
  const selectedGender = profile?.gender || 'male';

  const handleReadOnlyClick = useCallback(() => {
    if (showAdminAlert) return;
    setShowAdminAlert(true);
    showToast(
      '',
      'Please contact your system administrator to change these profile details',
      'default',
      {
        ...SETTINGS_TOAST,
        autoClose: ADMIN_TOAST_DURATION,
        style: {
          ...SETTINGS_TOAST.style,
          borderLeft: '4px solid #0fd197',
        },
      }
    );
    setTimeout(() => setShowAdminAlert(false), ADMIN_TOAST_DURATION);
  }, [showAdminAlert]);

  const onSubmit = useCallback(
    async (data: SettingsAccountFormValues) => {
      try {
        await updateProfile({ email: data.email, phone: data.phone });
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },
    [updateProfile]
  );

  if (!profile) return null;

  return (
    <div className="flex-1 min-h-0">
      <h2 className="text-sm font-semibold text-[--color-dark] mb-1">
        Account
      </h2>

      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-[#0fd197] flex items-center justify-center flex-shrink-0">
          <img src={iconPersonWhite} alt="Personal" className="w-3.5 h-3.5" />
        </div>
        <span className="text-[13px] font-semibold text-(--color-dark)">
          Personal
        </span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="[&_label]:!mb-0.5 [&_label]:!text-[12px] [&_.form-input-base]:!py-1 [&_.form-input-base]:!text-[12px] [&_.form-input-base:disabled]:pointer-events-none"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-[0.5rem]">
          <div onClick={handleReadOnlyClick} className="cursor-not-allowed">
            <Input
              label="Username"
              value={profile.username || ''}
              readOnly
              placeholder="Username"
              variant="default"
              size="wide"
              disabled
            />
          </div>

          <div onClick={handleReadOnlyClick} className="cursor-not-allowed">
            <Input
              label="First Name"
              value={profile.firstName || ''}
              readOnly
              placeholder="First name"
              variant="default"
              size="wide"
              disabled
            />
          </div>

          <div onClick={handleReadOnlyClick} className="cursor-not-allowed">
            <Input
              label="Middle Name"
              value={profile.middleName || ''}
              readOnly
              placeholder="Middle name"
              variant="default"
              size="wide"
              disabled
            />
          </div>

          <div onClick={handleReadOnlyClick} className="cursor-not-allowed">
            <Input
              label="Last Name"
              value={profile.lastName || ''}
              readOnly
              placeholder="Last name"
              variant="default"
              size="wide"
              disabled
            />
          </div>

          <div
            className="sm:col-span-2 cursor-not-allowed"
            onClick={handleReadOnlyClick}
          >
            <label className="form-label block mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {[
                { value: 'male', label: 'Male', icon: IconMale },
                { value: 'female', label: 'Female', icon: IconFemale },
                { value: 'other', label: 'Other', icon: IconGenderOther },
              ].map(g => {
                const isSelected = selectedGender === g.value;
                return (
                  <span
                    key={g.value}
                    className={cn(
                      'flex items-center gap-1 text-[13px] text-[--color-dark]',
                      !isSelected && 'opacity-40'
                    )}
                  >
                    <span
                      className={cn(
                        'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                        isSelected ? 'border-[#34cc8b]' : 'border-gray-400'
                      )}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34cc8b]" />
                      )}
                    </span>
                    {g.label}
                    <img src={g.icon} alt={g.label} className="w-3.5 h-3.5" />
                  </span>
                );
              })}
            </div>
          </div>

          <div onClick={handleReadOnlyClick} className="cursor-not-allowed">
            <Calendar
              label="Date of Birth"
              value={profile.dateOfBirth || ''}
              onChange={() => {}}
              isRequired
              placeholder="DD/MM/YYYY"
              dateFormat="dd/MM/yyyy"
              maxDate={new Date()}
              disabled
            />
          </div>

          <div onClick={handleReadOnlyClick} className="cursor-not-allowed">
            <label className="form-label block mb-2">Age</label>
            <input
              type="text"
              value={calculatedAge || ''}
              readOnly
              disabled
              placeholder="Age"
              className="form-input-base w-full bg-gray-50 text-body-normal pl-4 caret-transparent cursor-not-allowed select-none"
            />
          </div>

          <div>
            <label className="form-label block mb-2">Phone number</label>
            <div className="flex gap-1">
              <div className="w-[80px]">
                <CountryCodeDropdown onChange={() => {}} />
              </div>
              <div className="flex-1">
                <Input
                  type="tel"
                  {...register('phone')}
                  placeholder="9876543210"
                  maxLength={10}
                  error={errors.phone?.message}
                  variant="default"
                  size="default"
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Email"
              type="email"
              {...register('email')}
              placeholder="Enter email"
              isRequired
              error={errors.email?.message}
              variant="default"
              size="wide"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || isSaving}
            isLoading={isSaving}
            loadingText="Saving..."
            rightIcon={<i className="fa-solid fa-arrow-right text-xs" />}
          >
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsAccount;
