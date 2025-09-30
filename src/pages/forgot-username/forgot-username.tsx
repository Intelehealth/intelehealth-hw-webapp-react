import React from 'react';
import iconRoundedLock from '../../assets/icons/icon-rounded-lock.svg';
import sliderImage4 from '../../assets/images/slider/slider-image-4.png';
import AuthComponent from '../../modules/auth/auth.component';
import ForgotUsernameComponent from '../../modules/auth/forgot-username/forgot-username.component';

const slides = [
  {
    image: sliderImage4,
    title: 'Data security, assured.',
    description:
      'Intelehealth ensures data security by implementing strong encryption, multi-layered authentication and adhering to compliance standards like HIPAA, protecting patient data.',
  },
];

const ForgotUsernamePage: React.FC = () => {
  return (
    <AuthComponent
      title="Forgot User Id !"
      description=""
      slides={slides}
      mobileImage={iconRoundedLock}
    >
      <ForgotUsernameComponent />
    </AuthComponent>
  );
};

export default ForgotUsernamePage;
