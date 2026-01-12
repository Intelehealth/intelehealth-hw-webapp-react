import { resolveLabel } from '../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../types/ayu-renderer-props.types';

export function AyuNumberInput({
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
      <input
        type="number"
        disabled={question.readOnly}
        className=" w-full
    border border-gray-300
    rounded px-3 py-2
    focus:outline-none
    focus:border-blue-500
    focus:ring-1
    focus:ring-blue-500
    disabled:bg-gray-100
    disabled:text-gray-400
    disabled:cursor-not-allowed"
      />
    </div>
  );
}
