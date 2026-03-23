import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';

export function AyuNumberInput({
  question,
  value,
  onChange,
}: AyuRendererBaseProps) {
  const inputId = `ayu-number-${question?.linkId}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value ? parseFloat(e.target.value) : '';
    onChange?.(newValue as number);
  };

  const label = question
    ? resolveLabel(question, question, question)
    : undefined;
  const inputValue = value !== null && value !== undefined ? String(value) : '';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
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
