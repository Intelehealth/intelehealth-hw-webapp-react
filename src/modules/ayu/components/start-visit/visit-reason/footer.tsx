import {
  BUTTON_BACK,
  BUTTON_START_ASSESSMENT,
} from '../../../utils/ayu.constants';
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
    <div className="border-t-2 border-[#EFE8FF] flex gap-3 md:justify-end">
      <AyuButton
        variant="primarylight"
        className="mt-3"
        onClick={isFirst ? onPrevSection : onPrevQuestion}
      >
        <span className="mx-auto w-full text-lg">{BUTTON_BACK}</span>
      </AyuButton>

      <AyuButton
        variant="primary"
        size="md"
        className="mt-3"
        disabled={isNextDisabled}
        onClick={onNextQuestion}
      >
        <span className="mx-auto w-full text-lg">
          {BUTTON_START_ASSESSMENT}
        </span>
      </AyuButton>
    </div>
  );
};
