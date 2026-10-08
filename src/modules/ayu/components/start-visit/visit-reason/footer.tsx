import { createPortal } from 'react-dom';
import {
  BUTTON_BACK,
  BUTTON_START_ASSESSMENT,
} from '../../../utils/ayu.constants';
import AyuButton from '../../common/ayu-button.component';
import { useHeaderActionsSlot } from '../header-actions-slot.context';

interface Props {
  questionIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onPrevSection?: () => void;
  isNextDisabled?: boolean;
  /** False while another section is on screen; the header slot is shared, so a
   *  hidden section must not portal its actions into it. */
  isActive?: boolean;
}

export const VisitReasonFooter = ({
  questionIndex,

  onNextQuestion,
  onPrevQuestion,
  onPrevSection,
  isNextDisabled = false,
  isActive = true,
}: Props) => {
  const isFirst = questionIndex === 0;
  const headerSlot = useHeaderActionsSlot();

  const actions = (
    <div className="flex gap-3 justify-end">
      <AyuButton
        variant="primarylight"
        onClick={isFirst ? onPrevSection : onPrevQuestion}
      >
        <span className="mx-auto w-full text-lg">{BUTTON_BACK}</span>
      </AyuButton>

      <AyuButton
        variant="primary"
        size="md"
        disabled={isNextDisabled}
        onClick={onNextQuestion}
      >
        <span className="mx-auto w-full text-lg">
          {BUTTON_START_ASSESSMENT}
        </span>
      </AyuButton>
    </div>
  );

  // Share the step-label row instead of taking one of our own. Falls back to
  // rendering in place when there is no header to portal into.
  if (headerSlot) {
    return isActive ? createPortal(actions, headerSlot) : null;
  }

  return <div className="border-b border-gray-200 pb-3">{actions}</div>;
};
