import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { showToast } from '../../../../../services/toast';
import { hasExclusiveSelected } from '../../../../ayu-library/logic/associated-symptoms.logic';
import { evaluateEnableWhen } from '../../../../ayu-library/logic/enable-when.logic';
import {
  hasUnansweredRequiredNestedChild,
  hasVisibleRequiredNestedString,
  isNestedInputValueMissing,
  isQuantityInvalid,
} from '../../../../ayu-library/logic/validation.logic';
import type {
  AyuAnswerValue,
  AyuQuestion,
  FhirQuestionnaire,
} from '../../../../ayu-library/types/ayu.types';
import { collectDescendantLinkIds } from '../../../../ayu-library/utils/question.utils';
import iconYes from '../../../assets/yes.svg';
import { useFHIRStepper } from '../../../hooks/useFHIRStepper.hook';
import {
  ASSOCIATED_SYMPTOMS_COMPONENT,
  isStrictAssociatedSymptoms,
  resolveAyuComponent,
} from '../../../pages/decision-matrix';
import {
  BUTTON_SKIP,
  BUTTON_SUBMIT,
  VALIDATION_ALL_COMPULSORY,
  VALIDATION_ENTER_VALUE,
  VALIDATION_SELECT_OPTION,
} from '../../../utils/ayu.constants';
import AyuButton from '../../common/ayu-button.component';
import { QuestionLoader } from '../../loaders/question-loader.component';
import { AyuNestedRenderer } from './ayu-nested-renderer.component';
import { AyuRenderer } from './ayu-renderer.component';

export interface AyuStepperContainerHandle {
  /** Directly call onComplete with current answers (skips summary modal). */
  confirm: () => void;
  /** Trigger the normal completion flow which shows the summary modal (when skipSummary is false). */
  showSummary: () => void;
}

interface AyuStepperContainerProps {
  questionnaire: FhirQuestionnaire;
  summaryTitle?: string;
  skipSummary?: boolean;
  initialAnswers?: Record<string, AyuAnswerValue>;
  /** Offset added to question index for display (used when multiple files share one section) */
  questionIndexOffset?: number;
  /** Override total questions count for display (used to show combined total across files) */
  totalQuestionsOverride?: number;
  onComplete?: (answers: Record<string, AyuAnswerValue>) => void;
  onProgressUpdate?: (total: number, completed: number) => void;
}

export const AyuStepperContainer = forwardRef<
  AyuStepperContainerHandle,
  AyuStepperContainerProps
