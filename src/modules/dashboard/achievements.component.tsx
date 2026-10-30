import { useMemo } from 'react';
import {
  achievementsData,
  type AchievementItem,
  type AchievementKey,
} from '../../assets/data/achievements.data';
import iconInfo from '../../assets/icons/icon-ache-info-dashboard.svg';
import iconAchievement from '../../assets/icons/icon-achievements.svg';
import { useAchievementSummary } from '../daily-time-tracking/hooks/useAchievementSummary';
import { useUnsentActivitySeconds } from '../daily-time-tracking/hooks/useUnsentActivitySeconds';
import type { AchievementSummary } from '../daily-time-tracking/types/achievement-summary.types';
import {
  istDate,
  loadServerSeconds,
  readUserId,
} from '../daily-time-tracking/utils/activity-buffer';
import { storage } from '../../utils/storage';
import {
  LOADING_VALUE,
  NO_VALUE,
  formatCount,
  formatDuration,
} from '../daily-time-tracking/utils/achievement-format';

const DEFAULT_VALUE_COLOR = 'text-gray-800';

// The panel is part of the page that counts the working time, so the person is active from the first
// second until they leave. The status does not wait for the portal and never shows a placeholder.
const STATUS_ACTIVE = 'Active';

// unsent is working time still waiting in the browser: the server does not have it yet.
const formatValue = (
  key: Exclude<AchievementKey, 'status'>,
  summary: AchievementSummary,
  unsent: number
) => {
  switch (key) {
    case 'dailyTimeSpentSeconds':
      return formatDuration(
        summary.dailyTimeSpentSeconds === null
          ? null
          : summary.dailyTimeSpentSeconds + unsent
      );
    default:
      return formatCount(summary[key]);
  }
};

const colorFor = (item: AchievementItem, value: string) => {
  // A placeholder or a missing value is never coloured like a real result.
  if (value === NO_VALUE || value === LOADING_VALUE) return DEFAULT_VALUE_COLOR;
  return item.valueColor ?? DEFAULT_VALUE_COLOR;
};

const AchievementCard = ({
  item,
  value,
}: {
  item: AchievementItem;
  value: string;
}) => (
  <div className="flex flex-col justify-between flex-1 w-full rounded-md border border-gray-100 bg-white px-3.5 py-3 shadow-sm min-h-[72px]">
    <div className="flex items-start justify-between">
      <img src={item.icon} alt={item.label} className="object-contain" />
      <img
        src={iconInfo}
        alt="info"
        className="object-contain cursor-pointer"
        title={item.label}
      />
    </div>

    <div className="flex items-end justify-between">
      <span className="text-xs font-normal leading-normal text-black">
        {item.label}
      </span>
      <span className={`text-sm font-bold ${colorFor(item, value)}`}>
        {value}
      </span>
    </div>
  </div>
);

export const AchievementsComponent = () => {
  const { data, loading } = useAchievementSummary();
  // After a reload the summary takes a moment: until it arrives, the time shown is the
  // total the server last gave for today (kept in the browser) plus what is waiting.
  const today = useMemo(() => istDate(Date.now()), []);
  const remembered = useMemo(() => {
    const userId = readUserId(storage.getUser());
    return userId ? loadServerSeconds(userId, today) : null;
  }, [today]);
  const unsent = useUnsentActivitySeconds(
    data?.from ?? today,
    data?.to ?? today,
    data ? data.dailyTimeSpentSeconds : remembered
  );

  const valueFor = (item: AchievementItem) => {
    if (item.key === 'status') return STATUS_ACTIVE;
    if (data) return formatValue(item.key, data, unsent);
    if (item.key === 'dailyTimeSpentSeconds' && remembered !== null)
      return formatDuration(remembered + unsent);
    return loading ? LOADING_VALUE : NO_VALUE;
  };

  return (
    <div className="hidden lg:flex flex-col lg:w-[280px] lg:shrink-0 min-h-0 rounded-xl bg-white px-2.5 py-2.5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <img
          src={iconAchievement}
          alt="achievements"
          className="object-contain"
        />
        <span className="text-sm font-semibold text-(--color-dark)">
          Achievements
        </span>
      </div>

      <div
        className="flex flex-col flex-1 min-h-0 gap-2 mt-2 overflow-y-auto"
        aria-busy={loading && !data}
      >
        {achievementsData.map(item => (
          <AchievementCard key={item.id} item={item} value={valueFor(item)} />
        ))}
      </div>
    </div>
  );
};
