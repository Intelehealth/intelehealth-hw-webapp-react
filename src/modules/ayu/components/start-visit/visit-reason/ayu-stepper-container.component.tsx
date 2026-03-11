import { useEffect, useRef, useState } from 'react';
import { showToast } from '../../../../../services/toast';
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
import iconYes from '../../../assets/yes.svg';
import { useFHIRStepper } from '../../../hooks/useFHIRStepper.hook';
import { resolveAyuComponent } from '../../../pages/decision-matrix';
import AyuButton from '../../common/ayu-button.component';
import { QuestionLoader } from '../../loaders/question-loader.component';
import { AyuNestedRenderer } from './ayu-nested-renderer.component';
import { AyuRenderer } from './ayu-renderer.component';

interface AyuStepperContainerProps {
  questionnaire: FhirQuestionnaire;
  onComplete?: (answers: Record<string, AyuAnswerValue>) => void;
  onProgressUpdate?: (total: number, completed: number) => void;
}

export const AyuStepperContainer = ({
  questionnaire,
  onComplete,
  onProgressUpdate,
}: AyuStepperContainerProps) => {
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
  } = useFHIRStepper({ questionnaire, onComplete });

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
            <div key={question.linkId} ref={isActive ? lastQuestionRef : null}>
              <QuestionLoader
                question={question.text}
                questionIndex={index}
                totalQuestions={total}
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
                    resolveAyuComponent(question) !== 'associatedSymptoms' && (
                      <AyuNestedRenderer
                        items={question.item}
                        parentQuestion={question}
                        answers={answers}
                        setAnswer={setAnswer}
                        clearAnswers={clearAnswers}
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

                        // Check if any nested child has dropdownValues
                        const hasNestedDuration =
                          question.type === 'choice' &&
                          question.item?.some(child => {
                            const childAnswer = answers[child.linkId];
                            return (
                              childAnswer &&
                              typeof childAnswer === 'object' &&
                              'dropdownValues' in childAnswer
                            );
                          });

                        const hasNestedRepeats = question.item?.some(
                          child =>
                            child.repeats &&
                            evaluateEnableWhen(child.enableWhen, answers)
                        );

                        // Check for visible nested input-type children with answers
                        const hasVisibleNestedInput = question.item?.some(
                          child =>
                            (child.type === 'string' ||
                              child.type === 'integer' ||
                              child.type === 'quantity') &&
                            evaluateEnableWhen(child.enableWhen, answers) &&
                            answers[child.linkId] !== undefined
                        );

                        // In review mode, show Submit for answered questions except pure single-choice
                        if (showAll && answers[question.linkId] !== undefined) {
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
                                  'associatedSymptoms' &&
                                (!Array.isArray(answers[question.linkId]) ||
                                  (answers[question.linkId] as string[])
                                    .length === 0)) ||
                              (resolveAyuComponent(question) ===
                                'associatedSymptoms' &&
                                (!Array.isArray(answers[question.linkId]) ||
                                  (answers[question.linkId] as string[])
                                    .length <
                                    (question.answerOption?.length ?? 0)));

                            if (isInvalid) {
                              const isAssociatedSymptomsIncomplete =
                                resolveAyuComponent(question) ===
                                  'associatedSymptoms' &&
                                (!Array.isArray(answers[question.linkId]) ||
                                  (answers[question.linkId] as string[])
                                    .length <
                                    (question.answerOption?.length ?? 0));

                              const message = isAssociatedSymptomsIncomplete
                                ? 'All questions are compulsory, please answer'
                                : hasVisibleRequiredNestedString(
                                      question,
                                      answers
                                    ) ||
                                    isNestedInputValueMissing(
                                      question,
                                      answers
                                    ) ||
                                    isQuantityInvalid(question, answers)
                                  ? 'Please enter a value'
                                  : 'Please select any one option';
                              showToast(message, undefined, 'warning');
                              return;
                            }

                            setSubmittedQuestions(prev =>
                              new Set(prev).add(question.linkId)
                            );

                            const isAssociatedSymptoms =
                              resolveAyuComponent(question) ===
                              'associatedSymptoms';

                            if (isActive || isAssociatedSymptoms) {
                              if (isLast || isAssociatedSymptoms) {
                                onProgressUpdate?.(totalSteps, totalSteps);
                              }
                              goNext();
                            }
                          }}
                        >
                          Submit
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
                              answers[question.linkId] === undefined ? (
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
                            Skip
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
};
