/* v8 ignore next line */
import rightRedHeartbeat from '../../../assets/images/slider/left_red_heartbeat.png';
/* v8 ignore next line */
import rightGreenHeartbeat from '../../../assets/images/slider/right_green_heartbeat.png';
/* v8 ignore next line */
import sliderImage1 from '../../../assets/images/slider/slider-image-1.png';
/* v8 ignore next line */
import sliderImage2 from '../../../assets/images/slider/slider-image-2.png';
/* v8 ignore next line */
import sliderImage3 from '../../../assets/images/slider/slider-image-3.png';
/* v8 ignore next line */
import mainLogo from '../../../assets/logo/intelehealth-logo-white.png';
import { useTranslation } from 'react-i18next';
import AuthComponent from '../../../modules/auth/auth.component';
import LoginComponent from '../../../modules/auth/login/login.component';

const slides = [
  {
    image: sliderImage1,
    title: 'Who are we?',
    description:
      'Intelehealth is an innovative telemedicine platform designed to bridge the healthcare access gap in remote regions by connecting frontline health workers and patients with a virtual doctor to provide high-quality health services.',
    heartbeat1: rightRedHeartbeat,
    heartbeat2: rightGreenHeartbeat,
  },
  {
    image: sliderImage2,
    title: 'Take patient visits',
    description:
      'This platform is powered by Ayu, a programmable digital assistant that supports frontline health workers with evidence-based protocols for primary healthcare in regional languages.',
    heartbeat1: rightRedHeartbeat,
    heartbeat2: rightGreenHeartbeat,
  },
  {
    image: sliderImage3,
    title: 'Provide prescriptions',
    description:
      'The cloud-based open source platform designed for a low-resource environment combined with a customized implementation strategy creates a digital health solution for impactful health outcomes.',
    heartbeat1: rightRedHeartbeat,
    heartbeat2: rightGreenHeartbeat,
  },
];

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <AuthComponent
      title={t('Auth.Welcome_Back')}
      description={t('Auth.Login_Continue_Description')}
      slides={slides}
      mobileImage={mainLogo}
      hideSliderImagesForMobile={true}
    >
      <LoginComponent />
    </AuthComponent>
  );
};

export default LoginPage;
