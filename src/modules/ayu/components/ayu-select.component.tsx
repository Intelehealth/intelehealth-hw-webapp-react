import React from 'react';
import type { AyuQuestion } from '../types/ayu.types';

interface Props {
  question: AyuQuestion;
}

const AyuSelect: React.FC<Props> = ({ question }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-500 mb-1">
        {question.title}
      </label>
      <select
        className="block p-2 border rounded-md"
        aria-label={question.title}
      >
        <option value="">-- Select --</option>
        {question.options?.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AyuSelect;
