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

const REQUIRED_ERROR = 'This field is required';

/*
 * Handles both number (the normal case for this component) and string (a
 * numeric value can still arrive as a string from a restored/prefilled
 * answer set) — only null/undefined/NaN/other types collapse to empty.
 */
const toDisplay = (value: AyuRendererBaseProps['value']): string => {
  if (typeof value === 'number')
    return Number.isNaN(value) ? '' : String(value);
  if (typeof value === 'string') return value;
  return '';
};

export function AyuNumberInput({
  question,
  parent,
  value,
  onChange,
}: AyuRendererBaseProps) {
  const inputId = `ayu-number-${question?.linkId}`;
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);

  const [displayValue, setDisplayValue] = useState(toDisplay(value));

  /*
   * Resync the displayed text from the external `value` only while the field
   * is NOT focused. `onChange` round-trips through the parent's answers
   * state on every keystroke, so syncing unconditionally wiped whatever the
   * user was mid-typing whenever the round-tripped value didn't stringify
   * back to the same text (most sharply when out-of-range input used to be
   * reported as NaN, which collapses to '').
   */
  useEffect(() => {
    if (focused) return;
    setDisplayValue(toDisplay(value));
  }, [value, focused]);

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
    const raw = e.target.value;
    setDisplayValue(raw);

    if (!raw) {
      setError(touched && question?.required ? REQUIRED_ERROR : null);
      onChange?.(undefined);
      return;
    }
    setTouched(true);
    const parsed = parseFloat(raw);

    if (isNaN(parsed)) {
      const msg = 'Please enter a valid number';
      setError(msg);
      showToast('Invalid input', msg, 'error', { toastId: `${inputId}-nan` });
      onChange?.(undefined);
      return;
    }

    /*
     * Out-of-range: report the real parsed number, not a sentinel. Storing
     * the actual value lets validateQuestion's existing numericOutOfRange
     * check reject it with the specific range message at Submit — reporting
     * NaN instead both broke that message (NaN can't be out of range) and
     * made "cleared" and "out of range" indistinguishable downstream.
     */
    if (parsed < min) {
      const msg = `Value must be at least ${min}`;
      setError(msg);
      showToast('Invalid input', msg, 'warning', { toastId: `${inputId}-min` });
      onChange?.(parsed);
      return;
    }

    if (max !== undefined && parsed > max) {
      const msg = `Value must be at most ${max}`;
      setError(msg);
      showToast('Invalid input', msg, 'warning', { toastId: `${inputId}-max` });
      onChange?.(parsed);
      return;
    }

    setError(null);
    onChange?.(parsed);
  };

  const handleFocus = () => setFocused(true);

  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
    /*
     * Read displayValue (local, always current), not the value prop — the
     * prop only updates after the parent processes this render's onChange,
     * so checking it here read a stale value from before this keystroke.
     */
    if (question?.required && !displayValue.trim()) {
      setError(REQUIRED_ERROR);
    }
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
        onFocus={handleFocus}
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
