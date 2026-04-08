import iconAchievement from '../../assets/icons/icon-achievements.svg';
import iconInfo from '../../assets/icons/icon-ache-info-dashboard.svg';
import {
  achievementsData,
  type AchievementItem,
} from '../../assets/data/achievements.data';

const AchievementCard = ({ item }: { item: AchievementItem }) => (
  <div className="flex flex-col justify-between flex-1 w-full rounded-md border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
    {/* Top row: icon left, info icon right */}
    <div className="flex items-start justify-between">
      <img src={item.icon} alt={item.label} className="object-contain" />
      <img
        src={iconInfo}
        alt="info"
        className="object-contain cursor-pointer"
        title={item.label}
      />
    </div>
    {/* Bottom row: label left, value right */}
    <div className="flex items-end justify-between">
      <span className="text-xs font-normal leading-normal text-black">
        {item.label}
      </span>
      <span
        className={`text-sm font-bold ${item.valueColor ?? 'text-gray-800'}`}
      >
        {item.value}
      </span>
    </div>
  </div>
);

export const AchievementsComponent = () => {
  return (
    <div className="hidden lg:flex flex-col flex-1 rounded-xl bg-white px-2.5 py-2.5 shadow-sm border border-gray-100">
      {/* Header */}
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

      {/* Achievement Cards */}
      <div className="flex flex-col flex-1 gap-2 mt-2">
        {achievementsData.map(item => (
          <AchievementCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
