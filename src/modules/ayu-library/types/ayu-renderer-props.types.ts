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
   *  must render disabled on `question` — currently only the abdominal
   *  locations already selected on "Which part of the abdomen do you feel
   *  pain?", wherever that question occurs. */
  disabledOptionIdentities?: Set<string>;
}
