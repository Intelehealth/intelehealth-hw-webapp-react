import React from 'react';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import AboutusComponent from '../../modules/about-us/about-us.component';
import ROUTES from '../../routes/paths';

const AboutusPage: React.FC = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'About Us' },
  ]);

  return <AboutusComponent />;
};
export default AboutusPage;
