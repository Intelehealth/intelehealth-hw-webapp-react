import AyuButton from '../../common/ayu-button.component';

interface Props {
  questionIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onPrevSection?: () => void;
}

export const VisitReasonFooter = ({
  questionIndex,
  totalQuestions,
  onNextQuestion,
  onPrevQuestion,
  onPrevSection,
}: Props) => {
  const isFirst = questionIndex === 0;
  const isLast = questionIndex === totalQuestions - 1;

  return (
    <div className="mt-8 flex gap-3 justify-end">
      <AyuButton
        variant="secondary"
        onClick={isFirst ? onPrevSection : onPrevQuestion}
        className="w-[120px]"
      >
        Back
      </AyuButton>

      <AyuButton
        variant="primary"
        onClick={onNextQuestion}
        className="w-[120px]"
      >
        {isLast ? 'Confirm' : 'Next'}
      </AyuButton>
    </div>
  );
};
