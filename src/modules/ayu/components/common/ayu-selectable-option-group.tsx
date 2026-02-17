import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../../types/ayu-renderer-props.types';
import type { AyuAnswerOption } from '../../types/ayu.types';
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
      {label && (
        <label className="text-md font-medium text-black-500">
          {label}
          {question?.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="option-group">
        {question?.answerOption?.map((opt: AyuAnswerOption) => (
          <AyuSelectableOption
            //  rightIcon={<img src={lefticon} alt="" />}
            key={opt.valueString || opt.valueCoding?.code}
            label={opt?.valueString || opt?.valueCoding?.display}
            value={opt?.valueString}
            selected={value === (opt?.valueCoding?.code || opt?.valueString)}
            onClick={() => onChange?.(opt.valueCoding?.code)}
          />
        ))}
      </div>
    </div>
  );
}
