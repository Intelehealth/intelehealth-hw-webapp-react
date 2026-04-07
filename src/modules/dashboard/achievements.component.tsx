import iconAchievement from '../../assets/icons/icon-achievements.svg';
import iconInfo from '../../assets/icons/icon-ache-info-dashboard.svg';
import {
  achievementsData,
  type AchievementItem,
} from '../../assets/data/achievements.data';

const AchievementCard = ({ item }: { item: AchievementItem }) => (
  <div className="rounded-lg bg-white border border-gray-100 px-4 py-4 shadow-sm">
    {/* Top row: icon left, info icon right */}
    <div className="flex items-start justify-between">
      <img src={item.icon} alt={item.label} className=" object-contain" />
      <img
        src={iconInfo}
        alt="info"
        className="object-contain cursor-pointer"
        title={item.label}
      />
    </div>
    {/* Bottom row: label left, value right */}
    <div className="flex items-end justify-between mt-3">
      <span className="text-xs font-normal leading-none text-black">
        {item.label}
      </span>
      <span
        className={`text-lg font-bold ${item.valueColor ?? 'text-gray-800'}`}
      >
        {item.value}
      </span>
    </div>
  </div>
);

export const AchievementsComponent = () => {
  return (
    <div className="hidden lg:flex flex-col w-[410px] shrink-0 rounded-xl bg-white p-4 shadow-sm border border-gray-100 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 mb-1 border-b border-gray-200">
        <img
          src={iconAchievement}
          alt="achievements"
          className="w-9 h-9 object-contain"
        />
        <span className="text-lg font-semibold text-(--color-dark)">
          Achievements
        </span>
      </div>

      {/* Achievement Cards */}
      <div className="flex flex-col gap-2 mt-3">
        {achievementsData.map(item => (
          <AchievementCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
