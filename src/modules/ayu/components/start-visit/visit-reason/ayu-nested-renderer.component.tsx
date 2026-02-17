import type { AyuAnswerValue, AyuQuestion } from '../../../types/ayu.types';
import { SELECT_ANY_ONE, SELECT_ONE_OR_MORE } from '../../../utils/constants';
import { AyuRenderer } from './ayu-renderer.component';

interface NestedProps {
  items?: AyuQuestion[];
  answers: Record<string, AyuAnswerValue>;
  setAnswer: (linkId: string, value: AyuAnswerValue) => void;
}

export const AyuNestedRenderer = ({
  items,
  answers,
  setAnswer,
}: NestedProps) => {
  if (!items?.length) return null;

  const isEnabled = (item: AyuQuestion) => {
    if (!item.enableWhen) return true;

    return item.enableWhen.every(rule => {
      const answer = answers[rule.question];

      const expectedValue =
        rule.answerBoolean ??
        rule.answerString ??
        rule.answerInteger ??
        rule.answerCoding?.code;

      return answer === expectedValue;
    });
  };

  const getParentAnswerLabel = (
    item: AyuQuestion
  ): string | number | boolean | null => {
    if (!item.enableWhen?.[0]) return null;

    const rule = item.enableWhen[0];
    const parentQuestionLinkId = rule.question;
    const selectedAnswer = answers[parentQuestionLinkId];

    // If the answer is an object with display or code property, use that
    if (
      selectedAnswer &&
      typeof selectedAnswer === 'object' &&
      !Array.isArray(selectedAnswer)
    ) {
      const answerObj = selectedAnswer as unknown as Record<string, unknown>;
      const display = answerObj.display;
      const code = answerObj.code;
      if (typeof display === 'string') return display;
      if (typeof code === 'string') return code;
      return null; // Don't return complex objects
    }

    // Return primitive values only
    if (
      typeof selectedAnswer === 'string' ||
      typeof selectedAnswer === 'number' ||
      typeof selectedAnswer === 'boolean'
    ) {
      return selectedAnswer;
    }

    // Otherwise, return the expected answer from the rule
    return (
      item.enableWhen[0].answerString ||
      item.enableWhen[0].answerInteger ||
      item.enableWhen[0].answerBoolean ||
      item.enableWhen[0].answerCoding?.code ||
      null
    );
  };

  const enabledItems = items.filter(isEnabled);
  if (!enabledItems.length) return null;

  const firstItem = enabledItems[0];
  const parentAnswerLabel = getParentAnswerLabel(firstItem);
  const isStringType = firstItem?.type === 'string';

  return (
    <div className="space-y-4">
      {!isStringType && parentAnswerLabel && (
        <div className="flex items-center gap-2 text-[#20c997] font-medium">
          <svg
            width="16"
            height="16"
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
        <div className="text-sm text-gray-500 -mt-2">
          {firstItem?.repeats ? SELECT_ONE_OR_MORE : SELECT_ANY_ONE}
        </div>
      )}

      {enabledItems.map(child => {
        return (
          <div key={child.linkId}>
            <AyuRenderer
              question={child}
              value={answers[child.linkId]}
              onChange={val => setAnswer(child.linkId, val)}
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
