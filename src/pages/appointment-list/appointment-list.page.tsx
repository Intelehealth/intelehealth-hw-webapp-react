import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { AppointmentListComponent } from '../../modules/dashboard/appointment-list.component';
import ROUTES from '../../routes/paths';

const AppointmentListPage = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Appointment List' },
  ]);

  return (
    <div className="p-4 flex-1 min-h-0 flex flex-col">
      <AppointmentListComponent initialRowCount={10} />
    </div>
  );
};

export default AppointmentListPage;
