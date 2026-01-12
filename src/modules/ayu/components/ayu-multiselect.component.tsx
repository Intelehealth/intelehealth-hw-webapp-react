import { resolveLabel } from '../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../types/ayu-renderer-props.types';
export function AyuMultiSelect({
  question,
  parent,
  previousSibling,
}: AyuRendererBaseProps) {
  const label = resolveLabel(question, parent, previousSibling);
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      {question.answerOption?.map((opt, i) => (
        <label key={i} className="flex gap-2">
          <input type="checkbox" />
          {opt.valueString || opt.valueCoding?.display}
        </label>
      ))}
    </div>
  );
}
