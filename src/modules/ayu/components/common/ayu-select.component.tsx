import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../../types/ayu-renderer-props.types';

export function AyuSelect({
  question,
  parent,
  previousSibling,
}: AyuRendererBaseProps) {
  const label = resolveLabel(question, parent, previousSibling);
  const selectId = `ayu-select-${question?.linkId}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className="bg-white border border-emerald-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-0 focus:border-emerald-400 appearance-none"
      >
        {question?.answerOption?.map((opt, i) => (
          <option key={i} value={opt.valueString}>
            {opt?.valueString || opt?.valueCoding?.display}
          </option>
        ))}
      </select>
    </div>
  );
}
