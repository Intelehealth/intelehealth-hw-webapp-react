import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import iconAddPatient from '../../assets/icons/appiontment/icon-add-patient.svg';
import iconArrowright from '../../assets/icons/appiontment/icon-arrow-right.svg';
import iconOPatient from '../../assets/icons/appiontment/icon-o-patient.svg';
import iconCalenderBlue from '../../assets/icons/icon-calendar-blue.svg';
import iconRightArrow from '../../assets/icons/icon-right-arrow.svg';
import iconSummeryList from '../../assets/icons/icon-summary-list.svg';
import imgPrescriptionGreen from '../../assets/images/img-prescription-green.svg';
import DashboardCard from '../../components/common/dashboard-card.component';
import { useOpenVisits } from '../../hooks/useOpenVisits';
import { usePrescriptionsPending } from '../../hooks/usePrescriptionsPending';
import { usePrescriptionsReceived } from '../../hooks/usePrescriptionsReceived';
import ROUTES from '../../routes/paths';
import { AchievementsComponent } from './achievements.component';
import NotificationList from './notification-list.component';
import { PrescriptionsReceived } from './prescriptions-received.component';

type DashboardProps = {
  initialShowPrescriptions?: boolean;
};

const DashboardComponent = ({
  initialShowPrescriptions = false,
}: DashboardProps) => {
  const [showPrescriptions, setShowPrescriptions] = useState(
    initialShowPrescriptions
  );
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const { totalCount: receivedCount } = usePrescriptionsReceived();
  const { totalCount: pendingCount } = usePrescriptionsPending();
  const { totalCount: openVisitsCount } = useOpenVisits();
  const navigate = useNavigate();
  const location = useLocation();
  const showNotifications = location.pathname === ROUTES.NOTIFICATIONS;
  const closeNotifications = () => {
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <div className="p-4 lg:p-3 flex flex-col gap-4 lg:gap-3 h-full">
      {!showNotifications && showPrescriptions && (
        <button
          className="flex md:hidden items-center gap-2 text-[#2E1E91] font-semibold text-[16px]"
          onClick={() => setShowPrescriptions(false)}
        >
          ← Prescriptions
        </button>
      )}

      {!showNotifications && (
        <button
          className={`${showPrescriptions ? 'hidden' : 'flex'} md:hidden items-center h-[46px] justify-between rounded-lg bg-[#2E1E91] px-4 py-1 text-white shadow-md`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-full bg-white/20">
              <img src={iconAddPatient} className="w-[34px] h-[34px]" />
            </div>
            <span className="font-semibold text-[18px]">Add Patients</span>
          </div>
          <img src={iconArrowright} className="w-[34px] h-[34px]" />
        </button>
      )}

      <div
        className={`${showPrescriptions ? 'hidden md:grid' : 'grid'} w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-3`}
      >
        <div
          className="cursor-pointer"
          onClick={() => navigate(ROUTES.PRESCRIPTIONS)}
        >
          <DashboardCard
            title="Prescriptions"
            subtitle={`<strong>${receivedCount}</strong> out of <strong>${receivedCount + pendingCount}</strong> received`}
            bg="bg-(--color-accent-light)"
            iconBg="bg-green-300"
            icon={iconRightArrow}
            image={imgPrescriptionGreen}
          />
        </div>
        <div
          className="cursor-pointer"
          onClick={() => navigate(ROUTES.OPEN_VISITS)}
        >
          <DashboardCard
            title="Open visits"
            subtitle={`<strong>${openVisitsCount}</strong> Unclosed visits`}
            bg="bg-(--color-primary-light)"
            iconBg="bg-purple-300"
            icon={iconRightArrow}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:col-span-1">
          <DashboardCard
            title="Appointments"
            subtitle="<strong>0</strong> Upcoming"
            bg="bg-white"
            iconBg="bg-purple-200"
            icon={iconCalenderBlue}
          />
          <DashboardCard
            title="Follow-up visits"
            subtitle="<strong>0</strong> Pending"
            bg="bg-white"
            iconBg="bg-purple-200"
            icon={iconSummeryList}
          />
        </div>
      </div>

      {!showNotifications && (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-3 flex-1 min-h-0">
          <div
            className={`${showPrescriptions ? 'flex' : 'hidden md:flex'} flex-[3] min-h-0 flex-col gap-4 lg:gap-3`}
          >
            <div className="flex flex-row gap-4 lg:gap-3">
              <button
                className="hidden md:flex items-center h-[46px] justify-between rounded-lg bg-[#2E1E91] px-4 py-1 text-white shadow-md md:w-56 lg:w-72 xl:w-96 shrink-0 cursor-pointer"
                onClick={() =>
                  navigate(
                    ROUTES.PATIENT.BASE + '/' + ROUTES.PATIENT.ADD_PATIENT
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-full bg-white/20">
                    <img src={iconAddPatient} className="w-[34px] h-[34px]" />
                  </div>
                  <span className="font-semibold text-[14px]">
                    Add Patients
                  </span>
                </div>
                <img src={iconArrowright} className="w-[34px] h-[34px]" />
              </button>

              <div className="flex flex-1 items-center h-[46px] gap-4 rounded-lg bg-white px-4 py-1 border border-[#ECEEFF] shadow-[0px_1px_2px_0px_#1018280D] shadow-sm">
                <div className="flex items-center justify-center rounded-full bg-orange-100 shrink-0">
                  <img className="w-[34px] h-[34px]" src={iconOPatient} />
                </div>
                <p className="text-[#595959] md:text-[14px] sm:text-[18px]">
                  <span className="font-semibold">
                    {prescriptionCount} Patients{' '}
                  </span>
                  are waiting their Pending Prescriptions
                </p>
              </div>
            </div>

            <div
              className={`${showPrescriptions ? 'flex' : 'hidden md:flex'} lg:flex-1 lg:min-h-0 flex-col`}
            >
              <PrescriptionsReceived onCountLoaded={setPrescriptionCount} />
            </div>
          </div>

          <AchievementsComponent />
        </div>
      )}

      {showNotifications && (
        <div className="lg:flex-1 lg:min-h-0 lg:overflow-auto">
          <NotificationList onClose={closeNotifications} />
        </div>
      )}
    </div>
  );
};

export default DashboardComponent;
