import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { OpenVisitsComponent } from '../../modules/dashboard/open-visits.component';
import ROUTES from '../../routes/paths';

const OpenVisitsPage = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Open Visits' },
  ]);

  return (
    <div className="p-4 flex-1 min-h-0 flex flex-col">
      <OpenVisitsComponent initialRowCount={10} />
    </div>
  );
};

export default OpenVisitsPage;
