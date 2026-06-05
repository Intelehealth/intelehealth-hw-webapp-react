import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import type { AyuQuestion } from '../../../ayu-library/types/ayu.types';
import { resolveLabel } from '../../../ayu-library/utils/fhir-to-ayu.util';
import {
  ADDITIONAL_INFORMATION_LABEL,
  TEXT_INPUT_DEFAULT_KEYWORDS,
  TEXT_INPUT_DEFAULT_PLACEHOLDER,
  TEXT_INPUT_ENTER_PREFIX,
} from '../../utils/ayu.constants';

const isInlineDescribeField = (
  question?: AyuQuestion,
  parent?: AyuQuestion
): boolean => {
  if (question?.type !== 'string' || !parent?.item?.length) return false;
  const gateCode = question.enableWhen?.find(
    ew => ew.question === parent.linkId
  )?.answerCoding?.code;
  if (!gateCode) return false;
  const optionSiblings = parent.item.filter(sib =>
    sib.enableWhen?.some(
      ew => ew.question === parent.linkId && ew.answerCoding?.code === gateCode
    )
  );
  return optionSiblings.length === 1;
};

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
  const inputId = `ayu-input-${question?.linkId}`;
  const hideLabel = isInlineDescribeField(question, parent);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue);
  };

  const inputValue = value !== null && value !== undefined ? String(value) : '';

  return (
    <div className="flex flex-col gap-1">
      {!hideLabel && label && (
        <label
          htmlFor={inputId}
          className={
            label.includes(ADDITIONAL_INFORMATION_LABEL)
              ? 'text-md font-medium text-black-500'
              : 'block text-base text-(--color-muted)'
          }
        >
          {label}
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
