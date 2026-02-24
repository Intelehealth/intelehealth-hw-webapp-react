import type { AyuRendererBaseProps } from '../../types/ayu-renderer-props.types';

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

  const inputValue = value !== null && value !== undefined ? String(value) : '';

  return (
    <div className="flex flex-col gap-1">
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
