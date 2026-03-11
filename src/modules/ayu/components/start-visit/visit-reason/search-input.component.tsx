import searchIcon from '../../../assets/icon-search.svg';
import {
  VISIT_REASON_QUESTION,
  VISIT_REASON_HINT,
  SEARCH_PLACEHOLDER,
  NO_MATCHING_COMPLAINTS,
  MAX_FILTERED_RESULTS,
} from '../../../utils/ayu.constants';
interface Props {
  search: string;
  setSearch: (v: string) => void;
  filteredNames: string[];
  addReason: (reason: string) => void;
}
const highlightMatch = (text: string, query: string) => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');

  return text.split(regex).map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <strong key={index} className="text-black font-semibold">
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
};

export const ReasonSearchInput = ({
  search,
  setSearch,
  filteredNames,
  addReason,
}: Props) => {
  return (
    <div className="mt-2">
      {VISIT_REASON_QUESTION}
      <p className="text-sm text-gray-500">{VISIT_REASON_HINT}</p>
      <div className="mt-2 relative">
        {/* ICON */}
        {search.length === 0 && (
          <img
            src={searchIcon}
            alt="Search"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
          />
        )}

        {/* INPUT */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={SEARCH_PLACEHOLDER}
          className={`w-full border border-emerald-400 bg-white rounded-lg px-4 py-2 ${search.length > 0 ? 'pl-4' : 'pl-10'} focus:outline-none placeholder:text-gray-400`}
        />
      </div>
      {search && (
        <div
          className="border-b border-gray-200 bg-white rounded-xl max-h-[200px] overflow-y-auto hide-scroll"
          style={{ scrollbarWidth: 'none' }}
        >
          {filteredNames.length > 0 ? (
            filteredNames.slice(0, MAX_FILTERED_RESULTS).map(reason => (
              <div
                key={reason}
                onClick={() => addReason(reason)}
                className="px-4 py-2 cursor-pointer border-gray-200  text-gray-400 hover:bg-gray-100 border-b last:border-none"
              >
                {highlightMatch(reason, search)}
              </div>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-gray-400">
              {NO_MATCHING_COMPLAINTS}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
