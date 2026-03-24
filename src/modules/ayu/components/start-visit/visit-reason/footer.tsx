import iconRightArrow from '../../../assets/arrow-right.svg';
import { BUTTON_BACK, BUTTON_NEXT } from '../../../utils/ayu.constants';
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

  onNextQuestion,
  onPrevQuestion,
  onPrevSection,
  isNextDisabled = false,
}: Props) => {
  const isFirst = questionIndex === 0;

  return (
    <div className="flex gap-3 md:justify-end">
      <AyuButton
        variant="primarylight"
        onClick={isFirst ? onPrevSection : onPrevQuestion}
      >
        {BUTTON_BACK}
      </AyuButton>

      <AyuButton
        variant="primary"
        size="sm"
        rightIcon={<img src={iconRightArrow} alt="yes" />}
        disabled={isNextDisabled}
        onClick={onNextQuestion}
      >
        {BUTTON_NEXT}
      </AyuButton>
    </div>
  );
};
