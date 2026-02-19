import { useMemo } from 'react';
import physicalExamData from '../../data/physical-exam.data.json';
import { usePhysicalExam } from '../../hooks/usePhysicalExam';
import type { SectionProps } from '../../types/start-visit.types';
import { flattenPhysicalExamQuestions } from '../../utils/physical-exam.utils';
import AyuButton from '../common/ayu-button.component';
import { QuestionLoader } from '../loaders/question-loader.component';

export const PhysicalExamination = ({ onPrevSection }: SectionProps) => {
  // Flatten the physical exam questions once
  const flattenedQuestions = useMemo(
    () => flattenPhysicalExamQuestions(physicalExamData),
    []
  );

  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    answers,
    handleAnswer,
    handleImageCapture,
    handleImageRemove,
    goToNextQuestion,
    goToPreviousQuestion,
    isFirstQuestion,
    isLastQuestion,
    validation,
  } = usePhysicalExam(flattenedQuestions);

  const handleAnswerSelect = (answerId: string, isExclusive: boolean) => {
    if (currentQuestion) {
      handleAnswer(
        currentQuestion.id,
        answerId,
        currentQuestion.multiChoice,
        isExclusive
      );

      // Auto-advance to next question after a short delay
      // For single choice or exclusive options, go to next immediately
      if (!currentQuestion.multiChoice || isExclusive) {
        setTimeout(() => {
          if (isLastQuestion) {
            // TODO: FOR TESTING PURPOSE ONLY - VALIDATION COMMENTED OUT
            // TODO: REVERT THIS LATER TO ENABLE REQUIRED FIELD VALIDATION
            // // Validate all required questions before finishing
            // if (!validation.isValid) {
            //   alert(
            //     `Please answer all required questions:\n${validation.missingQuestions.join('\n')}`
            //   );
            //   return;
            // }
            // TODO: Save answers and move to next section
            // For now, just show completion message
            alert('Physical examination completed!');
          } else {
            goToNextQuestion();
          }
        }, 300); // Small delay for visual feedback
      }
    }
  };

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <p>Loading physical examination questions...</p>
      </div>
    );
  }

  const selectedAnswer = answers[currentQuestion.id];
  const capturedImages =
    (answers[`${currentQuestion.id}_images`] as string[]) || [];

  return (
    <div>
      <QuestionLoader
        question={currentQuestion.text}
        questionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        onNextQuestion={goToNextQuestion}
        showAsterisk={false}
        physicalExamQuestion={currentQuestion}
        selectedAnswer={selectedAnswer}
        onAnswerSelect={handleAnswerSelect}
        onImageCapture={(imageData: string) =>
          handleImageCapture(currentQuestion.id, imageData)
        }
        onImageRemove={(imageIndex: number) =>
          handleImageRemove(currentQuestion.id, imageIndex)
        }
        capturedImages={capturedImages}
      />

      {/* For multi-choice questions, show a Next button */}
      {currentQuestion.multiChoice && (
        <div className="mt-6 flex justify-end">
          <AyuButton
            type="button"
            variant="primary"
            onClick={() => {
              if (isLastQuestion) {
                // TODO: FOR TESTING PURPOSE ONLY - VALIDATION COMMENTED OUT
                // TODO: REVERT THIS LATER TO ENABLE REQUIRED FIELD VALIDATION
                // if (!validation.isValid) {
                //   alert(
                //     `Please answer all required questions:\n${validation.missingQuestions.join('\n')}`
                //   );
                //   return;
                // }
                alert('Physical examination completed!');
              } else {
                goToNextQuestion();
              }
            }}
            className="w-full md:w-[15%]"
          >
            <span className="mx-auto w-full text-base">
              {isLastQuestion ? 'Confirm' : 'Next'}
            </span>
          </AyuButton>
        </div>
      )}
    </div>
  );
};
