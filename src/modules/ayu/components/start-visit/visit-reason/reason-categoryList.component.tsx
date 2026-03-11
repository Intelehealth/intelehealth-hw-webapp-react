import {
  RECENTLY_SEARCHED_LABEL,
  MOST_COMMON_REASONS_LABEL,
  ALL_REASONS_LABEL,
  RECENTLY_SEARCHED_ITEMS,
  MOST_COMMON_REASONS_ITEMS,
} from '../../../utils/ayu.constants';

interface Props {
  addReason: (reason: string) => void;
}

export const ReasonCategoryList = ({ addReason }: Props) => {
  return (
    <>
      <h3 className="text-sm text-gray-500 mb-2">{RECENTLY_SEARCHED_LABEL}</h3>
      <div className="flex flex-wrap gap-2 mb-5">
        {RECENTLY_SEARCHED_ITEMS.map(item => (
          <button
            key={item}
            onClick={() => addReason(item)}
            className="px-3 py-1 rounded-sm border border-gray-200 text-sm hover:bg-[#2E1E91] hover:text-white"
          >
            {item}
          </button>
        ))}
      </div>

      <h3 className="text-sm text-gray-500 mb-2">
        {MOST_COMMON_REASONS_LABEL}
      </h3>
      <div className="flex flex-wrap gap-2 mb-5">
        {MOST_COMMON_REASONS_ITEMS.map(item => (
          <button
            key={item}
            onClick={() => addReason(item)}
            className="px-3 py-1 rounded-sm border border-gray-200 text-sm hover:bg-[#2E1E91] hover:text-white"
          >
            {item}
          </button>
        ))}
      </div>

      <h3 className="text-sm font-medium text-gray-500 mb-2">
        {ALL_REASONS_LABEL}
      </h3>
    </>
  );
};
