import { resolveAyuComponent } from '../../../ayu-library/logic/decision-matrix';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import {
  ADDITIONAL_INFORMATION_LABEL,
  TEXT_INPUT_DEFAULT_KEYWORDS,
  TEXT_INPUT_DEFAULT_PLACEHOLDER,
  TEXT_INPUT_ENTER_PREFIX,
  TEXT_INPUT_KEYWORD_DESCRIBE,
  TEXT_INPUT_KEYWORD_OTHER,
} from '../../utils/ayu.constants';

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
  const isAssociatedSymptomsParent = parent
    ? resolveAyuComponent(parent) === 'associatedSymptoms'
    : false;
  const inputId = `ayu-input-${question?.linkId}`;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
  };

  const inputValue = value !== null && value !== undefined ? String(value) : '';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className={
            label === ADDITIONAL_INFORMATION_LABEL
              ? 'text-md font-medium text-black-500'
              : 'block text-base text-(--color-muted)'
          }
        >
          {isAssociatedSymptomsParent
            ? label === ADDITIONAL_INFORMATION_LABEL ||
              !label.toLowerCase().includes(TEXT_INPUT_KEYWORD_OTHER)
              ? label
              : null
            : label === ADDITIONAL_INFORMATION_LABEL ||
                !label.toLowerCase().includes(TEXT_INPUT_KEYWORD_DESCRIBE)
              ? label
              : null}
        </label>
      )}
      <textarea
        id={inputId}
        value={inputValue}
        onChange={handleChange}
        disabled={question?.readOnly}
        placeholder={
          question?.text &&
          !TEXT_INPUT_DEFAULT_KEYWORDS.some(kw =>
            question.text!.toLowerCase().includes(kw)
          )
            ? question.text
                .toLowerCase()
                .startsWith(TEXT_INPUT_ENTER_PREFIX.toLowerCase())
              ? question.text.toLowerCase()
              : `${TEXT_INPUT_ENTER_PREFIX} ${question.text.toLowerCase()}`
            : TEXT_INPUT_DEFAULT_PLACEHOLDER
        }
        rows={2}
        className="border bg-white border-solid border-[#20c997] rounded-md px-3 py-2 outline-none resize-y"
      />
    </div>
  );
}
