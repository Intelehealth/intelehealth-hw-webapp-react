import { PrescriptionsReceived } from '../../modules/dashboard/prescriptions-received.component';

const PrescriptionsPage = () => {
  return (
    <div className="p-4 flex-1 min-h-0 flex flex-col">
      <PrescriptionsReceived initialRowCount={9} />
    </div>
  );
};

export default PrescriptionsPage;
