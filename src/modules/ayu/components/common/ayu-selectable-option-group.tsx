import { useState } from 'react';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import type { AyuRendererBaseProps } from '../../types/ayu-renderer-props.types';
import { AyuSelectableOption } from './ayu-selectable-option.component';
import './selectable-option.css';

export function AyuSelectableOptionGroup({
  question,
  parent,
  previousSibling,
}: AyuRendererBaseProps) {
  const label = resolveLabel(question, parent, previousSibling);
  const [selectedValue] = useState<string | undefined>(undefined);

  // const handleSelect = (val: string) => {
  //   setSelectedValue(val);
  // };
  return (
    <div className="option-group-wrapper">
      {label && (
        <label className="text-md font-medium text-black-500">
          {label}
          {question.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="option-group">
        {question?.answerOption?.map(opt => (
          <AyuSelectableOption
            key={opt.valueString || opt.valueCoding?.code}
            label={opt.valueString || opt.valueCoding?.display}
            value={opt.valueString}
            selected={selectedValue === opt.valueString}
          />
        ))}
      </div>
    </div>
  );
}
