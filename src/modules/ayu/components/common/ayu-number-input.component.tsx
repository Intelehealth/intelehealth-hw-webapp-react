import { useState } from 'react';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import {
  EXT_URL_MAX_VALUE,
  EXT_URL_MIN_VALUE,
  getBPRangeFromText,
} from '../../../ayu-library/utils/constants';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import { NUMBER_INPUT_DEFAULT_MIN } from '../../utils/ayu.constants';

export function AyuNumberInput({
  question,
  parent,
  value,
  onChange,
}: AyuRendererBaseProps) {
  const inputId = `ayu-number-${question?.linkId}`;
  const [error, setError] = useState<string | null>(null);

  const bpRange = getBPRangeFromText(question?.text);
  const extMin = question?.extension?.find(
    e => e.url === EXT_URL_MIN_VALUE
  )?.valueInteger;
  const extMax = question?.extension?.find(
    e => e.url === EXT_URL_MAX_VALUE
  )?.valueInteger;
  const min = extMin ?? bpRange?.min ?? NUMBER_INPUT_DEFAULT_MIN;
  const max = extMax ?? bpRange?.max;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      setError(null);
      onChange?.('' as unknown as number);
      return;
    }
    const parsed = parseFloat(e.target.value);

    if (parsed < min) {
      setError(`Value must be at least ${min}`);
    } else if (max !== undefined && parsed > max) {
      setError(`Value must be at most ${max}`);
    } else {
      setError(null);
    }

    onChange?.(parsed);
  };

  const label = question
    ? resolveLabel(question, question, question)
    : undefined;
  const inputValue = value !== null && value !== undefined ? String(value) : '';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          className={
            parent
              ? 'block text-base text-(--color-muted)'
              : 'text-md font-medium text-black-500'
          }
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="number"
        min={min}
        {...(max !== undefined && { max })}
        value={inputValue}
        onChange={handleChange}
        onWheel={e => (e.target as HTMLInputElement).blur()}
        disabled={question?.readOnly}
        className={`border bg-white border-solid rounded px-3 py-2 outline-none resize-y ${
          error ? 'border-red-500' : 'border-[#20c997]'
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
