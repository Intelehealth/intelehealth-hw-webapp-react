import type { AyuQuestion } from '../../types/ayu.types';

export function AyuDisplayText({ question }: { question: AyuQuestion }) {
  return <p className="text-gray-600 text-sm">{question.text}</p>;
}
