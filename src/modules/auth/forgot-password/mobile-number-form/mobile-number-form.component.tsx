import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import iconRightArrow from '../../../../assets/icons/icon-right-arrow.svg';
import iconRoundedLock from '../../../../assets/icons/icon-rounded-lock.svg';
import { Button, Input } from '../../../../components/common';
import CountryCodeDropdown from '../../../../components/common/contry-code-dropdown.component';

const validationSchema = yup.object({
  mobile: yup
    .string()
    .required('Mobile number is required')
    .max(10, 'Mobile number cannot exceed 10 digits')
    .min(10, 'Mobile number must be at least 10 digits'),
});

interface MobileNumberFormData {
  mobile: string;
}

const MobileNumberFormComponent = () => {
  const navigate = useNavigate();
  const [country, setCountry] = useState<{
    name: string;
    code: string;
    dial_code: string;
  }>({
    name: '',
    code: '',
    dial_code: '',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: 'onTouched',
    defaultValues: {
      mobile: '',
    },
  });

  const onSubmit = (data: MobileNumberFormData) => {
    navigate('/auth/verify-otp', {
      state: {
        value: data.mobile,
        type: 'phoneNumber',
        title: 'Forgot Password !',
        description: 'Follow the instructions below to use your account again.',
        icon: iconRoundedLock,
        otpFor: 'password',
        countryCode: country.dial_code,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <h3 className="text-lg w-full mt-6 mb-2 font-semibold">
        Enter Mobile Number
      </h3>
      <label className="block text-base text-(--color-muted) mb-4">
        Please enter the mobile number registered with Intelehealth.
      </label>
      <div className="flex gap-2 justify-between w-full mb-2 lg:mb-4">
        <div className="w-1/3">
          <CountryCodeDropdown onChange={country => setCountry(country)} />
        </div>
        <div className="w-2/3">
          <Input
            className="input-base"
            placeholder="Enter your mobile number"
            type="tel"
            maxLength={10}
            {...register('mobile')}
            error={errors.mobile?.message as string}
          />
        </div>
      </div>
      {/* Submit button */}
      <div className="mt-[50px] lg:mt-2">
        <Button
          variant="primary"
          className="w-full"
          type="submit"
          rightIcon={<img src={iconRightArrow} />}
        >
          <span className="mx-auto w-full text-base">Continue</span>
        </Button>
      </div>
    </form>
  );
};

export default MobileNumberFormComponent;
