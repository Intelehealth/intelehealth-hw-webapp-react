import type { AyuAnswerValue, AyuQuestion } from '../../../types/ayu.types';
import { SELECT_ANY_ONE, SELECT_ONE_OR_MORE } from '../../../utils/constants';
import { AyuRenderer } from './ayu-renderer.component';

interface NestedProps {
  items?: AyuQuestion[];
  parentQuestion?: AyuQuestion;
  answers: Record<string, AyuAnswerValue>;
  setAnswer: (question: AyuQuestion, value: AyuAnswerValue) => void;
}

export const AyuNestedRenderer = ({
  items,
  parentQuestion,
  answers,
  setAnswer,
}: NestedProps) => {
  if (!items?.length) return null;

  const isEnabled = (item: AyuQuestion) => {
    if (!item.enableWhen) return true;

    return item.enableWhen.every(rule => {
      const expected =
        rule.answerBoolean ??
        rule.answerString ??
        rule.answerInteger ??
        rule.answerCoding?.code;

      const parentAnswer = answers[rule.question];

      if (Array.isArray(parentAnswer)) {
        return parentAnswer.includes(expected as string);
      }

      return parentAnswer === expected;
    });
  };

  const getParentAnswerLabel = (item: AyuQuestion): string | null => {
    if (!item.enableWhen?.length || !parentQuestion) return null;

    const rule = item.enableWhen[0];

    const expected =
      rule.answerBoolean ??
      rule.answerString ??
      rule.answerInteger ??
      rule.answerCoding?.code;

    const option = parentQuestion.answerOption?.find(
      opt => opt.valueCoding?.code === expected || opt.valueString === expected
    );

    return option?.valueCoding?.display || option?.valueString || null;
  };

  const enabledItems = items.filter(isEnabled);
  if (!enabledItems.length) return null;

  const firstItem = enabledItems[0];
  const parentAnswerLabel = getParentAnswerLabel(firstItem);
  const isStringType = firstItem?.type === 'string';

  return (
    <div className="space-y-4 px-3">
      {!isStringType && parentAnswerLabel && (
        <div className="flex items-center gap-2 text-emerald-600 font-semibold mt-4">
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="flex-shrink-0"
          >
            <path d="M4 2 L14 8 L4 14 Z" />
          </svg>
          <span>{parentAnswerLabel}</span>
        </div>
      )}
      {!isStringType && (
        <div className="text-sm text-gray-500 -mt-4 ml-5">
          {firstItem?.repeats ? SELECT_ONE_OR_MORE : SELECT_ANY_ONE}
        </div>
      )}

      {enabledItems.map(child => {
        return (
          <div key={child.linkId}>
            <AyuRenderer
              question={child}
              value={answers[child.linkId]}
              onChange={val => setAnswer(child, val)}
            />

            {/* Recursively render deeper nesting */}
            {child.item && (
              <AyuNestedRenderer
                items={child.item}
                answers={answers}
                setAnswer={setAnswer}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
