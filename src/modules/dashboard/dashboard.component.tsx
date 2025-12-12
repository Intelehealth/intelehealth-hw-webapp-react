import iconCalenderBlue from '../../assets/icons/icon-calendar-blue.svg';
import iconRightArrow from '../../assets/icons/icon-right-arrow.svg';
import iconSummeryList from '../../assets/icons/icon-summary-list.svg';
import imgPrescriptionGreen from '../../assets/images/img-prescription-green.svg';
import DashboardCard from '../../components/common/dashboard-card.component';

// Declare the functional component with the FC type and prop interface
const DashboardComponent = () => {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Prescriptions"
          subtitle="<strong>5</strong> out of <strong>12</strong> received"
          bg="bg-(--color-accent-light)"
          iconBg="bg-green-300"
          icon={iconRightArrow}
          image={imgPrescriptionGreen}
        />
        <DashboardCard
          title="Close visits"
          subtitle="<strong>12</strong> Unclosed visits"
          bg="bg-(--color-primary-light)"
          iconBg="bg-purple-300"
          icon={iconRightArrow}
        />
        <div className="grid grid-cols-2 gap-4">
          <DashboardCard
            title="Appointments"
            subtitle="<strong>4</strong> Upcoming"
            bg="bg-white"
            iconBg="bg-purple-200"
            icon={iconCalenderBlue}
          />
          <DashboardCard
            title="Follow-up visits"
            subtitle="<strong>12</strong> Pending"
            bg="bg-white"
            iconBg="bg-purple-200"
            icon={iconSummeryList}
          />
        </div>
      </div>
      <div className="flex">
        <div
          className={`bg-(--color-primary) rounded-2xl shadow-md flex border border-gray-200 min-h-[150px]`}
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div
              className={`rounded-full flex items-center justify-center w-7 h-7 md:w-8 md:h-8`}
              style={{ backgroundColor: '#2e1e91' }}
            >
              <i
                className={`fa-solid fa-user-plus text-white text-xs md:text-sm`}
              ></i>
            </div>
            <span className="font-medium text-xs md:text-sm text-white">
              Add Patients
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardComponent;
