import React from 'react';
import iconRoundedLock from '../../../assets/icons/icon-rounded-lock.svg';
import sliderImage4 from '../../../assets/images/slider/slider-image-4.png';
import AuthComponent from '../../../modules/auth/auth.component';
import ResetPasswordComponent from '../../../modules/auth/reset-password/reset-password.component';

const slides = [
  {
    image: sliderImage4,
    title: 'Data security, assured.',
    description:
      'Intelehealth ensures data security by implementing strong encryption, multi-layered authentication and adhering to compliance standards like HIPAA, protecting patient data.',
  },
];

const ResetPasswordPage: React.FC = () => {
  const [title, setTitle] = React.useState('Reset Password !');
  const [description, setDescription] = React.useState(
    'Follow the instructions below to use your account again.'
  );
  return (
    <AuthComponent
      title={title}
      description={description}
      slides={slides}
      mobileImage={iconRoundedLock}
      showLanguages={false}
    >
      <ResetPasswordComponent
        changeTitle={setTitle}
        changeDescription={setDescription}
      />
    </AuthComponent>
  );
};

export default ResetPasswordPage;
