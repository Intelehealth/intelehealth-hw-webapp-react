import { showToast } from '../../../../services/toast';
import { resolveAyuComponent } from '../../../ayu-library/logic/decision-matrix';
import {
  getOptionLocationIdentity,
  getPainRadiatesConflictMessage,
  isPainRadiatesOptionDisabled,
} from '../../../ayu-library/logic/option-dependency.logic';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import type { AyuAnswerOption } from '../../../ayu-library/types/ayu.types';
import {
  SELECT_ANY_ONE,
  SELECT_ONE_OR_MORE,
} from '../../../ayu-library/utils/constants';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import {
  QUESTION_LABEL_CLASS_NESTED,
  QUESTION_LABEL_CLASS_TOP,
} from '../../utils/ayu.constants';
import { AyuSelectableOption } from './ayu-selectable-option.component';
import './selectable-option.css';
export function AyuSelectableOptionGroup({
  question,
  parent,
  previousSibling,
  value,
  onChange,
  disabledOptionIdentities,
}: AyuRendererBaseProps) {
  const label = question
    ? resolveLabel(question, parent, previousSibling)
    : undefined;

  const isAssociatedSymptomsParent = parent
    ? resolveAyuComponent(parent) === 'associatedSymptoms'
    : false;

  return (
    <div className="option-group-wrapper">
      <>
        {label && (
          <label
            className={
              isAssociatedSymptomsParent || parent
                ? QUESTION_LABEL_CLASS_NESTED
                : QUESTION_LABEL_CLASS_TOP
            }
          >
            {label}
            {/* {question?.required && (
              <span className="text-error-500 ml-1">*</span>
            )} */}
          </label>
        )}
        <div className="text-sm text-gray-500 -mt-1">
          {question?.repeats ? SELECT_ONE_OR_MORE : SELECT_ANY_ONE}
        </div>
      </>

      <div className="option-group mt-2">
        {question?.answerOption?.map((opt: AyuAnswerOption) => {
          const optionValue = opt?.valueCoding?.code || opt?.valueString || '';

          const isSelected = question?.repeats
            ? Array.isArray(value) && value.includes(optionValue)
            : value === optionValue;

          // A question's own current answer must stay deselectable even if
          // it also happens to be a disabled-elsewhere option. Compared by
          // display identity, not code: the same real-world location is
          // independently coded per question in this app's FHIR content.
          const isDisabled =
            !isSelected &&
            isPainRadiatesOptionDisabled(
              getOptionLocationIdentity(opt),
              disabledOptionIdentities
            );

          return (
            <AyuSelectableOption
              key={optionValue}
              label={opt?.valueString || opt?.valueCoding?.display}
              value={optionValue}
              selected={isSelected}
              disabled={isDisabled}
              onClick={() => {
                // AyuSelectableOption's disabled state is visual-only by
                // design (callers decide whether a click still applies) — a
                // disabled Pain-radiates-to/Question 1 option must not be
                // selectable, in either direction of this business rule.
                if (isDisabled) {
                  const message =
                    question && getPainRadiatesConflictMessage(question);
                  if (message) showToast(message, undefined, 'warning');
                  return;
                }
                onChange?.(
                  isSelected && !question?.repeats ? null : optionValue
                );
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
