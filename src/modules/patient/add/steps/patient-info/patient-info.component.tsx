import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import * as yup from 'yup';
import type { InferType } from 'yup';
import { casteOptions } from '../../../../../assets/data/caste';
import { economicStatusOptions } from '../../../../../assets/data/economic-status';
import { educationOptions } from '../../../../../assets/data/education';
import { occupationOptions } from '../../../../../assets/data/occupation';
import IconFemale from '../../../../../assets/icons/icon-female.svg';
import IconGenderOther from '../../../../../assets/icons/icon-gender-other.svg';
import IconLocationGreenRoundedFilled from '../../../../../assets/icons/icon-location-green-rounded-filled.svg';
import IconMale from '../../../../../assets/icons/icon-male.svg';
import IconThreeDotGreenRoundedFilled from '../../../../../assets/icons/icon-three-dot-green-rounded-filled.svg';
import IconUserGreenRoundedFilled from '../../../../../assets/icons/icon-user-green-rounded-filled.svg';
import DefaultUserImage from '../../../../../assets/images/default-user-img.svg';
import {
  Button,
  Calendar,
  Dropdown,
  Input,
  Radio,
  RadioGroup,
} from '../../../../../components/common';
import CountrySelect from '../../../../../components/common/country-select.component';
import DistrictSelector from '../../../../../components/common/district-selector.component';
import InputPhoneNumber from '../../../../../components/common/input-phone-number.component';
import { ProfilePhotoUpload } from '../../../../../components/common/profile-photo-upload.component';
import StateSelector from '../../../../../components/common/state-selector.component';
import { fetchPostalCodeData } from '../../../../../services/postal-code.service';
import { showToast } from '../../../../../services/toast';
import { calculateAge } from '../../../../../utils/common';
import { patientAddressInfoSchema } from '../address-info/patient-address-info.validation';
import { patientOtherInfoSchema } from '../other-info/patient-other-info.validation';
import { patientPersonalInfoSchema } from '../personal-info/patient-personal-info.validation';

export const patientInfoSchema = yup
  .object()
  .concat(patientPersonalInfoSchema)
  .concat(patientAddressInfoSchema)
  .concat(patientOtherInfoSchema);

type PatientInfoFormValues = InferType<typeof patientInfoSchema>;

type PersonalValues = InferType<typeof patientPersonalInfoSchema>;
type AddressValues = InferType<typeof patientAddressInfoSchema>;
type OtherValues = InferType<typeof patientOtherInfoSchema>;

interface PatientInfoProps {
  defaultValues: PersonalValues & AddressValues & OtherValues;
  onNext: (data: {
    personalInfo: PersonalValues;
    addressInfo: AddressValues;
    otherInfo: OtherValues;
  }) => void;
  onPrev: () => void;
  isEditMode?: boolean;
}

