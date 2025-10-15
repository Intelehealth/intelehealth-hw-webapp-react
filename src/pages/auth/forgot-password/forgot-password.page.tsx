import React from 'react';
import iconRoundedLock from '../../../assets/icons/icon-rounded-lock.svg';
import sliderImage4 from '../../../assets/images/slider/slider-image-4.png';
import AuthComponent from '../../../modules/auth/auth.component';
import ForgotPasswordComponent from '../../../modules/auth/forgot-password/forgot-password.component';

const slides = [
  {
    image: sliderImage4,
    title: 'Data security, assured.',
    description:
      'Intelehealth ensures data security by implementing strong encryption, multi-layered authentication and adhering to compliance standards like HIPAA, protecting patient data.',
  },
];

const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthComponent
      title="Forgot Password !"
      description="Follow the instructions below to use your account again."
      slides={slides}
      mobileImage={iconRoundedLock}
      showLanguages={false}
    >
      <ForgotPasswordComponent />
    </AuthComponent>
  );
};

export default ForgotPasswordPage;
