import { OpenVisitsComponent } from '../../modules/dashboard/open-visits.component';

const OpenVisitsPage = () => {
  return (
    <div className="p-4 flex-1 min-h-0 flex flex-col">
      <OpenVisitsComponent initialRowCount={10} />
    </div>
  );
};

export default OpenVisitsPage;