export default function PatientInfo({
  defaultValues,
  onNext,
  onPrev,
  isEditMode = false,
}: PatientInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<PatientInfoFormValues>({
    resolver: yupResolver(patientInfoSchema) as Resolver<PatientInfoFormValues>,
    mode: 'onTouched',
    defaultValues,
  });

  const country = watch('country');
  const postalCode = watch('postalCode');
  const lastFetchedPincode = useRef('');

  // Auto-fill address when postal code is exactly 6 digits
  useEffect(() => {
    const trimmed = postalCode?.trim() ?? '';

    if (
      country?.toLowerCase() !== 'india' ||
      trimmed.length !== 6 ||
      trimmed === lastFetchedPincode.current
    ) {
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        const postalData = await fetchPostalCodeData(trimmed);

        if (controller.signal.aborted) return;

        lastFetchedPincode.current = trimmed;

        if (postalData) {
          if (postalData.state) {
            setValue('state', postalData.state, { shouldValidate: true });
          }
          if (postalData.district) {
            setValue('district', postalData.district, {
              shouldValidate: true,
            });
          }
          if (postalData.city) {
            setValue('city', postalData.city, { shouldValidate: true });
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching postal code data:', error);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [country, postalCode, setValue]);

  // Debounced toast for postal code validation
  useEffect(() => {
    const trimmed = postalCode?.trim() ?? '';

    if (!trimmed || trimmed.length === 6) {
      return;
    }

    const hasCountry = !!country;

    const toastTimeout = setTimeout(() => {
      if (!hasCountry) {
        showToast(
          'Country Required',
          'Please select a country before entering postal code.',
          'warning',
          { toastId: 'postal-code-country' }
        );
      } else {
        showToast(
          'Invalid Postal Code',
          'Postal Code must be exactly 6 digits.',
          'error',
          { toastId: 'postal-code-invalid' }
        );
      }
    }, 1000);

    return () => clearTimeout(toastTimeout);
  }, [postalCode, country]);

  const handleNext = (data: PatientInfoFormValues) => {
    const {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      age,
      phoneNumber,
      phoneNumberCountryCode,
      contactType,
      emergencyContactName,
      emergencyContactNumber,
      emergencyContactNumberCountryCode,
      profilePhoto,
      postalCode: pc,
      city,
      state,
      country: countryVal,
      district,
      correspondingAddress1,
      correspondingAddress2,
      sonDaughterWifeOf,
      occupation,
      caste,
      education,
      economicStatus,
    } = data;

    onNext({
      personalInfo: {
        firstName,
        middleName,
        lastName,
        gender,
        dateOfBirth,
        age,
        phoneNumber,
        phoneNumberCountryCode,
        contactType,
        emergencyContactName,
        emergencyContactNumber,
        emergencyContactNumberCountryCode,
        profilePhoto,
      },
      addressInfo: {
        postalCode: pc,
        city,
        state,
        country: countryVal,
        district,
        correspondingAddress1,
        correspondingAddress2,
      },
      otherInfo: {
        sonDaughterWifeOf,
        occupation,
        caste,
        education,
        economicStatus,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(handleNext)}>
      <div className="flex flex-col gap-6">
        <ProfilePhotoUpload
          image={watch('profilePhoto') || DefaultUserImage}
          onUpload={(img: File | string) => {
            setValue('profilePhoto', img as string);
          }}
          imageFormat="base64"
        />

        <div className="flex items-center gap-2">
          <img
            src={IconUserGreenRoundedFilled}
            alt="Personal"
            className="w-8 h-8"
          />
          <h3 className="text-base font-semibold">Personal</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Input
              {...register('firstName')}
              placeholder="Enter First Name"
              label="First Name"
              error={errors.firstName?.message}
              isRequired={true}
              allowedPattern={/^[A-Za-z]$/}
            />
          </div>
          <div>
            <Input
              {...register('middleName')}
              placeholder="Enter Middle Name"
              label="Middle Name"
              error={errors.middleName?.message}
              allowedPattern={/^[A-Za-z]$/}
            />
          </div>
          <div>
            <Input
              {...register('lastName')}
              placeholder="Enter Last Name"
              label="Last Name"
              error={errors.lastName?.message}
              isRequired={true}
              allowedPattern={/^[A-Za-z]$/}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <label className="text-base text-(--color-muted) mb-2">
              Gender<span className="text-red-500 ml-1">*</span>
            </label>
            <RadioGroup
              name="gender"
              value={watch('gender') ?? ''}
              onChange={(value: string) => setValue('gender', value)}
              error={errors.gender?.message}
              aria-labelledby="gender-label"
              className="flex gap-2 md:gap-4"
            >
              <div className="flex items-center gap-2">
                <Radio value="M" label="Male" variant="primary" />
                <img src={IconMale} alt="Male" className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <Radio value="F" label="Female" variant="primary" />
                <img src={IconFemale} alt="Female" className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <Radio value="O" label="Other" variant="primary" />
                <img src={IconGenderOther} alt="Other" className="w-4 h-4" />
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Calendar
              {...register('dateOfBirth')}
              placeholder="Enter Date Of Birth"
              label="Date Of Birth"
              error={errors.dateOfBirth?.message}
              value={watch('dateOfBirth') || ''}
              onChange={(date: string) => {
                setValue('dateOfBirth', date);
                if (date) {
                  const age = calculateAge(date);
                  setValue('age', age.toString());
                }
              }}
              dateFormat="dd/MM/yyyy"
              isRequired={true}
            />
          </div>
          <div>
            <Input
              {...register('age')}
              type="number"
              max={120}
              min={0}
              placeholder="Enter Age"
              label="Or Age"
              error={errors.age?.message}
            />
          </div>
          <div>
            <label className="block text-base text-(--color-muted) mb-2">
              Phone Number<span className="text-red-500 ml-1">*</span>
            </label>
            <InputPhoneNumber
              onChange={val => {
                setValue('phoneNumber', val.number);
                setValue('phoneNumberCountryCode', val.countryCode);
                trigger('emergencyContactNumber');
              }}
              value={{
                number: watch('phoneNumber'),
                countryCode: watch('phoneNumberCountryCode'),
              }}
              error={
                errors.phoneNumberCountryCode?.message
                  ? errors.phoneNumberCountryCode.message
                  : errors.phoneNumber?.message
                    ? errors.phoneNumber.message
                    : ''
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Dropdown
              label="Contact Type"
              placeholder="Select Contact Type"
              options={[{ label: 'Family', value: 'Family' }]}
              labelClassName="text-(--color-muted)"
              error={errors.contactType?.message}
              value={watch('contactType') ?? ''}
              onChange={(value: string | string[]) => {
                const selectedValue = Array.isArray(value) ? value[0] : value;
                setValue('contactType', selectedValue as 'Family');
              }}
              isRequired={true}
            />
          </div>
          <div>
            <Input
              {...register('emergencyContactName')}
              placeholder="Enter Emergency Contact Name"
              label="Emergency Contact Name"
              error={errors.emergencyContactName?.message}
              isRequired={true}
              allowedPattern={/^[A-Za-z]$/}
            />
          </div>
          <div>
            <label className="block text-base text-(--color-muted) mb-2">
              Emergency Contact Number *
            </label>
            <InputPhoneNumber
              onChange={val => {
                setValue('emergencyContactNumber', val.number);
                setValue('emergencyContactNumberCountryCode', val.countryCode);
                trigger('emergencyContactNumber');
              }}
              value={{
                number: watch('emergencyContactNumber'),
                countryCode: watch('emergencyContactNumberCountryCode'),
              }}
              placeholder="Enter Emergency Contact Number"
              error={
                errors.emergencyContactNumber?.message
                  ? errors.emergencyContactNumber.message
                  : ''
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <img
            src={IconLocationGreenRoundedFilled}
            alt="Address"
            className="w-8 h-8"
          />
          <h3 className="text-base font-semibold">Address</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <CountrySelect
              label="Country"
              placeholder="Select Country"
              labelClassName="text-(--color-muted)"
              error={errors.country?.message}
              value={watch('country') ?? ''}
              onChange={(value: string | string[]) => {
                const selectedValue = Array.isArray(value) ? value[0] : value;
                setValue('country', selectedValue);
              }}
              isRequired={true}
              clearable={false}
            />
          </div>
          <div>
            <Input
              {...register('postalCode')}
              placeholder="Enter Postal Code"
              label="Postal Code"
              error={errors.postalCode?.message}
              isRequired={true}
            />
          </div>
          <div>
            <StateSelector
              countryId={watch('country') ?? ''}
              label="State"
              placeholder="Select State"
              labelClassName="text-(--color-muted)"
              error={errors.state?.message}
              value={watch('state') ?? ''}
              onChange={(value: string | string[]) => {
                const selectedValue = Array.isArray(value) ? value[0] : value;
                setValue('state', selectedValue);
              }}
              isRequired={true}
              clearable={false}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <DistrictSelector
              countryId={watch('country') ?? ''}
              stateId={watch('state') ?? ''}
              label="District"
              placeholder="Select District"
              labelClassName="text-(--color-muted)"
              error={errors.district?.message}
              value={watch('district') ?? ''}
              onChange={(value: string | string[]) => {
                const selectedValue = Array.isArray(value) ? value[0] : value;
                setValue('district', selectedValue);
              }}
              isRequired={true}
              clearable={false}
            />
          </div>
          <div>
            <Input
              {...register('city')}
              placeholder="Enter Village/Town/City"
              label="Village/Town/City"
              error={errors.city?.message}
              isRequired={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 ">
          <div>
            <Input
              {...register('correspondingAddress1')}
              placeholder="Enter Corresponding Address 1"
              label="Corresponding Address"
              error={errors.correspondingAddress1?.message}
              isRequired={true}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 ">
          <div>
            <Input
              {...register('correspondingAddress2')}
              placeholder="Enter Corresponding Address 2"
              label="Corresponding Address 2"
              error={errors.correspondingAddress2?.message}
              isRequired={true}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <img
            src={IconThreeDotGreenRoundedFilled}
            alt="Other"
            className="w-8 h-8"
          />
          <h3 className="text-base font-semibold">Other</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Input
              {...register('sonDaughterWifeOf')}
              placeholder="Enter Son/Daughter/Wife Of"
              label="Enter Son/Daughter/Wife Of"
              error={errors.sonDaughterWifeOf?.message}
            />
          </div>
          <div>
            <Dropdown
              label="Occupation"
              placeholder="Select Occupation"
              options={occupationOptions}
              labelClassName="text-(--color-muted)"
              error={errors.occupation?.message}
              value={watch('occupation') ?? ''}
              onChange={(value: string | string[]) => {
                const selectedValue = Array.isArray(value) ? value[0] : value;
                setValue('occupation', selectedValue);
              }}
            />
          </div>
          <div>
            <Dropdown
              label="Caste"
              placeholder="Select Caste"
              options={casteOptions}
              labelClassName="text-(--color-muted)"
              error={errors.caste?.message}
              value={watch('caste') ?? ''}
              onChange={(value: string | string[]) => {
                const selectedValue = Array.isArray(value) ? value[0] : value;
                setValue('caste', selectedValue);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Dropdown
              label="Education"
              placeholder="Select Education"
              options={educationOptions}
              labelClassName="text-(--color-muted)"
              error={errors.education?.message}
              value={watch('education') ?? ''}
              onChange={(value: string | string[]) => {
                const selectedValue = Array.isArray(value) ? value[0] : value;
                setValue('education', selectedValue);
              }}
              isRequired={true}
            />
          </div>
          <div>
            <Dropdown
              label="Economic Status"
              placeholder="Select Economic Status"
              options={economicStatusOptions}
              labelClassName="text-(--color-muted)"
              error={errors.economicStatus?.message}
              value={watch('economicStatus') ?? ''}
              onChange={(value: string | string[]) => {
                const selectedValue = Array.isArray(value) ? value[0] : value;
                setValue('economicStatus', selectedValue);
              }}
            />
          </div>
        </div>
        <div className="flex gap-3 md:justify-end my-6">
          <Button
            variant="secondary"
            className="w-full md:w-[10%]"
            type="button"
            onClick={onPrev}
          >
            <span className="mx-auto w-full text-base">
              {isEditMode ? 'Cancel' : 'Back'}
            </span>
          </Button>
          <Button variant="primary" className="w-full md:w-[10%]" type="submit">
            <span className="mx-auto w-full text-base">
              {isEditMode ? 'Update' : 'Next'}
            </span>
          </Button>
        </div>
      </div>
    </form>
  );
}
