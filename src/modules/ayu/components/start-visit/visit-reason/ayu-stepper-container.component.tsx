import { useEffect, useRef } from 'react';
import { useFHIRStepper } from '../../../hooks/useFHIRStepper.hook';
import { resolveAyuComponent } from '../../../pages/decision-matrix';
import type { AyuAnswerValue, AyuQuestion } from '../../../types/ayu.types';
import AyuButton from '../../common/ayu-button.component';
import { QuestionLoader } from '../../loaders/question-loader.component';
import { AyuNestedRenderer } from './ayu-nested-renderer.component';
import { AyuRenderer } from './ayu-renderer.component';

interface AyuStepperContainerProps {
  questionnaire: AyuQuestion | { item?: AyuQuestion[] };
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
    goNext,
    topLevelItems,
    isLast,
  } = useFHIRStepper({ questionnaire, onComplete });

  const totalSteps = topLevelItems.length;
  const lastQuestionRef = useRef<HTMLDivElement | null>(null);

  const prevCompletedRef = useRef<number>(-1);

  useEffect(() => {
    const completedSteps = currentIndex;

    if (prevCompletedRef.current === completedSteps) return;

    prevCompletedRef.current = completedSteps;
    onProgressUpdate?.(totalSteps, completedSteps);
  }, [currentIndex, totalSteps, onProgressUpdate]);

  useEffect(() => {
    lastQuestionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [currentIndex]);

  if (!currentQuestion) return null;

  const isEmpty = (val: unknown) =>
    val === undefined ||
    val === null ||
    (typeof val === 'string' && val.trim() === '') ||
    (Array.isArray(val) && val.length === 0);

  const hasVisibleRequiredNestedString = currentQuestion.item?.some(
    (child: AyuQuestion) => {
      if (child.type !== 'string') return false;

      // check visibility
      const isVisible =
        !child.enableWhen ||
        child.enableWhen.every(rule => {
          const expected =
            rule.answerBoolean ??
            rule.answerString ??
            rule.answerInteger ??
            rule.answerCoding?.code;

          return answers[rule.question] === expected;
        });

      if (!isVisible) return false;

      return isEmpty(answers[child.linkId]);
    }
  );

  // Check if quantity/duration field is properly filled
  const isQuantityInvalid = (question: AyuQuestion) => {
    if (question.type !== 'quantity' && question.type !== 'choice')
      return false;

    // Check nested children for duration structure
    if (question.type === 'choice' && question.item) {
      for (const child of question.item) {
        const childAnswer = answers[child.linkId];
        if (
          childAnswer &&
          typeof childAnswer === 'object' &&
          'dropdownValues' in childAnswer
        ) {
          // Check if both dropdown values are filled
          const hasNumber = !!childAnswer.dropdownValues?.number;
          const hasDays = !!childAnswer.dropdownValues?.days;
          return !hasNumber || !hasDays;
        }
      }
    }

    // Check top-level answer
    const value = answers[question.linkId];
    if (!value) return true;

    // Only validate if it's an object with dropdownValues structure (duration component)
    if (typeof value === 'object' && 'dropdownValues' in value) {
      // Check if both dropdown values are filled
      const hasNumber = !!value.dropdownValues?.number;
      const hasDays = !!value.dropdownValues?.days;
      return !hasNumber || !hasDays;
    }

    // For regular choice questions (string values), not invalid
    return false;
  };

  return (
    <div className="flex flex-col gap-6">
      {topLevelItems
        .slice(0, currentIndex + 1)
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
                        answers={answers}
                        setAnswer={setAnswer}
                      />
                    )}
                  {/* ACTION BUTTONS */}
                  {isActive && (
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

                        return (
                          (question.type === 'string' &&
                            answers[question.linkId] !== undefined) ||
                          (question.type === 'quantity' &&
                            answers[question.linkId] !== undefined) ||
                          (question.type === 'choice' && question.repeats) ||
                          isDurationChoice ||
                          hasNestedDuration ||
                          question.item?.some(
                            child =>
                              child.type === 'string' &&
                              answers[child.linkId] !== undefined
                          )
                        );
                      })() && (
                        <AyuButton
                          variant="primary"
                          className="w-full md:w-[10%]"
                          disabled={
                            hasVisibleRequiredNestedString ||
                            isQuantityInvalid(question) ||
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
                                (answers[question.linkId] as string[]).length <
                                  (question.answerOption?.length ?? 0)))
                          }
                          onClick={() => {
                            if (isLast) {
                              onProgressUpdate?.(totalSteps, totalSteps);
                            }
                            goNext();
                          }}
                        >
                          Submit
                        </AyuButton>
                      )}

                      {/* SKIP for non-required */}
                      {!question.required && (
                        <AyuButton
                          variant="primary"
                          className="w-full md:w-[10%]"
                          onClick={() => {
                            if (isLast) {
                              onProgressUpdate?.(totalSteps, totalSteps);
                            }
                            goNext();
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
