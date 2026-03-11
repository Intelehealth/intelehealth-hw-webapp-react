import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import type { AyuAnswerOption } from '../../../ayu-library/types/ayu.types';

export function AyuMultiSelect({
  question,
  parent,
  previousSibling,
}: AyuRendererBaseProps) {
  const label = question
    ? resolveLabel(question, parent, previousSibling)
    : undefined;
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      {question?.answerOption?.map((opt: AyuAnswerOption, i: number) => (
        <label key={i} className="flex gap-2">
          <input type="checkbox" />
          {opt?.valueString || opt?.valueCoding?.display}
        </label>
      ))}
    </div>
  );
}
