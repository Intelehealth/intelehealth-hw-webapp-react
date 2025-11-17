import React from 'react';
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { Calendar, Dropdown, Input, Radio } from '../../components/common';
import CountryCodeDropdown from '../../components/common/contry-code-dropdown.component';
import { calculateAge } from '../../utils/utils';
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
}

const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  register,
  errors,
  watch,
  setValue,
  trigger,
  onPhotoModalOpen,
  onCountryChange,
}) => {
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Mobile: Single column layout */}
      <div className="lg:hidden space-y-4">
        {/* Profile Photo Section - Mobile */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-camera text-gray-500 text-2xl"></i>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-500 underline text-sm text-center cursor-pointer"
            onClick={onPhotoModalOpen}
          >
            Change photo
          </button>
        </div>

        {/* Mobile Form Fields */}
        <div className="space-y-4">
          <Input
            label="User name"
            {...register('username')}
            placeholder="Username"
            variant="default"
            size="wide"
          />

          <Dropdown
            label="Setup location"
            value={watch('setupLocation') || ''}
            onChange={(value: string | string[]) => {
              const locationValue = Array.isArray(value) ? value[0] : value;
              setValue('setupLocation', locationValue);
            }}
            options={locationOptions}
            placeholder="Select"
            isRequired={false}
            error={errors.setupLocation?.message}
          />

          <Input
            label="First Name"
            {...register('firstName')}
            placeholder="Enter first name"
            isRequired={true}
            error={errors.firstName?.message}
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

          <Input
            label="Last Name"
            {...register('lastName')}
            placeholder="Enter last name"
            isRequired={true}
            error={errors.lastName?.message}
            variant="default"
            size="wide"
          />

          {/* Gender Selection - Mobile */}
          <div className="mb-4">
            <label className="form-label block mb-3 text-base lg:text-sm">
              Gender <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Radio {...register('gender')} value="male" label="Male" />
                <i className="fa-solid fa-mars text-gray-600 text-sm"></i>
              </div>
              <div className="flex items-center gap-2">
                <Radio {...register('gender')} value="female" label="Female" />
                <i className="fa-solid fa-venus text-gray-600 text-sm"></i>
              </div>
              <div className="flex items-center gap-2">
                <Radio {...register('gender')} value="other" label="Other" />
                <i className="fa-solid fa-transgender text-gray-600 text-sm"></i>
              </div>
            </div>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Column 1: Profile Image, First Name, Gender, Email */}
      <div className="hidden lg:block space-y-2">
        <div className="flex flex-col items-start gap-2">
          <div className="relative">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-user text-gray-400 text-lg"></i>
            </div>
            <button
              type="button"
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <i className="fa-solid fa-camera text-white text-xs"></i>
            </button>
          </div>
          <button
            type="button"
            className="text-card-head underline cursor-pointer"
            style={{ color: '#8f8ca0' }}
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

        <div>
          <label className="form-label block mb-2">
            Gender <span className="text-[--color-error]">*</span>
          </label>
          <div className="flex gap-4">
            <Radio {...register('gender')} value="male" label="Male" />
            <Radio {...register('gender')} value="female" label="Female" />
            <Radio {...register('gender')} value="other" label="Other" />
          </div>
          {errors.gender && (
            <p className="text-sm text-[--color-error] mt-1">
              {errors.gender.message}
            </p>
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
      <div className="space-y-2">
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
            <label className="form-label block mb-2">
              Age <span className="text-[--color-error]">*</span>
            </label>
            <input
              type="text"
              value={calculatedAge || ''}
              readOnly
              className="form-input-base w-full text-center bg-gray-50 text-sm"
              placeholder="Age"
            />
          </div>
        </div>
      </div>

      {/* Column 3: Setup Location, Last Name, Phone Number */}
      <div className="space-y-2">
        <Dropdown
          label="Setup location"
          value={watch('setupLocation') || ''}
          onChange={(value: string | string[]) => {
            const locationValue = Array.isArray(value) ? value[0] : value;
            setValue('setupLocation', locationValue);
          }}
          options={locationOptions}
          placeholder="Select"
          isRequired={false}
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
          <label className="form-label block mb-2">
            Phone Number <span className="text-[--color-error]">*</span>
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
