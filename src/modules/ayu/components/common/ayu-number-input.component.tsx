import { useEffect, useState } from 'react';
import { showToast } from '../../../../services/toast';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import {
  EXT_URL_MAX_VALUE,
  EXT_URL_MIN_VALUE,
  getBPRangeFromText,
} from '../../../ayu-library/utils/constants';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import {
  NUMBER_INPUT_DEFAULT_MIN,
  QUESTION_LABEL_CLASS_NESTED,
  QUESTION_LABEL_CLASS_TOP,
} from '../../utils/ayu.constants';

export function AyuNumberInput({
  question,
  parent,
  value,
  onChange,
}: AyuRendererBaseProps) {
  const inputId = `ayu-number-${question?.linkId}`;
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const [displayValue, setDisplayValue] = useState(
    value !== null && value !== undefined && !Number.isNaN(value)
      ? String(value)
      : ''
  );

  useEffect(() => {
    const external =
      value !== null && value !== undefined && !Number.isNaN(value)
        ? String(value)
        : '';
    setDisplayValue(external);
    if (!external) setError(null);
  }, [value]);

  const bpRange = getBPRangeFromText(question?.text);
  const extMin = question?.extension?.find(
    e => e.url === EXT_URL_MIN_VALUE
  )?.valueInteger;
  const extMax = question?.extension?.find(
    e => e.url === EXT_URL_MAX_VALUE
  )?.valueInteger;
  const min = extMin ?? bpRange?.min ?? NUMBER_INPUT_DEFAULT_MIN;
  const max = extMax ?? bpRange?.max;

  const REQUIRED_ERROR = 'This field is required';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    if (!raw) {
      setError(touched && question?.required ? REQUIRED_ERROR : null);
      onChange?.(NaN);
      return;
    }
    setTouched(true);
    const parsed = parseFloat(raw);

    if (isNaN(parsed)) {
      const msg = 'Please enter a valid number';
      setError(msg);
      showToast('Invalid input', msg, 'error', { toastId: `${inputId}-nan` });
      onChange?.(NaN);
      return;
    }

    if (parsed < min) {
      const msg = `Value must be at least ${min}`;
      setError(msg);
      showToast('Invalid input', msg, 'warning', { toastId: `${inputId}-min` });
      onChange?.(NaN);
      return;
    }

    if (max !== undefined && parsed > max) {
      const msg = `Value must be at most ${max}`;
      setError(msg);
      showToast('Invalid input', msg, 'warning', { toastId: `${inputId}-max` });
      onChange?.(NaN);
      return;
    }

    setError(null);
    onChange?.(parsed);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setTouched(true);
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (typeof value === 'string' && !value.trim());
      if (question?.required && isEmpty) {
        setError(REQUIRED_ERROR);
      }
    }, 6000);
  };

  const label = question
    ? resolveLabel(question, question, question)
    : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          className={
            parent ? QUESTION_LABEL_CLASS_NESTED : QUESTION_LABEL_CLASS_TOP
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
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
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
