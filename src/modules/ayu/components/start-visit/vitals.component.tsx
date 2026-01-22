import type { SectionProps } from '../../types/start-visit.types';
import AyuButton from '../common/ayu-button.component';
import { QuestionLoader } from '../loaders/question-loader.component';

const TOTAL_QUESTIONS = 10;

export const Vitals = ({ questionIndex, onNextQuestion }: SectionProps) => {
  const isLast = questionIndex === TOTAL_QUESTIONS - 1;

  return (
    <div>
      <div className="flex gap-2 items-center">
        <QuestionLoader
          question="Since when have you had this symptom?"
          questionIndex={questionIndex}
          totalQuestions={TOTAL_QUESTIONS}
          onNextQuestion={onNextQuestion}
        />
      </div>

      <div className="flex gap-3 md:justify-end my-4">
        {isLast ? (
          <AyuButton
            variant="primary"
            className="w-full md:w-[10%]"
            type="submit"
            onClick={onNextQuestion}
          >
            <span className="mx-auto w-full text-base">Confirm</span>
          </AyuButton>
        ) : (
          <AyuButton
            type="button"
            variant="primary"
            size="md"
            onClick={onNextQuestion}
            className="w-full md:w-[10%]"
          >
            <span className="mx-auto w-full text-base">Next</span>
          </AyuButton>
        )}
      </div>
    </div>
  );
};
