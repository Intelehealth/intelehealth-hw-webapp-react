import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../../types/ayu-renderer-props.types';

export function AyuSelect({
  question,
  parent,
  previousSibling,
}: AyuRendererBaseProps) {
  const label = resolveLabel(question, parent, previousSibling);
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <select className="w-full border rounded px-3 py-2">
        {question.answerOption?.map((opt, i) => (
          <option key={i} value={opt.valueString}>
            {opt.valueString || opt.valueCoding?.display}
          </option>
        ))}
      </select>
    </div>
  );
}
