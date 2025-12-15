import React from 'react';
import type { AyuQuestion } from '../types/ayu.types';

interface Props {
  question: AyuQuestion;
}

const AyuTextField: React.FC<Props> = ({ question }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {question.title}
      </label>
      <input
        className="block p-2 border rounded-md"
        type="text"
        placeholder={question.placeholder ?? ''}
        aria-label={question.title}
      />
    </div>
  );
};

export default AyuTextField;
