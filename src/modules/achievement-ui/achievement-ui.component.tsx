import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ROUTES from '../../routes/paths';
import Calendar from '../../components/common/calendar.component';
import { ACHIEVEMENT_TABS } from '../../utils/achievement.constants';
import { useAchievements } from '../../hooks/useAchievements';
import { useTimeSpent } from '../../hooks/useTimeSpent';
import type { UseAchievementsParams } from '../../types/achievement.types';
import iconAchievementClock from '../../assets/icons/icon-achievements-clock.svg';
import iconAchievementLevel1 from '../../assets/icons/icon-achievements-level1.svg';
import iconAchievementStar from '../../assets/icons/icon-achievements-star.svg';
import iconAchievement from '../../assets/icons/icon-achievements-title.svg';
import iconAchievementVisitCompleted from '../../assets/icons/icon-achievements-visit-completed.svg';
import iconAchievementVisitAdded from '../../assets/icons/icon-achievements-vist-added.svg';
import iconCalendarBlue from '../../assets/icons/icon-calendar-blue.svg';
import iconSync from '../../assets/icons/icon-sync.svg';
import iconThreeDot from '../../assets/icons/icon-three-dot-green-rounded.svg';

const AchievementCard = ({
  icon,
  label,
  value,
  bgColor,
  loading,
}: {
  icon: string;
  label?: string;
  value?: string | number;
  bgColor?: string;
  loading?: boolean;
}) => {
  return (
    <div
      className={`${bgColor} rounded-lg p-4 md:p-5 w-full min-h-[140px] md:min-h-[160px] flex flex-col`}
    >
      <div className="flex items-start justify-between">
        <img src={icon} alt="achievement star" />
      </div>
      <div className="flex flex-col gap-6 mt-5 mb-5">
        <div className="text-sm font-normal text-[#000000] font-weight-400">
          {label}
        </div>
        <div className="text-lg md:text-xl font-bold text-[#1A1A5E]">
          {loading ? '...' : value}
        </div>
      </div>
    </div>
  );
};

