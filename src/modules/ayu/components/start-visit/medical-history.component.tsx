import { useNavigate } from 'react-router-dom';
import type { SectionProps } from '../../types/start-visit.types';
import AyuButton from '../common/ayu-button.component';
import { QuestionLoader } from '../loaders/question-loader.component';
const TOTAL_QUESTIONS = 5;

export const MedicalHistory = ({
  questionIndex,
  onNextQuestion,
  onPrevQuestion,
  onPrevSection,
}: SectionProps) => {
  const isFirstQuestion = questionIndex === 0;
  const isLastQuestion = questionIndex === TOTAL_QUESTIONS - 1;
  const navigate = useNavigate();

  const goToDetails = () => {
    navigate('/ayu/renders');
  };

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
          onClick={isLastQuestion ? goToDetails : onNextQuestion}
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
