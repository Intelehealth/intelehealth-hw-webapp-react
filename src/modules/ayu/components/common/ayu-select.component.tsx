import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import type { AyuAnswerOption } from '../../../ayu-library/types/ayu.types';

export function AyuSelect({
  question,
  parent,
  previousSibling,
}: AyuRendererBaseProps) {
  const label = question
    ? resolveLabel(question, parent, previousSibling)
    : undefined;
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
        {question?.answerOption?.map((opt: AyuAnswerOption, i: number) => (
          <option key={i} value={opt.valueString}>
            {opt?.valueString || opt?.valueCoding?.display}
          </option>
        ))}
      </select>
    </div>
  );
}
