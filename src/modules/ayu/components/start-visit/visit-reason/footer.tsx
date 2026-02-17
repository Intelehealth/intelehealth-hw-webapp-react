import AyuButton from '../../common/ayu-button.component';

interface Props {
  questionIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onPrevSection?: () => void;
  isNextDisabled?: boolean;
}

export const VisitReasonFooter = ({
  questionIndex,
  totalQuestions,
  onNextQuestion,
  onPrevQuestion,
  onPrevSection,
  isNextDisabled = false,
}: Props) => {
  const isFirst = questionIndex === 0;
  const isLast = questionIndex === totalQuestions - 1;

  return (
    <div className="flex gap-3 md:justify-end">
      <AyuButton
        variant="primarylight"
        onClick={isFirst ? onPrevSection : onPrevQuestion}
        className="w-[120px]"
      >
        Back
      </AyuButton>

      <AyuButton
        variant="primary"
        disabled={isNextDisabled}
        onClick={onNextQuestion}
        className="w-[120px] border-0"
      >
        {isLast ? 'Confirm' : 'Next'}
      </AyuButton>
    </div>
  );
};
