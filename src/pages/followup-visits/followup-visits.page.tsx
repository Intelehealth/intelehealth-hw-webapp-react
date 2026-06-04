import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { FollowupVisitsComponent } from '../../modules/dashboard/followup-visits.component';
import ROUTES from '../../routes/paths';

const FollowupVisitsPage = () => {
  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Follow-up Visits' },
  ]);

  return (
    <div className="p-4 flex-1 min-h-0 flex flex-col">
      <FollowupVisitsComponent initialRowCount={10} />
    </div>
  );
};

export default FollowupVisitsPage;
