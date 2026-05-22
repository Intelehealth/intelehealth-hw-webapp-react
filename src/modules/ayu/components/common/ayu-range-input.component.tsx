import type { CSSProperties } from 'react';
import { resolveLabel } from '../../../ayu-library';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import type { RangeAnswer } from '../../../ayu-library/types/ayu.types';
import {
  EXT_URL_MAX_VALUE,
  EXT_URL_MIN_VALUE,
} from '../../../ayu-library/utils/constants';
import {
  RANGE_DEFAULT_MAX,
  RANGE_DEFAULT_MIN,
  RANGE_HINT_TEMPLATE,
  RANGE_TO_LABEL,
} from '../../utils/ayu.constants';
import './ayu-range-input.css';

function readExtInteger(
  question: AyuRendererBaseProps['question'],
  url: string
): number | undefined {
  return question?.extension?.find(e => e.url === url)?.valueInteger;
}

function isRangeAnswer(value: unknown): value is RangeAnswer {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('low' in value || 'high' in value)
  );
}

export function AyuRangeInput({
  question,
  parent,
  value,
  onChange,
}: AyuRendererBaseProps) {
  const baseId = `ayu-range-${question?.linkId}`;

  const min = readExtInteger(question, EXT_URL_MIN_VALUE) ?? RANGE_DEFAULT_MIN;
  const max = readExtInteger(question, EXT_URL_MAX_VALUE) ?? RANGE_DEFAULT_MAX;

  const parsed: RangeAnswer = isRangeAnswer(value) ? value : {};
  const lowValue = typeof parsed.low === 'number' ? parsed.low : min;
  const highValue = typeof parsed.high === 'number' ? parsed.high : max;

  const isReadOnly = !!question?.readOnly;
  const span = max - min || 1;
  const lowPercent = ((lowValue - min) / span) * 100;
  const highPercent = ((highValue - min) / span) * 100;

  const emit = (next: RangeAnswer) => {
    if (isReadOnly) return;
    onChange?.(next);
  };

  const handleLowChange = (raw: number) => {
    const clampedLow = Math.min(raw, highValue);
    emit({ low: clampedLow, high: highValue });
  };

  const handleHighChange = (raw: number) => {
    const clampedHigh = Math.max(raw, lowValue);
    emit({ low: lowValue, high: clampedHigh });
  };

  const trackVars = {
    '--ayu-range-low': lowPercent,
    '--ayu-range-high': highPercent,
  } as CSSProperties;

  const label = question ? resolveLabel(question, question, question) : null;

  return (
    <div className="ayu-range-root">
      {label && (
        <label
          className={
            parent
              ? 'text-md font-medium text-black-500'
              : 'block text-base text-(--color-muted)'
          }
        >
          {label}
        </label>
      )}
      <span className="ayu-range-hint">
        {RANGE_HINT_TEMPLATE.replace('{min}', String(min)).replace(
          '{max}',
          String(max)
        )}
      </span>

      <div className="ayu-range-card">
        <div className="ayu-range-track-wrapper" style={trackVars}>
          <div className="ayu-range-track">
            <div className="ayu-range-track-filled" />
          </div>

          <input
            id={`${baseId}-low`}
            type="range"
            min={min}
            max={max}
            step={1}
            value={lowValue}
            onChange={e => handleLowChange(Number(e.target.value))}
            disabled={isReadOnly}
            className="ayu-range-input"
            aria-label="Lower bound"
          />
          <input
            id={`${baseId}-high`}
            type="range"
            min={min}
            max={max}
            step={1}
            value={highValue}
            onChange={e => handleHighChange(Number(e.target.value))}
            disabled={isReadOnly}
            className="ayu-range-input"
            aria-label="Upper bound"
          />

          <span className="ayu-range-bubble ayu-range-bubble--low">
            {lowValue}
          </span>
          <span className="ayu-range-bubble ayu-range-bubble--high">
            {highValue}
          </span>
        </div>
      </div>

      <span className="ayu-range-summary-pill">
        {lowValue} {RANGE_TO_LABEL} {highValue}
      </span>
    </div>
  );
}
