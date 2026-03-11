import type { AyuQuestion } from '../../../ayu-library/types/ayu.types';

export function AyuDisplayText({ question }: { question?: AyuQuestion }) {
  return (
    <p className="text-gray-600 text-sm whitespace-pre-line">
      {question?.text}
    </p>
  );
}
