import AyuButton from '../common/ayu-button.component';
import { QuestionLoader } from '../loaders/question-loader.component';

interface SectionProps {
  questionIndex: number;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onNextSection?: () => void;
  onPrevSection?: () => void;
}

export const VisitReason = ({
  questionIndex,
  onNextQuestion,
  onPrevQuestion,
  onPrevSection,
}: SectionProps) => {
  const TOTAL_QUESTIONS = 6;

  const isFirstQuestion = questionIndex === 0;
  const isLastQuestion = questionIndex === TOTAL_QUESTIONS - 1;

  return (
    <div>
      <div className="flex gap-2 items-center">
        <QuestionLoader
          questionIndex={questionIndex}
          totalQuestions={TOTAL_QUESTIONS}
          onNextQuestion={onNextQuestion}
        />
      </div>

      <div className="mt-6 gap-3 md:justify-end flex my-4">
        {/* Back logic */}
        <AyuButton
          type="button"
          variant="secondary"
          onClick={isFirstQuestion ? onPrevSection : onPrevQuestion}
          className="w-full md:w-[10%]"
        >
          <span className="mx-auto w-full text-base">Back</span>
        </AyuButton>

        {/* Next logic */}
        <AyuButton
          type="submit"
          variant="primary"
          onClick={onNextQuestion}
          className="w-full md:w-[10%]"
        >
          <span className="mx-auto w-full text-base">
            {isLastQuestion ? 'Confirm' : 'Next'}
          </span>
        </AyuButton>
      </div>
    </div>
  );
};
