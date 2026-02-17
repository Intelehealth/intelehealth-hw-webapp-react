import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../../types/ayu-renderer-props.types';

export function AyuNumberInput({
  question,
  parent,
  previousSibling,
  value,
  onChange,
}: AyuRendererBaseProps) {
  const label = question
    ? resolveLabel(question, parent, previousSibling)
    : undefined;
  const inputId = `ayu-number-${question?.linkId}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value ? parseFloat(e.target.value) : '';
    onChange?.(newValue as number);
  };

  const inputValue = value !== null && value !== undefined ? String(value) : '';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="number"
        value={inputValue}
        onChange={handleChange}
        disabled={question?.readOnly}
        className="border bg-white border-solid border-[#20c997] rounded px-3 py-2 outline-none resize-y"
      />
    </div>
  );
}