>(
  (
    {
      questionnaire,
      summaryTitle,
      skipSummary,
      initialAnswers,
      questionIndexOffset = 0,
      totalQuestionsOverride,
      onComplete,
      onProgressUpdate,
    },
    ref
  ) => {
    const {
      currentQuestion,
      currentIndex,
      total,
      answers,
      setAnswer,
      clearAnswers,
      goNext,
      topLevelItems,
      isLast,
      showAll,
      validateAllQuestions,
    } = useFHIRStepper({
      questionnaire,
      summaryTitle,
      skipSummary,
      initialAnswers,
      onComplete,
    });

    useImperativeHandle(
      ref,
      () => ({
        confirm: () => {
          if (!validateAllQuestions()) return;
          onComplete?.(answers);
        },
        showSummary: () => {
          goNext();
        },
      }),
      [answers, onComplete, goNext, validateAllQuestions]
    );

    const totalSteps = topLevelItems.length;
    const lastQuestionRef = useRef<HTMLDivElement | null>(null);

    // When remounting with initialAnswers (e.g. returning via "Change" in
    // medical-history combined summary), reconstruct submitted/skipped sets
    // so tick-mark icons are preserved — matching Visit Reason behaviour.
    const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(
      () => {
        if (!initialAnswers || Object.keys(initialAnswers).length === 0)
          return new Set();
        const submitted = new Set<string>();
        for (const item of topLevelItems) {
          if (initialAnswers[item.linkId] !== undefined) {
            submitted.add(item.linkId);
          }
        }
        return submitted;
      }
    );
    const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(
      () => {
        if (!initialAnswers || Object.keys(initialAnswers).length === 0)
          return new Set();
        const skipped = new Set<string>();
        for (const item of topLevelItems) {
          if (initialAnswers[item.linkId] === undefined && !item.required) {
            skipped.add(item.linkId);
          }
        }
        return skipped;
      }
    );

    const prevCompletedRef = useRef<number>(-1);

    useEffect(() => {
      if (showAll) return; // Don't reset progress while in review mode
      const completedSteps = currentIndex;

      if (prevCompletedRef.current === completedSteps) return;

      prevCompletedRef.current = completedSteps;
      onProgressUpdate?.(totalSteps, completedSteps);
    }, [currentIndex, totalSteps, onProgressUpdate, showAll]);

    useEffect(() => {
      lastQuestionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, [currentIndex]);

    if (!currentQuestion) return null;

    return (
      <div className="flex flex-col gap-6">
        {topLevelItems
          .slice(0, showAll ? topLevelItems.length : currentIndex + 1)
          .map((question: AyuQuestion, index: number) => {
            const isActive = index === currentIndex;

            // Wrapper that clears submitted/skipped icons when the user changes an answer
            const handleSetAnswer = (q: AyuQuestion, val: AyuAnswerValue) => {
              setAnswer(q, val);
              setSubmittedQuestions(prev => {
                if (!prev.has(question.linkId)) return prev;
                const next = new Set(prev);
                next.delete(question.linkId);
                return next;
              });
              setSkippedQuestions(prev => {
                if (!prev.has(question.linkId)) return prev;
                const next = new Set(prev);
                next.delete(question.linkId);
                return next;
              });
            };

            return (
              <div
                key={question.linkId}
                ref={isActive ? lastQuestionRef : null}
              >
                <QuestionLoader
                  question={question.text}
                  questionIndex={index + questionIndexOffset}
                  totalQuestions={totalQuestionsOverride ?? total}
                  isShowQuestionNumber={true}
                >
                  <>
                    <AyuRenderer
                      question={question}
                      value={answers[question.linkId]}
                      onChange={val => handleSetAnswer(question, val)}
                      answers={answers}
                      setAnswer={handleSetAnswer}
                    />
                    {question.item &&
                      resolveAyuComponent(question) !==
                        ASSOCIATED_SYMPTOMS_COMPONENT && (
                        <AyuNestedRenderer
                          items={question.item}
                          parentQuestion={question}
                          answers={answers}
                          setAnswer={handleSetAnswer}
                          clearAnswers={clearAnswers}
                          showAllTriangles
                        />
                      )}
                    {/* ACTION BUTTONS */}
                    {(isActive || showAll || index < currentIndex) && (
                      <div className="mt-3 flex gap-3 md:justify-end">
                        {/* SUBMIT for required string and quantity types */}
                        {(() => {
                          const answer = answers[question.linkId];

                          // Check if top-level has dropdownValues
                          const isDurationChoice =
                            question.type === 'choice' &&
                            answer &&
                            typeof answer === 'object' &&
                            'dropdownValues' in answer;

                          // Recursive check for nested duration, repeats, and input fields
                          const checkNestedDeep = (
                            items: AyuQuestion[] | undefined
                          ): {
                            hasDuration: boolean;
                            hasRepeats: boolean;
                            hasInput: boolean;
                          } => {
                            if (!items)
                              return {
                                hasDuration: false,
                                hasRepeats: false,
                                hasInput: false,
                              };
                            for (const child of items) {
                              if (
                                !evaluateEnableWhen(child.enableWhen, answers)
                              )
                                continue;
                              const childAnswer = answers[child.linkId];
                              if (
                                childAnswer &&
                                typeof childAnswer === 'object' &&
                                'dropdownValues' in childAnswer
                              ) {
                                return {
                                  hasDuration: true,
                                  hasRepeats: false,
                                  hasInput: false,
                                };
                              }
                              if (child.repeats) {
                                return {
                                  hasDuration: false,
                                  hasRepeats: true,
                                  hasInput: false,
                                };
                              }
                              if (
                                child.type === 'string' ||
                                child.type === 'integer' ||
                                child.type === 'date' ||
                                child.type === 'quantity'
                              ) {
                                return {
                                  hasDuration: false,
                                  hasRepeats: false,
                                  hasInput: true,
                                };
                              }
                              const deep = checkNestedDeep(child.item);
                              if (
                                deep.hasDuration ||
                                deep.hasRepeats ||
                                deep.hasInput
                              )
                                return deep;
                            }
                            return {
                              hasDuration: false,
                              hasRepeats: false,
                              hasInput: false,
                            };
                          };

                          const nestedFlags =
                            question.type === 'choice'
                              ? checkNestedDeep(question.item)
                              : {
                                  hasDuration: false,
                                  hasRepeats: false,
                                  hasInput: false,
                                };
                          const hasNestedDuration = nestedFlags.hasDuration;
                          const hasNestedRepeats = nestedFlags.hasRepeats;
                          const hasVisibleNestedInput = nestedFlags.hasInput;

                          // In review mode, show Submit for answered questions except pure single-choice
                          if (
                            showAll &&
                            answers[question.linkId] !== undefined
                          ) {
                            const isSingleChoiceWithoutNestedSubmit =
                              question.type === 'choice' &&
                              !question.repeats &&
                              !hasNestedRepeats &&
                              !hasVisibleNestedInput &&
                              !isDurationChoice &&
                              !hasNestedDuration;
                            if (!isSingleChoiceWithoutNestedSubmit) return true;
                          }

                          return (
                            (question.type === 'string' &&
                              answers[question.linkId] !== undefined) ||
                            (question.type === 'quantity' &&
                              answers[question.linkId] !== undefined) ||
                            question.type === 'date' ||
                            question.type === 'integer' ||
                            (question.type === 'choice' && question.repeats) ||
                            isDurationChoice ||
                            hasNestedDuration ||
                            hasNestedRepeats ||
                            hasVisibleNestedInput
                          );
                        })() && (
                          <AyuButton
                            variant="primary"
                            className="w-full md:w-[10%]"
                            size="sm"
                            disabled={skippedQuestions.has(question.linkId)}
                            rightIcon={
                              submittedQuestions.has(question.linkId) ? (
                                <img src={iconYes} alt="yes" />
                              ) : undefined
                            }
                            onClick={() => {
                              const rawAnswer = answers[question.linkId];
                              const answerCodes: string[] = Array.isArray(
                                rawAnswer
                              )
                                ? (rawAnswer as string[])
                                : [];
                              const isInvalid =
                                hasVisibleRequiredNestedString(
                                  question,
                                  answers
                                ) ||
                                hasUnansweredRequiredNestedChild(
                                  question,
                                  answers
                                ) ||
                                isQuantityInvalid(question, answers) ||
                                (question.type === 'choice' &&
                                  question.repeats &&
                                  resolveAyuComponent(question) !==
                                    ASSOCIATED_SYMPTOMS_COMPONENT &&
                                  answerCodes.length === 0) ||
                                (resolveAyuComponent(question) ===
                                  ASSOCIATED_SYMPTOMS_COMPONENT &&
                                  answerCodes.length === 0) ||
                                (isStrictAssociatedSymptoms(question) &&
                                  answerCodes.length <
                                    (question.answerOption?.length ?? 0) &&
                                  !hasExclusiveSelected(question, answerCodes));

                              if (isInvalid) {
                                const isAssociatedSymptomsIncomplete =
                                  resolveAyuComponent(question) ===
                                    ASSOCIATED_SYMPTOMS_COMPONENT &&
                                  answerCodes.length <
                                    (question.answerOption?.length ?? 0) &&
                                  !hasExclusiveSelected(question, answerCodes);

                                const message =
                                  isAssociatedSymptomsIncomplete &&
                                  isStrictAssociatedSymptoms(question)
                                    ? VALIDATION_ALL_COMPULSORY
                                    : hasVisibleRequiredNestedString(
                                          question,
                                          answers
                                        ) ||
                                        isNestedInputValueMissing(
                                          question,
                                          answers
                                        ) ||
                                        isQuantityInvalid(question, answers)
                                      ? VALIDATION_ENTER_VALUE
                                      : VALIDATION_SELECT_OPTION;
                                showToast(message, undefined, 'warning');
                                return;
                              }

                              setSubmittedQuestions(prev =>
                                new Set(prev).add(question.linkId)
                              );

                              if (isActive) {
                                if (isLast) {
                                  onProgressUpdate?.(totalSteps, totalSteps);
                                }
                                goNext();
                              }
                            }}
                          >
                            {BUTTON_SUBMIT}
                          </AyuButton>
                        )}

                        {/* SKIP for non-required */}
                        {!question.required &&
                          (isActive ||
                            index < currentIndex ||
                            skippedQuestions.has(question.linkId)) && (
                            <AyuButton
                              variant="primary"
                              className="w-full md:w-[10%]"
                              size="sm"
                              disabled={submittedQuestions.has(question.linkId)}
                              rightIcon={
                                skippedQuestions.has(question.linkId) ? (
                                  <img src={iconYes} alt="yes" />
                                ) : undefined
                              }
                              onClick={() => {
                                // Clear answer data for this question and all its descendants
                                const descendantIds =
                                  collectDescendantLinkIds(question);
                                clearAnswers([
                                  question.linkId,
                                  ...descendantIds,
                                ]);

                                setSkippedQuestions(prev =>
                                  new Set(prev).add(question.linkId)
                                );
                                setSubmittedQuestions(prev => {
                                  const next = new Set(prev);
                                  next.delete(question.linkId);
                                  return next;
                                });
                                if (isActive) {
                                  if (isLast) {
                                    onProgressUpdate?.(totalSteps, totalSteps);
                                  }
                                  goNext();
                                }
                              }}
                            >
                              {BUTTON_SKIP}
                            </AyuButton>
                          )}
                      </div>
                    )}
                  </>
                </QuestionLoader>
              </div>
            );
          })}
      </div>
    );
  }
);
