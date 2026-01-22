import { useAyuJsonList } from '../../hooks/useAyuJson';
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

  const ayuJsonList = useAyuJsonList('test_Protocols');
  const names = ayuJsonList.map(item => item.name.replace(/\.json$/i, ''));
  return (
    <div>
      <div className="flex gap-2 items-center">
        <QuestionLoader
          question="What is the reason for this visit?"
          questionIndex={questionIndex}
          totalQuestions={TOTAL_QUESTIONS}
          onNextQuestion={onNextQuestion}
        />
      </div>

      <div className="pt-3 flex flex-wrap gap-3">
        {names.map(name => (
          <button
            key={name}
            className="px-4 py-2 rounded-lg border border-emerald-400
                       text-emerald-500 bg-emerald-20
                       hover:bg-emerald-100 transition"
          >
            {name}
          </button>
        ))}
      </div>
      <div className="mt-6 gap-3 md:justify-end flex my-4 md:mb-0">
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
