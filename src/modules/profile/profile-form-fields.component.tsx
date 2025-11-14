import React, { useEffect, useState } from 'react';
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { Calendar, Dropdown, Input, Radio } from '../../components/common';
import { cookie } from '../../utils/cookie';
import { calculateAge } from '../../utils/utils';
import CountryCodeDropdown from '../auth/common/contry-code-dropdown.component';
import type { ProfileFormValues } from './profile.validation';

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
  profileUrl?: string;
}

const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  register,
  errors,
  watch,
  setValue,
  trigger,
  onPhotoModalOpen,
  onCountryChange,
  profileUrl,
}) => {
  // State to handle image loading errors
  const [imgError, setImgError] = useState(false);
  const sessionId = cookie.getJSessionId();
  // Generate profile image URL only when profileUrl changes
  const profileImageUrl = React.useMemo(() => {
    if (!profileUrl) return '';
    return `${profileUrl}`;
  }, [profileUrl]);
  // Rleset imgError when profileUrl changes (new image uploaded)
  useEffect(() => {
    setImgError(false);
  }, [profileImageUrl]);

  const locationOptions = [
    { value: 'sf-clinic', label: 'San Francisco Clinic' },
    { value: 'la-clinic', label: 'Los Angeles Clinic' },
    { value: 'ny-clinic', label: 'New York Clinic' },
  ];

  // Watch form values for real-time updates
  const watchedDateOfBirth = watch('dateOfBirth');

  // Calculate age when date of birth changes
  const calculatedAge = React.useMemo(() => {
    return calculateAge(watchedDateOfBirth || '');
  }, [watchedDateOfBirth]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Column 1: Profile Image, First Name, Gender, Email */}
      <div className="space-y-4 lg:space-y-2">
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center lg:items-start gap-3 lg:gap-2">
          <div className="relative">
            {!imgError && profileImageUrl && (
              <img
                key={profileImageUrl}
                src={profileImageUrl}
                alt="Profile"
                className="w-24 h-24 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-gray-200"
                onError={() => setImgError(true)}
              />
            )}
            {(imgError || !profileImageUrl) && (
              <div className="w-24 h-24 lg:w-16 lg:h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-user text-gray-400 text-lg lg:text-base"></i>
              </div>
            )}
            <button
              type="button"
              className="absolute -bottom-1 -right-1 w-6 h-6 lg:w-5 lg:h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onClick={onPhotoModalOpen}
            >
              <i className="fa-solid fa-camera text-white text-sm lg:text-xs"></i>
            </button>
          </div>
          <button
            type="button"
            className="text-sm lg:text-base text-gray-500 underline cursor-pointer hover:text-gray-700"
            onClick={onPhotoModalOpen}
          >
            Change photo
          </button>
        </div>

        <Input
          label="First Name"
          {...register('firstName')}
          placeholder="Enter first name"
          isRequired={true}
          error={errors.firstName?.message}
          variant="default"
          size="wide"
        />

        {/* Gender Selection */}
        <div>
          <label className="block mb-2 lg:mb-2 text-base lg:text-sm font-medium text-gray-700">
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4 lg:gap-4">
            <Radio {...register('gender')} value="male" label="Male" />
            <Radio {...register('gender')} value="female" label="Female" />
            <Radio {...register('gender')} value="other" label="Other" />
          </div>
          {errors.gender && (
            <p className="text-sm text-red-500 mt-1">{errors.gender.message}</p>
          )}
        </div>

        <Input
          label="Email"
          type="email"
          {...register('email')}
          placeholder="devi@intelehealth.org"
          isRequired={true}
          error={errors.email?.message}
          variant="default"
          size="wide"
        />
      </div>

      {/* Column 2: Username, Middle Name, Date of Birth, Age */}
      <div className="space-y-4 lg:space-y-2">
        <Input
          label="User name"
          {...register('username')}
          placeholder="Username"
          variant="default"
          size="wide"
        />

        <Input
          label="Middle Name"
          {...register('middleName')}
          placeholder="Enter middle name"
          isRequired={true}
          error={errors.middleName?.message}
          variant="default"
          size="wide"
        />

        <div className="flex gap-4">
          <div className="flex-1">
            <Calendar
              label="Date of Birth"
              value={watch('dateOfBirth') || ''}
              onChange={async (date: string) => {
                setValue('dateOfBirth', date);
                // Trigger validation to clear error
                if (date) {
                  await trigger('dateOfBirth');
                }
              }}
              isRequired={true}
              error={errors.dateOfBirth?.message}
              placeholder="Select date of birth"
              dateFormat="dd-MMM-yy"
              maxDate={new Date()}
            />
          </div>
          <div className="w-24">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={calculatedAge || ''}
              readOnly
              className="w-full text-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Age"
            />
          </div>
        </div>
      </div>

      {/* Column 3: Setup Location, Last Name, Phone Number */}
      <div className="space-y-4 lg:space-y-2">
        <Dropdown
          label="Setup location"
          value={watch('setupLocation') || ''}
          onChange={(value: string | string[]) => {
            const locationValue = Array.isArray(value) ? value[0] : value;
            setValue('setupLocation', locationValue);
          }}
          options={locationOptions}
          placeholder="Select"
          isRequired={true}
          error={errors.setupLocation?.message}
        />

        <Input
          label="Last Name"
          {...register('lastName')}
          placeholder="Enter last name"
          isRequired={true}
          error={errors.lastName?.message}
          variant="default"
          size="wide"
        />

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
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
      </div>
    </div>
  );
};

export default ProfileFormFields;
