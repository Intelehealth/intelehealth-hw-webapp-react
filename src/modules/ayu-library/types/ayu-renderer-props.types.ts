import type { AyuAnswerValue, AyuQuestion } from './ayu.types';

export interface AyuRendererBaseProps {
  question?: AyuQuestion;
  parent?: AyuQuestion;
  previousSibling?: AyuQuestion;
  value?: AyuAnswerValue;
  onChange?: (value: AyuAnswerValue) => void;
  answers?: Record<string, AyuAnswerValue>;
  setAnswer?: (question: AyuQuestion, value: AyuAnswerValue) => void;
}
