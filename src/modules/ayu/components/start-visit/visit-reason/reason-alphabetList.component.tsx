interface Props {
  grouped: Record<string, string[]>;
  selectedReasons: string[];
  addReason: (reason: string) => void;
}

export const ReasonAlphabetList = ({
  grouped,
  selectedReasons,
  addReason,
}: Props) => {
  return (
    <div
      className="rounded-sm p-3 h-[350px] overflow-y-auto hide-scroll"
      style={{ scrollbarWidth: 'none' }}
    >
      {Object.keys(grouped)
        .sort()
        .map(letter => (
          <div key={letter} className="mb-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-semibold text-[#B0ADBE]">
                {letter}
              </span>
              <div className="flex-1 border-b-2 border-[#EFE8FF]" />
            </div>

            <div className="flex flex-wrap gap-2">
              {grouped[letter].map(reason => (
                <button
                  key={reason}
                  onClick={() => addReason(reason)}
                  className={`px-3 py-1 rounded-sm border border-gray-200  text-sm transition
                    ${
                      selectedReasons.includes(reason)
                        ? 'bg-[#2E1E91] text-white border-[#2E1E91]'
                        : 'hover:bg-[#2E1E91] hover:text-white'
                    }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};
