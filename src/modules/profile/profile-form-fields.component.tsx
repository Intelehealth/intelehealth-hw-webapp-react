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

  const calculatedAge = React.useMemo(() => {
    return calculateAge(watchedDateOfBirth || '');
  }, [watchedDateOfBirth]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1 */}
      <div className="space-y-4">
        {/* Profile Image */}
        <div className="flex flex-col items-center lg:items-start gap-2">
          <div className="relative">
            <div className="w-24 h-24 lg:w-16 lg:h-16 bg-gray-100 lg:bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <img
                src={profileImage || DefaultUserImage}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
                onError={e => {
                  e.currentTarget.src = DefaultUserImage;
                }}
              />
            </div>

            <button
              type="button"
              className="hidden lg:flex absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onClick={onPhotoModalOpen}
            >
              <i className="fa-solid fa-camera text-white text-xs"></i>
            </button>
          </div>

          <button
            type="button"
            className="text-gray-500 underline text-sm cursor-pointer"
            onClick={onPhotoModalOpen}
          >
            Change photo
          </button>
        </div>

        {/* First Name */}
        <Input
          label="First Name"
          {...register('firstName')}
          placeholder="Enter first name"
          isRequired
          error={errors.firstName?.message}
          variant="default"
          size="wide"
        />

        {/* Gender */}
        <div>
          <label className="form-label block mb-2 text-sm">
            Gender <span className="text-red-500">*</span>
          </label>

          <div className="flex gap-4">
            {[
              { value: 'male', label: 'Male', icon: IconMale },
              { value: 'female', label: 'Female', icon: IconFemale },
              { value: 'other', label: 'Other', icon: IconGenderOther },
            ].map(gender => (
              <div key={gender.value} className="flex items-center gap-2">
                <Radio
                  {...register('gender')}
                  value={gender.value}
                  label={gender.label}
                />
                <img src={gender.icon} alt={gender.label} className="w-4 h-4" />
              </div>
            ))}
          </div>

          {errors.gender && (
            <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
          )}
        </div>

        {/* Email */}
        <Input
          label="Email"
          type="email"
          {...register('email')}
          placeholder="devi@intelehealth.org"
          isRequired
          error={errors.email?.message}
          variant="default"
          size="wide"
        />
      </div>

      {/* Column 2 */}
      <div className="space-y-4">
        {/* Username - spacer to align with photo section on desktop */}
        <div className="lg:pb-4 ">
          <Input
            label="User name"
            {...register('username')}
            placeholder="Username"
            variant="default"
            size="wide"
            disabled
          />
        </div>

        {/* Middle Name - aligned with First Name */}
        <Input
          label="Middle Name"
          {...register('middleName')}
          placeholder="Enter middle name"
          isRequired
          error={errors.middleName?.message}
          variant="default"
          size="wide"
        />

        {/* DOB + Age */}
        <div className="flex gap-4">
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

          <div className="w-24">
            <label className="form-label block mb-3 text-sm">
              Age <span className="text-red-500">*</span>
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

      {/* Column 3 */}
      <div className="space-y-4">
        {/* Setup Location - spacer to align with photo section on desktop */}
        <div className="lg:pb-4">
          <Dropdown
            label="Setup location"
            isRequired
            value={watch('setupLocation') || ''}
            onChange={(value: string | string[]) => {
              const locationValue = Array.isArray(value) ? value[0] : value;
              setValue('setupLocation', locationValue);
            }}
            options={locationOptions}
            placeholder="Select"
            error={errors.setupLocation?.message}
          />
        </div>

        {/* Last Name - aligned with First Name */}
        <Input
          label="Last Name"
          {...register('lastName')}
          placeholder="Enter last name"
          isRequired
          error={errors.lastName?.message}
          variant="default"
          size="wide"
        />

        {/* Phone */}
        <div>
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
      </div>
    </div>
  );
};

export default ProfileFormFields;