export const AchievementUiComponent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    (typeof ACHIEVEMENT_TABS)[keyof typeof ACHIEVEMENT_TABS]
  >(ACHIEVEMENT_TABS.OVERALL);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const achievementParams = useMemo<UseAchievementsParams | undefined>(() => {
    if (activeTab === ACHIEVEMENT_TABS.OVERALL) {
      return { period: 'overall' };
    }
    if (activeTab === ACHIEVEMENT_TABS.DAILY) {
      return undefined;
    }
    if (activeTab === ACHIEVEMENT_TABS.DATA_RANGE && fromDate && toDate) {
      return { fromDate, toDate };
    }
    return undefined;
  }, [activeTab, fromDate, toDate]);

  const { data, loading, error, refresh } = useAchievements(achievementParams);
  const timeSpent = useTimeSpent();

  return (
    <div className="w-full bg-white rounded-xl px-3 pb-3 md:py-3 md:bg-transparent md:rounded-none md:px-3 lg:px-4 flex flex-col">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between py-3 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <button className="p-1" onClick={() => navigate(ROUTES.DASHBOARD)}>
            <i className="fa-solid fa-arrow-left text-gray-600 text-lg" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">My achievements</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1" onClick={refresh}>
            <img src={iconSync} alt="sync" className="w-5 h-5" />
          </button>
          <button className="p-1">
            <img src={iconThreeDot} alt="menu" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex gap-3 items-center mb-4">
        <div className="flex items-center justify-center">
          <img src={iconAchievement} alt="achievement" />
        </div>
        <span className="text-lg font-semibold text-[#1A1A5E]">
          Achievements
        </span>
      </div>
      <hr className="hidden md:block border-t border-gray-200 mb-6 -mx-3 lg:-mx-4" />

      <div className="mt-4 md:mt-0 mb-6 gap-4 flex items-center">
        <img
          src={iconAchievementLevel1}
          alt="achievement-level1"
          className="w-14 h-14 md:w-20 md:h-20"
        />
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg md:text-2xl text-[#1A1A5E]">
            Level 1
          </span>
          <span className="font-normal text-sm md:text-base text-[#7F7B92]">
            1200 Points
          </span>
        </div>
      </div>

      {/* Tabs — border spans full width */}
      <div className="w-full md:w-fit border-b-2 border-[#FBE9E9] mb-5">
        <div className="flex text-sm md:text-base font-medium">
          <button
            onClick={() => setActiveTab(ACHIEVEMENT_TABS.OVERALL)}
            className={`flex-1 md:flex-none text-center md:text-left px-1 md:mr-6 pb-2 border-b-2 -mb-px transition font-semibold whitespace-nowrap
              ${
                activeTab === ACHIEVEMENT_TABS.OVERALL
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-[#7F7B92] hover:text-indigo-600'
              }`}
          >
            {ACHIEVEMENT_TABS.OVERALL}
          </button>
          <button
            onClick={() => setActiveTab(ACHIEVEMENT_TABS.DAILY)}
            className={`flex-1 md:flex-none text-center md:text-left px-1 md:mr-6 pb-2 border-b-2 -mb-px transition font-semibold whitespace-nowrap
              ${
                activeTab === ACHIEVEMENT_TABS.DAILY
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-[#7F7B92] hover:text-indigo-600'
              }`}
          >
            {ACHIEVEMENT_TABS.DAILY}
          </button>
          <button
            onClick={() => setActiveTab(ACHIEVEMENT_TABS.DATA_RANGE)}
            className={`flex-1 md:flex-none text-center md:text-left px-1 pb-2 border-b-2 -mb-px transition font-semibold whitespace-nowrap
              ${
                activeTab === ACHIEVEMENT_TABS.DATA_RANGE
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-[#7F7B92] hover:text-indigo-600'
              }`}
          >
            {ACHIEVEMENT_TABS.DATA_RANGE}
          </button>
        </div>
      </div>

      {activeTab === ACHIEVEMENT_TABS.DAILY && (
        <div className="flex items-center gap-2 mb-4 text-sm text-[#1B163A]">
          <img src={iconCalendarBlue} alt="calendar" className="w-5 h-5" />
          <span>
            {new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      )}

      {activeTab === ACHIEVEMENT_TABS.DATA_RANGE && (
        <div className="flex flex-row gap-3 md:gap-5 mb-6 w-full md:w-1/2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#1B163A] mb-2">From</p>
            <Calendar
              value={fromDate}
              onChange={setFromDate}
              label=""
              placeholder="Select date"
              dateFormat="dd MMM, yyyy"
              size="default"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#1B163A] mb-2">To</p>
            <Calendar
              value={toDate}
              onChange={setToDate}
              label=""
              placeholder="Select date"
              dateFormat="dd MMM, yyyy"
              size="default"
              minDate={fromDate ? new Date(fromDate) : undefined}
            />
          </div>
        </div>
      )}

      {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <AchievementCard
          icon={iconAchievementStar}
          label="Your patient satisfactions score"
          value={data?.averagePatientSatisfactionScore ?? 0}
          bgColor={'bg-[#E5FFF3]'}
          loading={loading}
        />
        <AchievementCard
          icon={iconAchievementClock}
          label="Daily average time spent by you"
          value={timeSpent}
          bgColor={'bg-[#EFE8FF]'}
        />
        <AchievementCard
          icon={iconAchievementVisitCompleted}
          label="Visits completed by you"
          value={data?.visitsEndedToday ?? 0}
          bgColor={'bg-[#FFEADE]'}
          loading={loading}
        />
        <AchievementCard
          icon={iconAchievementVisitAdded}
          label="Patients added by you"
          value={data?.patientsCreatedToday ?? 0}
          bgColor={'bg-[#FAF9FF]'}
          loading={loading}
        />
      </div>
    </div>
  );
};
