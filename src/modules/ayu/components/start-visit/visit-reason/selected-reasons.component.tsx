import { SELECTED_REASONS_LABEL } from '../../../utils/ayu.constants';

interface Props {
  selectedReasons: string[];
  removeReason: (reason: string) => void;
}

export const SelectedReasons = ({ selectedReasons, removeReason }: Props) => {
  if (selectedReasons.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm text-gray-500">{SELECTED_REASONS_LABEL}</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {selectedReasons.map(reason => (
          <div
            key={reason}
            className="flex items-center gap-2 px-3 py-1 rounded-sm bg-[#2E1E91] text-white text-sm"
          >
            {reason}

            <button
              onClick={() => removeReason(reason)}
              className="font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
