import { FollowupVisitsComponent } from '../../modules/dashboard/followup-visits.component';

const FollowupVisitsPage = () => {
  return (
    <div className="p-4 flex-1 min-h-0 flex flex-col">
      <FollowupVisitsComponent initialRowCount={10} />
    </div>
  );
};

export default FollowupVisitsPage;
