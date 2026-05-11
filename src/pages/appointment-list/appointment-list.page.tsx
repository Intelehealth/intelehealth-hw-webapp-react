import { AppointmentListComponent } from '../../modules/dashboard/appointment-list.component';

const AppointmentListPage = () => {
  return (
    <div className="p-4 flex-1 min-h-0 flex flex-col">
      <AppointmentListComponent initialRowCount={10} />
    </div>
  );
};

export default AppointmentListPage;
