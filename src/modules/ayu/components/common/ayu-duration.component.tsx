import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import { DURATION_DROPDOWN_CONFIGS } from '../../../ayu-library/utils/constants';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import { AyuDropdown } from './ayu-dropdown.component';

export function AyuDuration({
  question,
  value,
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
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      {/* Duration Dropdowns */}
      {DURATION_DROPDOWN_CONFIGS && DURATION_DROPDOWN_CONFIGS.length > 0 && (
        <div className="flex gap-3">
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
