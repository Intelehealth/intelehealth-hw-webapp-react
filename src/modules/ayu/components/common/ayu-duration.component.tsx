import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import { DURATION_DROPDOWN_CONFIGS } from '../../../ayu-library/utils/constants';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import {
  QUESTION_LABEL_CLASS_NESTED,
  QUESTION_LABEL_CLASS_TOP,
} from '../../utils/ayu.constants';
import { AyuDropdown } from './ayu-dropdown.component';

export function AyuDuration({
  question,
  value,
  parent,
  onChange,
}: AyuRendererBaseProps) {
  // Parse the value from parent (nested structure with dropdownValues)
  const parsedValue = (
    typeof value === 'object' && value !== null ? value : {}
  ) as {
    dropdownValues?: Record<string, string | number>;
  };
  const dropdownValues = parsedValue.dropdownValues || {};

  const handleDropdownChange = (
    dropdownId: string,
    newValue: string | number
  ) => {
    onChange?.({
      dropdownValues: {
        ...dropdownValues,
        [dropdownId]: newValue,
      },
    });
  };

  const label = question
    ? resolveLabel(question, question, question)
    : undefined;
  return (
    <div className="space-y-3">
      {label && (
        <label
          className={
            parent ? QUESTION_LABEL_CLASS_NESTED : QUESTION_LABEL_CLASS_TOP
          }
        >
          {label}
          {question?.required && !label.includes('*') && (
            <span className="text-error-500 ml-1">*</span>
          )}
        </label>
      )}
      {/* Duration Dropdowns */}
      {DURATION_DROPDOWN_CONFIGS && DURATION_DROPDOWN_CONFIGS.length > 0 && (
        <div className="flex gap-3 mt-2">
          {DURATION_DROPDOWN_CONFIGS.map(config => (
            <AyuDropdown
              key={config.id}
              options={config.options}
              value={dropdownValues[config.id] || ''}
              onChange={newValue => handleDropdownChange(config.id, newValue)}
              placeholder={config.placeholder}
              className="flex-1"
            />
          ))}
        </div>
      )}
    </div>
  );
}
