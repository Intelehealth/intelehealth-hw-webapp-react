import { yupResolver } from '@hookform/resolvers/yup';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import IconMale from '../../assets/icons/icon-male.svg';
import IconFemale from '../../assets/icons/icon-female.svg';
import IconGenderOther from '../../assets/icons/icon-gender-other.svg';
import iconPersonWhite from '../../assets/icons/icon-person-white.svg';
import CountryCodeDropdown from '../../components/common/contry-code-dropdown.component';
import { Button, Input, Calendar } from '../../components/common';
import { cn } from '../../utils/cn';
import { calculateAge } from '../../utils/utils';
import { useProfileContext } from '../../context/ProfileContext';
import {
  profileSchema,
  type ProfileFormValues,
} from '../profile/profile.validation';
import type { RootState } from '../../store/store';

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
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(profileSchema),
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      username: profile.username || '',
      firstName: profile.firstName || '',
      middleName: profile.middleName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      dateOfBirth: profile.dateOfBirth || '',
      gender: (profile.gender as 'male' | 'female' | 'other') || 'male',
      setupLocation: profile.setupLocation || '',
    });
  }, [profile, reset]);

  const watchedDateOfBirth = watch('dateOfBirth');
  const calculatedAge = useMemo(
    () => calculateAge(watchedDateOfBirth || ''),
    [watchedDateOfBirth]
  );
  const selectedGender = watch('gender');

  const handleReadOnlyClick = useCallback(() => {
    setShowAdminAlert(true);
  }, []);

  const onSubmit = useCallback(
    async (data: ProfileFormValues) => {
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
      {/* Section heading */}
      <h2 className="text-sm font-semibold text-[--color-dark] mb-2">
        Account
      </h2>

      {/* Admin alert banner */}
      {showAdminAlert && (
        <div className="flex items-start justify-between bg-[#edf7f0] border border-[#b7e4c7] rounded-lg px-4 py-3 mb-5 gap-4">
          <span className="text-body-normal text-[--color-dark]">
            Please contact your system administrator to change these profile
            details
          </span>
          <button
            type="button"
            onClick={() => setShowAdminAlert(false)}
            className="text-[--color-muted] hover:text-[--color-dark] flex-shrink-0 mt-0.5"
          >
            <i className="fa-solid fa-times text-sm" />
          </button>
        </div>
      )}

      {/* Personal sub-tab */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-[#0fd197] flex items-center justify-center flex-shrink-0">
          <img src={iconPersonWhite} alt="Personal" className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold text-(--color-dark)">
          Personal
        </span>
      </div>

      {/* Form — compact: override Input's default label mb-3 */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="[&_label]:!mb-1 [&_label]:!text-[13px] [&_.form-input-base]:!py-1.5 [&_.form-input-base]:!text-[13px]"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {/* Username */}
          <div onClick={handleReadOnlyClick} className="cursor-pointer">
            <Input
              label="Username"
              {...register('username')}
              placeholder="Username"
              variant="default"
              size="wide"
              disabled
            />
          </div>

          {/* First Name */}
          <div onClick={handleReadOnlyClick} className="cursor-pointer">
            <Input
              label="First Name"
              {...register('firstName')}
              placeholder="First name"
              variant="default"
              size="wide"
              disabled
            />
          </div>

          {/* Middle Name */}
          <div onClick={handleReadOnlyClick} className="cursor-pointer">
            <Input
              label="Middle Name"
              {...register('middleName')}
              placeholder="Middle name"
              variant="default"
              size="wide"
              disabled
            />
          </div>

          {/* Last Name */}
          <div onClick={handleReadOnlyClick} className="cursor-pointer">
            <Input
              label="Last Name"
              {...register('lastName')}
              placeholder="Last name"
              variant="default"
              size="wide"
              disabled
            />
          </div>

          {/* Gender */}
          <div
            className="sm:col-span-2 cursor-pointer"
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

          {/* Date of Birth — left column */}
          <div onClick={handleReadOnlyClick} className="cursor-pointer">
            <Calendar
              label="Date of Birth"
              value={watch('dateOfBirth') || ''}
              onChange={async (date: string) => {
                setValue('dateOfBirth', date);
                if (date) await trigger('dateOfBirth');
              }}
              isRequired
              error={errors.dateOfBirth?.message}
              placeholder="DD/MM/YYYY"
              dateFormat="dd/MM/yyyy"
              maxDate={new Date()}
              disabled
            />
          </div>

          {/* Age — right column */}
          <div onClick={handleReadOnlyClick} className="cursor-pointer">
            <label className="form-label block mb-2">or Age</label>
            <input
              type="text"
              value={calculatedAge || ''}
              readOnly
              placeholder="Age"
              className="form-input-base w-full bg-gray-50 text-body-normal"
            />
          </div>

          {/* Phone Number — left column (aligned with Date of Birth) */}
          <div>
            <label className="form-label block mb-2">Phone number</label>
            <div className="flex gap-2">
              <div className="w-[90px]">
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

          {/* Email — full width */}
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

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2 mt-3">
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
