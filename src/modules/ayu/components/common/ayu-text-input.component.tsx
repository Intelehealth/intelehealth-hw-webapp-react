import { resolveAyuComponent } from '../../../ayu-library/logic/decision-matrix';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';

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
            label === 'Additional Information'
              ? 'text-md font-medium text-black-500'
              : 'block text-base text-(--color-muted)'
          }
        >
          {isAssociatedSymptomsParent
            ? label === 'Additional Information' ||
              !label.toLowerCase().includes('other')
              ? label
              : null
            : label === 'Additional Information' ||
                !label.toLowerCase().includes('describe')
              ? label
              : null}
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
