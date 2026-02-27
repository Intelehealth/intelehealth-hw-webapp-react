import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../../types/ayu-renderer-props.types';
import type { AyuAnswerOption } from '../../types/ayu.types';
import { SELECT_ANY_ONE, SELECT_ONE_OR_MORE } from '../../utils/constants';
import { AyuSelectableOption } from './ayu-selectable-option.component';
import './selectable-option.css';
export function AyuSelectableOptionGroup({
  question,
  parent,
  previousSibling,
  value,
  onChange,
}: AyuRendererBaseProps) {
  const label = question
    ? resolveLabel(question, parent, previousSibling)
    : undefined;

  return (
    <div className="option-group-wrapper">
      <>
        {label && (
          <label className="text-md font-medium text-black-500">
            {label}
            {question?.required && (
              <span className="text-error-500 ml-1">*</span>
            )}
          </label>
        )}
        <div className="text-sm text-gray-500 -mt-3">
          {question?.repeats ? SELECT_ONE_OR_MORE : SELECT_ANY_ONE}
        </div>
      </>

      <div className="option-group mt-2">
        {question?.answerOption?.map((opt: AyuAnswerOption) => {
          const optionValue = opt?.valueCoding?.code || opt?.valueString || '';

          const isSelected = question?.repeats
            ? Array.isArray(value) && value.includes(optionValue)
            : value === optionValue;

          return (
            <AyuSelectableOption
              key={optionValue}
              label={opt?.valueString || opt?.valueCoding?.display}
              value={optionValue}
              selected={isSelected}
              onClick={() => onChange?.(optionValue)}
            />
          );
        })}
      </div>
    </div>
  );
}
