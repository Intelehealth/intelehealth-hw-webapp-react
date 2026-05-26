import type { AyuQuestion } from '../../../ayu-library/types/ayu.types';
import { getRowLabel } from '../../../ayu-library/utils/question.utils';

export function AyuDisplayText({ question }: { question?: AyuQuestion }) {
  return (
    <p className="text-gray-600 text-sm whitespace-pre-line">
      {getRowLabel(question)}
    </p>
  );
}
