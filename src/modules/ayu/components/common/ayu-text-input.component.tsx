import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';

export function AyuTextInput({
  question,
  parent,
  previousSibling,
  value,
  onChange,
}: AyuRendererBaseProps) {
  const label = question
    ? resolveLabel(question, parent, previousSibling)
    : undefined;
  const inputId = `ayu-input-${question?.linkId}`;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
  };

  const inputValue = value !== null && value !== undefined ? String(value) : '';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-md font-medium text-black-500">
          {label === 'Additional information' ? label : null}
        </label>
      )}
      <textarea
        id={inputId}
        value={inputValue}
        onChange={handleChange}
        disabled={question?.readOnly}
        placeholder="Describe..."
        rows={2}
        className="border bg-white border-solid border-[#20c997] rounded-md px-3 py-2 outline-none resize-y"
      />
    </div>
  );
}
