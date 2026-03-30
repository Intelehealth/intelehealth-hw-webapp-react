import React from 'react';
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import DefaultUserImage from '../../assets/images/default-user-img.svg';
import IconMale from '../../assets/icons/icon-male.svg';
import IconFemale from '../../assets/icons/icon-female.svg';
import IconGenderOther from '../../assets/icons/icon-gender-other.svg';
import { Calendar, Dropdown, Input, Radio } from '../../components/common';
import CountryCodeDropdown from '../../components/common/contry-code-dropdown.component';
import { calculateAge } from '../../utils/utils';
import type { ProfileFormValues } from './profile.validation';
import type { LocationOption } from '../../context/ProfileContext';

interface ProfileFormFieldsProps {
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  watch: UseFormWatch<ProfileFormValues>;
  setValue: UseFormSetValue<ProfileFormValues>;
  trigger: (name?: keyof ProfileFormValues) => Promise<boolean>;
  onPhotoModalOpen: () => void;
  onCountryChange: (country: {
    name: string;
    code: string;
    dial_code: string;
  }) => void;
  profileImage?: string;
  locationOptions?: LocationOption[];
}

const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  register,
  errors,
  watch,
  setValue,
  trigger,
  onPhotoModalOpen,
  onCountryChange,
  profileImage,
  locationOptions = [],
}) => {
  const watchedDateOfBirth = watch('dateOfBirth');
  const calculatedAge = React.useMemo(
    () => calculateAge(watchedDateOfBirth || ''),
    [watchedDateOfBirth]
  );

  return (
    <div className="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-6">
      {/* ── Profile Image (mobile: centered, desktop: top-left) ── */}
      <div className="flex flex-col items-center md:items-start gap-0 md:gap-1 md:col-span-1">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
            <img
              src={profileImage || DefaultUserImage}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={e => {
                e.currentTarget.src = DefaultUserImage;
              }}
            />
          </div>
          {/* Camera icon — desktop only */}
          <button
            type="button"
            className="hidden md:flex absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onClick={onPhotoModalOpen}
          >
            <i className="fa-solid fa-camera text-white text-xs" />
          </button>
        </div>
        <button
          type="button"
          className="text-gray-500 underline text-xs md:text-sm mt-0 md:mt-1"
          onClick={onPhotoModalOpen}
        >
          Change photo
        </button>
      </div>

      {/* ── All Fields (mobile: single col, desktop: 3-col grid) ── */}
      <div className="flex flex-col gap-2 md:contents">
        {/* Username */}
        <div className="md:col-start-2 md:col-span-1">
          <Input
            label="User name"
            {...register('username')}
            placeholder="Username"
            variant="default"
            size="wide"
            disabled
          />
        </div>

        {/* Setup Location */}
        <div className="md:col-start-3 md:col-span-1">
          <Dropdown
            label="Setup location"
            value={watch('setupLocation') || ''}
            onChange={async (value: string | string[]) => {
              const v = Array.isArray(value) ? value[0] : value;
              setValue('setupLocation', v);
              await trigger('setupLocation');
            }}
            options={locationOptions}
            placeholder="Select"
            isRequired
            error={errors.setupLocation?.message}
          />
        </div>

        {/* First Name */}
        <div className="md:col-start-1 md:col-span-1">
          <Input
            label="First Name"
            {...register('firstName')}
            placeholder="Enter first name"
            isRequired
            error={errors.firstName?.message}
            variant="default"
            size="wide"
            disabled
          />
        </div>

        {/* Last Name */}
        <div className="md:col-start-2 md:col-span-1">
          <Input
            label="Last Name"
            {...register('lastName')}
            placeholder="Enter last name"
            isRequired
            error={errors.lastName?.message}
            variant="default"
            size="wide"
            disabled
          />
        </div>

        {/* Gender */}
        <div className="md:col-start-1 md:col-span-1">
          <label className="form-label block mb-2 text-sm text-gray-400">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            {[
              { value: 'male', label: 'Male', icon: IconMale },
              { value: 'female', label: 'Female', icon: IconFemale },
              { value: 'other', label: 'Other', icon: IconGenderOther },
            ].map(g => (
              <div key={g.value} className="flex items-center gap-1 opacity-60">
                <Radio
                  {...register('gender')}
                  value={g.value}
                  label={g.label}
                  disabled
                />
                <img src={g.icon} alt={g.label} className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Date of Birth + Age */}
        <div className="flex gap-3 md:col-start-2 md:col-span-1">
          <div className="flex-1">
            <Calendar
              label="Date of Birth"
              value={watch('dateOfBirth') || ''}
              onChange={async (date: string) => {
                setValue('dateOfBirth', date);
                if (date) await trigger('dateOfBirth');
              }}
              isRequired
              error={errors.dateOfBirth?.message}
              placeholder="Select date of birth"
              dateFormat="dd-MMM-yy"
              maxDate={new Date()}
            />
          </div>
          <div className="w-20">
            <label className="form-label block mb-3 text-sm">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={calculatedAge || ''}
              readOnly
              placeholder="Age"
              className="form-input-base w-full text-center bg-gray-50 text-sm"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="md:col-start-3 md:col-span-1">
          <label className="form-label block mb-2 text-sm">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="w-1/3">
              <CountryCodeDropdown onChange={onCountryChange} />
            </div>
            <div className="w-2/3">
              <Input
                type="tel"
                {...register('phone')}
                placeholder="9876543210"
                maxLength={10}
                error={errors.phone?.message}
                variant="default"
                size="wide"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="md:col-start-1 md:col-span-1">
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
    </div>
  );
};

export default ProfileFormFields;
