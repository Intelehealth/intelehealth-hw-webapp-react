interface Props {
  addReason: (reason: string) => void;
}

export const ReasonCategoryList = ({ addReason }: Props) => {
  return (
    <>
      <h3 className="text-sm text-gray-500 mb-2">Recently searched</h3>
      <div className="flex flex-wrap gap-2 mb-5">
        {['Headache', 'Fever', 'Diarrhea'].map(item => (
          <button
            key={item}
            onClick={() => addReason(item)}
            className="px-3 py-1 rounded-sm border border-gray-200 text-sm hover:bg-[#2E1E91] hover:text-white"
          >
            {item}
          </button>
        ))}
      </div>

      <h3 className="text-sm text-gray-500 mb-2">Most common reasons</h3>
      <div className="flex flex-wrap gap-2 mb-5">
        {['Dizziness', 'Leg pain', 'Cough'].map(item => (
          <button
            key={item}
            onClick={() => addReason(item)}
            className="px-3 py-1 rounded-sm border border-gray-200 text-sm hover:bg-[#2E1E91] hover:text-white"
          >
            {item}
          </button>
        ))}
      </div>

      <h3 className="text-sm font-medium text-gray-500 mb-2">All reasons</h3>
    </>
  );
};
