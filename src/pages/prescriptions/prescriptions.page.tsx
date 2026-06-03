import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { PrescriptionsReceived } from '../../modules/dashboard/prescriptions-received.component';
import ROUTES from '../../routes/paths';

const PrescriptionsPage = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Prescriptions' },
  ]);

  return (
    <div className="p-4 flex-1 min-h-0 flex flex-col">
      <PrescriptionsReceived initialRowCount={9} />
    </div>
  );
};

export default PrescriptionsPage;
