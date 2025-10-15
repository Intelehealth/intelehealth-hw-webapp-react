import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import iconRightArrow from '../../../../assets/icons/icon-right-arrow.svg';
import iconRoundedLock from '../../../../assets/icons/icon-rounded-lock.svg';
import { Button, Input } from '../../../../components/common';

const validationSchema = yup.object({
  username: yup.string().required('Username is required'),
});

interface UsernameFormData {
  username: string;
}

const UsernameFormComponent = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: 'onTouched',
    defaultValues: {
      username: '',
    },
  });

  const onSubmit = (data: UsernameFormData) => {
    navigate('/auth/verify-otp', {
      state: {
        value: data.username,
        type: 'username',
        title: 'Forgot Password !',
        description: 'Follow the instructions below to use your account again.',
        icon: iconRoundedLock,
        otpFor: 'password',
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <h3 className="text-lg w-full mt-6 mb-2 font-semibold">Enter Username</h3>
      <label className="block text-base text-(--color-muted) mb-4">
        Please enter your username provided by Intelehealth
      </label>
      <div className="mb-2 lg:mb-4">
        <Input
          className="input-base"
          placeholder="Enter your username"
          {...register('username')}
          error={errors.username?.message as string}
        />
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

export default UsernameFormComponent;
