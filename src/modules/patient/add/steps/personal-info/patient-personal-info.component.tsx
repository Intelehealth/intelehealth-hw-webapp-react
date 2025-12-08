import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, type Resolver } from 'react-hook-form';
import type { InferType } from 'yup';
import DefaultUserImage from '../../../../../assets/images/default-user-img.svg';
import {
  Button,
  Calendar,
  Dropdown,
  Input,
  Radio,
  RadioGroup,
} from '../../../../../components/common';
import InputPhoneNumber from '../../../../../components/common/input-phone-number.component';
import { ProfilePhotoUpload } from '../../../../../components/common/profile-photo-upload.component';
import { calculateAge } from '../../../../../utils/common';
import { patientPersonalInfoSchema } from './patient-personal-info.validation';

type PatientPersonalInfoFormValues = InferType<
  typeof patientPersonalInfoSchema
>;

interface PatientPersonalInfoProps {
  defaultValues: PatientPersonalInfoFormValues;
  onNext: (data: { personalInfo: PatientPersonalInfoFormValues }) => void;
  onPrev: () => void;
}

export default function PatientPersonalInfo({
  defaultValues,
  onNext,
  onPrev,
}: PatientPersonalInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PatientPersonalInfoFormValues>({
    resolver: yupResolver(
      patientPersonalInfoSchema
    ) as Resolver<PatientPersonalInfoFormValues>,
    mode: 'onTouched',
    defaultValues,
  });

  const handleNext = (data: PatientPersonalInfoFormValues) => {
    onNext({ personalInfo: data });
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleNext)} className="space-y-6 h-full">
        <div className="flex flex-col h-full">
          <div className="h-full flex flex-col gap-6 md:overflow-auto">
            <ProfilePhotoUpload
              image={watch('profilePhoto') || DefaultUserImage}
              onUpload={(img: File | string) => {
                setValue('profilePhoto', img as string);
              }}
              imageFormat="base64"
            />
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
                  {...register('gender')}
                  onChange={value => setValue('gender', value)}
                  className="flex gap-2 md:gap-4"
                  value={watch('gender') ?? ''}
                  error={errors.gender?.message}
                >
                  <Radio value="M" label="Male" variant="primary" />
                  <Radio value="F" label="Female" variant="primary" />
                  <Radio value="O" label="Other" variant="primary" />
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
                  max={150}
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
                    const selectedValue = Array.isArray(value)
                      ? value[0]
                      : value;
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
                />
              </div>
              <div>
                <label className="block text-base text-(--color-muted) mb-2">
                  Emergency Contact Number *
                </label>
                <InputPhoneNumber
                  onChange={val => {
                    setValue('emergencyContactNumber', val.number);
                  }}
                  value={{
                    number: watch('emergencyContactNumber'),
                    countryCode: '+91',
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
          </div>
          <div className="flex gap-3 md:justify-end my-4">
            <Button
              variant="secondary"
              className="w-full md:w-[10%]"
              type="button"
              onClick={onPrev}
            >
              <span className="mx-auto w-full text-base">Back</span>
            </Button>
            <Button
              variant="primary"
              className="w-full md:w-[10%]"
              type="submit"
            >
              <span className="mx-auto w-full text-base">Next</span>
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
