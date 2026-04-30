import type { CSSProperties } from 'react';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import {
  EXT_URL_MAX_VALUE,
  EXT_URL_MIN_VALUE,
} from '../../../ayu-library/utils/constants';
import {
  FREQUENCY_DEFAULT_MAX,
  FREQUENCY_DEFAULT_MIN,
  FREQUENCY_FACE_EYE_VARIANTS,
  FREQUENCY_FACE_MOUTH_PATHS,
  FREQUENCY_HINT_TEMPLATE,
  FREQUENCY_LEVEL_LABEL,
} from '../../utils/ayu.constants';
import './ayu-frequency-input.css';

function readExtInteger(
  question: AyuRendererBaseProps['question'],
  url: string
): number | undefined {
  return question?.extension?.find(e => e.url === url)?.valueInteger;
}

function FaceIcon({ level }: { level: number }) {
  const idx = Math.max(
    0,
    Math.min(level, FREQUENCY_FACE_MOUTH_PATHS.length - 1)
  );
  const eye = FREQUENCY_FACE_EYE_VARIANTS[idx];

  return (
    <svg
      viewBox="0 0 22 22"
      className="ayu-frequency-face-icon"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="9.5" />
      {eye === 'normal' && (
        <>
          <circle cx="7.8" cy="9" r="1" fill="currentColor" stroke="none" />
          <circle cx="14.2" cy="9" r="1" fill="currentColor" stroke="none" />
        </>
      )}
      {eye === 'closed' && (
        <>
          <path d="M6.3 9.4 Q7.8 7.9 9.3 9.4" />
          <path d="M12.7 9.4 Q14.2 7.9 15.7 9.4" />
        </>
      )}
      {eye === 'cross' && (
        <>
          <path d="M6.5 8 L9 10.5 M9 8 L6.5 10.5" />
          <path d="M13 8 L15.5 10.5 M15.5 8 L13 10.5" />
        </>
      )}
      <path d={FREQUENCY_FACE_MOUTH_PATHS[idx]} />
    </svg>
  );
}

export function AyuFrequencyInput({
  question,
  value,
  onChange,
}: AyuRendererBaseProps) {
  const inputId = `ayu-frequency-${question?.linkId}`;

  const min =
    readExtInteger(question, EXT_URL_MIN_VALUE) ?? FREQUENCY_DEFAULT_MIN;
  const max =
    readExtInteger(question, EXT_URL_MAX_VALUE) ?? FREQUENCY_DEFAULT_MAX;
  /*
   * Visible labels start at 1 even when the FHIR minValue is 0 (matches the
   * design); 0 represents the unselected state.
   */
  const start = min === 0 ? 1 : min;

  const levels: number[] = [];
  for (let i = start; i <= max; i++) levels.push(i);

  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value !== ''
        ? Number(value)
        : undefined;

  const isReadOnly = !!question?.readOnly;
  const sliderValue = numericValue ?? start;
  const range = max - start || 1;
  const percent = ((sliderValue - start) / range) * 100;

  const setLevel = (lvl: number) => {
    if (isReadOnly) return;
    onChange?.(lvl);
  };

  const rowStyle = {
    '--ayu-frequency-levels': levels.length,
  } as CSSProperties;

  const sliderStyle = {
    '--ayu-frequency-percent': percent,
  } as CSSProperties;

  return (
    <div className="ayu-frequency-root">
      <span className="ayu-frequency-hint">
        {FREQUENCY_HINT_TEMPLATE.replace('{min}', String(min)).replace(
          '{max}',
          String(max)
        )}
      </span>

      <div className="ayu-frequency-card">
        <div className="ayu-frequency-row" style={rowStyle}>
          {levels.map(lvl => (
            <button
              key={`n-${lvl}`}
              type="button"
              onClick={() => setLevel(lvl)}
              disabled={isReadOnly}
              className={
                numericValue === lvl
                  ? 'ayu-frequency-cell ayu-frequency-number ayu-frequency-number--selected'
                  : 'ayu-frequency-cell ayu-frequency-number'
              }
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="ayu-frequency-slider-wrapper">
          <input
            id={inputId}
            type="range"
            min={start}
            max={max}
            step={1}
            value={sliderValue}
            onChange={e => setLevel(Number(e.target.value))}
            disabled={isReadOnly}
            className="ayu-frequency-slider"
            style={sliderStyle}
          />
        </div>

        <div className="ayu-frequency-row" style={rowStyle}>
          {levels.map((lvl, idx) => (
            <button
              key={`f-${lvl}`}
              type="button"
              onClick={() => setLevel(lvl)}
              disabled={isReadOnly}
              aria-label={`Level ${lvl}`}
              className={
                numericValue === lvl
                  ? 'ayu-frequency-cell ayu-frequency-face ayu-frequency-face--selected'
                  : 'ayu-frequency-cell ayu-frequency-face'
              }
            >
              <FaceIcon level={idx} />
            </button>
          ))}
        </div>
      </div>

      {numericValue && (
        <span className="ayu-frequency-level-pill">
          {FREQUENCY_LEVEL_LABEL} {numericValue}
        </span>
      )}
    </div>
  );
}
