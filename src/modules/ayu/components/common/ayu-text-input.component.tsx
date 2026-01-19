import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../../types/ayu-renderer-props.types';

export function AyuTextInput({
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
        type="text"
        disabled={question.readOnly}
        className="border rounded px-3 py-2"
      />
    </div>
  );
}
