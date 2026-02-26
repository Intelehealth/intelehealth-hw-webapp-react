import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconAddPatient from '../../assets/icons/appiontment/icon-add-patient.svg';
import iconArrowright from '../../assets/icons/appiontment/icon-arrow-right.svg';
import iconOPatient from '../../assets/icons/appiontment/icon-o-patient.svg';
import iconCalenderBlue from '../../assets/icons/icon-calendar-blue.svg';
import iconRightArrow from '../../assets/icons/icon-right-arrow.svg';
import iconSummeryList from '../../assets/icons/icon-summary-list.svg';
import imgPrescriptionGreen from '../../assets/images/img-prescription-green.svg';
import DashboardCard from '../../components/common/dashboard-card.component';
import ROUTES from '../../routes/paths';
import { PrescriptionstRecivied } from './prescriptionst-recivied.component';

// Declare the functional component with the FC type and prop interface
const DashboardComponent = () => {
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Mobile: back button shown when in prescriptions detail view */}
      {showPrescriptions && (
        <button
          className="flex md:hidden items-center gap-2 text-[#2E1E91] font-semibold text-[16px]"
          onClick={() => setShowPrescriptions(false)}
        >
          ← Prescriptions
        </button>
      )}

      {/* Add Patients Button - mobile only (top), hidden in detail view */}
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

      {/* Dashboard cards - hidden on mobile when in prescriptions detail view */}
      <div
        className={`${showPrescriptions ? 'hidden md:grid' : 'grid'} w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}
      >
        {/* Prescriptions card - clickable to navigate to prescriptions page */}
        <div
          className="cursor-pointer"
          onClick={() => navigate(ROUTES.PRESCRIPTIONS)}
        >
          <DashboardCard
            title="Prescriptions"
            subtitle="<strong>5</strong> out of <strong>12</strong> received"
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
            subtitle="<strong>12</strong> Unclosed visits"
            bg="bg-(--color-primary-light)"
            iconBg="bg-purple-300"
            icon={iconRightArrow}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:col-span-1">
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

      {/* Add Patients + Pending Prescriptions row:
          - Desktop/Tablet: always visible
          - Mobile: only visible when showPrescriptions is true */}
      <div
        className={`${showPrescriptions ? 'flex' : 'hidden md:flex'} flex-col gap-4 md:flex-row`}
      >
        {/* Add Patients Button - desktop only */}
        <button className="hidden md:flex items-center h-[46px] justify-between rounded-lg bg-[#2E1E91] px-4 py-1 text-white shadow-md md:w-56 lg:w-72 xl:w-96">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-full bg-white/20">
              <img src={iconAddPatient} className="w-[34px] h-[34px]" />
            </div>
            <span className="font-semibold text-[14px]">Add Patients</span>
          </div>
          <img src={iconArrowright} className="w-[34px] h-[34px]" />
        </button>

        {/* Pending Prescriptions Info */}
        <div className="flex flex-1 items-center h-[46px] gap-4 rounded-lg bg-white px-4 py-1 border border-[#ECEEFF] shadow-[0px_1px_2px_0px_#1018280D] shadow-sm">
          <div className="flex items-center justify-center rounded-full bg-orange-100">
            <img className="w-[34px] h-[34px]" src={iconOPatient} />
          </div>
          <p className="text-[#595959] md:text-[14px] sm:text-[18px]">
            <span className="font-semibold">0 Patients </span>
            are waiting their Pending Prescriptions
          </p>
        </div>
      </div>

      {/* Table:
          - Desktop/Tablet: always visible
          - Mobile: only visible when showPrescriptions is true */}
      <div className={showPrescriptions ? '' : 'hidden md:block'}>
        <PrescriptionstRecivied />
      </div>
    </div>
  );
};

export default DashboardComponent;
