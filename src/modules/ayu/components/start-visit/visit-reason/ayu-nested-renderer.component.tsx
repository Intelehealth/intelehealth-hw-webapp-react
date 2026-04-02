import { useEffect, useState } from 'react';
import { evaluateEnableWhen } from '../../../../ayu-library/logic/enable-when.logic';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../ayu-library/types/ayu.types';
import {
  collectDescendantLinkIds,
  findMatchingOptionCode,
} from '../../../../ayu-library/utils/question.utils';
import { AyuSelectableOption } from '../../common/ayu-selectable-option.component';
import '../../common/selectable-option.css';
import { AyuRenderer } from './ayu-renderer.component';

interface NestedProps {
  items?: AyuQuestion[];
  parentQuestion?: AyuQuestion;
  answers: Record<string, AyuAnswerValue>;
  setAnswer: (question: AyuQuestion, value: AyuAnswerValue) => void;
  clearAnswers?: (linkIds: string[]) => void;
  selectable?: boolean;
  /** When true, shows the triangle indicator for all item types including string/text inputs. */
  showAllTriangles?: boolean;
}

export const AyuNestedRenderer = ({
  items,
  parentQuestion,
  answers,
  setAnswer,
  clearAnswers,
  selectable = false,
  showAllTriangles = false,
}: NestedProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Reset selected option when the parent answer changes (different children become visible)
  const parentAnswer = parentQuestion
    ? answers[parentQuestion.linkId]
    : undefined;
  useEffect(() => {
    setSelectedOption(null);
  }, [parentAnswer]);

  // Clear answers for a selectable option and all its nested descendants
  const clearNestedAnswers = (item: AyuQuestion) => {
    const linkIds = [item.linkId, ...collectDescendantLinkIds(item)].filter(
      id => answers[id] !== undefined
    );
    if (linkIds.length && clearAnswers) {
      clearAnswers(linkIds);
    }
  };

  // Check if a choice question has answerOption → item mapping
  const hasAnswerOptionItemMapping = (q: AyuQuestion) =>
    q.type === 'choice' && !!q.answerOption?.length && !!q.item?.length;

  // Render deeply nested items inline when their corresponding option is selected
  const renderInlineNestedItems = (parentChild: AyuQuestion) => {
    const parentAnswer = answers[parentChild.linkId];
    const selectedCodes: string[] = Array.isArray(parentAnswer)
      ? parentAnswer
      : typeof parentAnswer === 'string'
        ? [parentAnswer]
        : [];

    return parentChild
      .item!.filter(nestedItem => {
        const matchedCode = findMatchingOptionCode(nestedItem, parentChild);
        return matchedCode && selectedCodes.includes(matchedCode);
      })
      .map((nestedItem, idx, filtered) => (
        <div key={nestedItem.linkId} className="mt-2 ml-3">
          <AyuRenderer
            question={nestedItem}
            previousSibling={idx > 0 ? filtered[idx - 1] : undefined}
            value={answers[nestedItem.linkId]}
            onChange={val => setAnswer(nestedItem, val)}
            answers={answers}
            setAnswer={setAnswer}
          />
          {nestedItem.item && (
            <AyuNestedRenderer
              items={nestedItem.item}
              answers={answers}
              setAnswer={setAnswer}
              clearAnswers={clearAnswers}
              selectable={true}
            />
          )}
        </div>
      ));
  };

  if (!items?.length) return null;

  const isEnabled = (item: AyuQuestion) =>
    evaluateEnableWhen(item.enableWhen, answers);

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

  // Group enabled items by their parent answer label
  const groups = new Map<string | null, AyuQuestion[]>();
  for (const item of enabledItems) {
    const label = getParentAnswerLabel(item);
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(item);
  }

  return (
    <div className="space-y-4 px-3">
      {Array.from(groups.entries()).map(([label, children]) => (
        <div key={label || 'default'}>
          {selectable ? (
            <>
              {/* All items as selectable option pills */}
              <div className="option-group mt-4 mb-3">
                {children.map(
                  item =>
                    item?.type !== 'string' && (
                      <AyuSelectableOption
                        key={item.linkId}
                        label={item.text}
                        value={item.linkId}
                        selected={selectedOption === item.linkId}
                        onClick={() => {
                          if (selectedOption === item.linkId) {
                            // Deselecting current option — clear its nested answers
                            clearNestedAnswers(item);
                            setSelectedOption(null);
                          } else {
                            // Switching to a new option — clear previous option's nested answers
                            if (selectedOption) {
                              const prevItem = children.find(
                                c => c.linkId === selectedOption
                              );
                              if (prevItem) clearNestedAnswers(prevItem);
                            }
                            setSelectedOption(item.linkId);
                          }
                        }}
                      />
                    )
                )}
              </div>
              {/* Render string-type children directly without selection */}
              {children
                .filter(child => child.type === 'string')
                .map(child => (
                  <div key={child.linkId}>
                    <AyuRenderer
                      question={child}
                      value={answers[child.linkId]}
                      onChange={val => setAnswer(child, val)}
                    />
                  </div>
                ))}

              {/* Render input component for the selected non-string item */}
              {children
                .filter(
                  child =>
                    child.type !== 'string' && selectedOption === child.linkId
                )
                .map(child => (
                  <div
                    key={child.linkId}
                    className="flex items-start gap-2 mt-2"
                  >
                    {child.type === 'choice' && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="#20c997"
                        className="flex-shrink-0 mt-4"
                      >
                        <path d="M4 2 L14 8 L4 14 Z" />
                      </svg>
                    )}
                    <div className="flex-1">
                      <AyuRenderer
                        question={child}
                        value={answers[child.linkId]}
                        onChange={val => setAnswer(child, val)}
                      />
                      {hasAnswerOptionItemMapping(child)
                        ? renderInlineNestedItems(child)
                        : child.item && (
                            <AyuNestedRenderer
                              items={child.item}
                              answers={answers}
                              setAnswer={setAnswer}
                              clearAnswers={clearAnswers}
                              selectable={selectable}
                            />
                          )}
                    </div>
                  </div>
                ))}
            </>
          ) : (
            /* Render all items directly via AyuRenderer */
            children.map((child, childIndex) => {
              // Show triangle for string items only when the group has multiple children
              // (standalone question like "How often...?"), not when it's the sole child
              // of an option (describe field like "Describe..." under a "Describe" option)
              const isDescribeField =
                child.type === 'string' && children.length === 1;
              const showTriangle = isDescribeField
                ? false
                : showAllTriangles ||
                  child.type !== 'string' ||
                  children.length > 1;

              const prevSibling =
                childIndex > 0 ? children[childIndex - 1] : undefined;

              return (
                <div key={child.linkId} className="flex items-start gap-2 mt-2">
                  {showTriangle && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="#20c997"
                      className="flex-shrink-0 mt-1"
                    >
                      <path d="M4 2 L14 8 L4 14 Z" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <AyuRenderer
                      question={child}
                      parent={parentQuestion}
                      previousSibling={prevSibling}
                      value={answers[child.linkId]}
                      onChange={val => setAnswer(child, val)}
                      answers={answers}
                      setAnswer={setAnswer}
                    />
                    {child.item && (
                      <AyuNestedRenderer
                        items={child.item}
                        parentQuestion={child}
                        answers={answers}
                        setAnswer={setAnswer}
                        clearAnswers={clearAnswers}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
};
