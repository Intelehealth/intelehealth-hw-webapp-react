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
  isEmpty,
  isNestedInputValueMissing,
  isQuantityInvalid,
} from '../../../../ayu-library/logic/validation.logic';
import type {
  AyuAnswerValue,
  AyuQuestion,
  FhirQuestionnaire,
} from '../../../../ayu-library/types/ayu.types';
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
  confirm: () => void;
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
          onComplete?.(answers);
        },
      }),
      [answers, onComplete]
    );

    const totalSteps = topLevelItems.length;
    const lastQuestionRef = useRef<HTMLDivElement | null>(null);
    const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(
      new Set()
    );
    const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(
      new Set()
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
                      onChange={val => setAnswer(question, val)}
                      answers={answers}
                      setAnswer={setAnswer}
                    />
                    {question.item &&
                      resolveAyuComponent(question) !==
                        ASSOCIATED_SYMPTOMS_COMPONENT && (
                        <AyuNestedRenderer
                          items={question.item}
                          parentQuestion={question}
                          answers={answers}
                          setAnswer={setAnswer}
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
                            disabled={
                              ((question.type === 'date' ||
                                question.type === 'integer' ||
                                question.type === 'quantity') &&
                                isEmpty(answers[question.linkId])) ||
                              hasUnansweredRequiredNestedChild(
                                question,
                                answers
                              )
                            }
                            rightIcon={
                              submittedQuestions.has(question.linkId) ? (
                                <img src={iconYes} alt="yes" />
                              ) : undefined
                            }
                            onClick={() => {
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
                                  (!Array.isArray(answers[question.linkId]) ||
                                    (answers[question.linkId] as string[])
                                      .length === 0)) ||
                                (resolveAyuComponent(question) ===
                                  ASSOCIATED_SYMPTOMS_COMPONENT &&
                                  (!Array.isArray(answers[question.linkId]) ||
                                    (answers[question.linkId] as string[])
                                      .length === 0)) ||
                                (isStrictAssociatedSymptoms(question) &&
                                  (!Array.isArray(answers[question.linkId]) ||
                                    (answers[question.linkId] as string[])
                                      .length <
                                      (question.answerOption?.length ?? 0)) &&
                                  !hasExclusiveSelected(
                                    question,
                                    Array.isArray(answers[question.linkId])
                                      ? (answers[question.linkId] as string[])
                                      : []
                                  ));

                              if (isInvalid) {
                                const isAssociatedSymptomsIncomplete =
                                  resolveAyuComponent(question) ===
                                    ASSOCIATED_SYMPTOMS_COMPONENT &&
                                  (!Array.isArray(answers[question.linkId]) ||
                                    (answers[question.linkId] as string[])
                                      .length <
                                      (question.answerOption?.length ?? 0)) &&
                                  !hasExclusiveSelected(
                                    question,
                                    Array.isArray(answers[question.linkId])
                                      ? (answers[question.linkId] as string[])
                                      : []
                                  );

                                const message = isAssociatedSymptomsIncomplete
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
                              disabled={
                                answers[question.linkId] !== undefined &&
                                !isActive
                              }
                              rightIcon={
                                skippedQuestions.has(question.linkId) &&
                                !(question.linkId in answers) ? (
                                  <img src={iconYes} alt="yes" />
                                ) : undefined
                              }
                              onClick={() => {
                                setSkippedQuestions(prev =>
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
