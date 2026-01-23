import type { AyuQuestion } from './ayu.types';

export interface AyuRendererBaseProps {
  question: AyuQuestion;
  parent?: AyuQuestion;
  previousSibling?: AyuQuestion;
}
