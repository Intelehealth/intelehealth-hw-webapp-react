import type { AyuAnswerValue, AyuQuestion } from './ayu.types';

export interface AyuRendererBaseProps {
  question?: AyuQuestion;
  parent?: AyuQuestion;
  previousSibling?: AyuQuestion;
  value?: AyuAnswerValue;
  onChange?: (value: AyuAnswerValue) => void;
  answers?: Record<string, AyuAnswerValue>;
  setAnswer?: (question: AyuQuestion, value: AyuAnswerValue) => void;
  /** Normalized location identifiers (see getOptionLocationIdentity) that
   *  must render disabled on `question` — resolved per-question by
   *  AyuRenderer from q1LocationSelections/q2LocationSelections below.
   *  Leaf components (e.g. AyuSelectableOptionGroup) consume this directly. */
  disabledOptionIdentities?: Set<string>;
  /** Locations currently selected on "Which part of the abdomen do you feel
   *  pain?" (Question 1) — used by AyuRenderer to disable their match on
   *  "Pain radiates to" (Question 2), never on Question 1 itself. */
  q1LocationSelections?: ReadonlySet<string>;
  /** Locations currently selected on "Pain radiates to" (Question 2) — used
   *  by AyuRenderer to disable their match on Question 1, never on Question
   *  2 itself. */
  q2LocationSelections?: ReadonlySet<string>;
}
