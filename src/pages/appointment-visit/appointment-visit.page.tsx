import React from 'react';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import AppointmentVisitComponent from '../../modules/appointment-visit/appointment-visit.component';
import ROUTES from '../../routes/paths';

const AppointmentVisitPage: React.FC = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Schedule Appointment' },
  ]);

  return <AppointmentVisitComponent />;
};

export default AppointmentVisitPage;
