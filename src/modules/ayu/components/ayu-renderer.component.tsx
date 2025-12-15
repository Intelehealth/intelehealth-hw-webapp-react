import React from 'react';
import type { AyuQuestion, AyuSchema } from '../types/ayu.types';
import AyuSelect from './ayu-select.component';
import AyuTextField from './ayu-text-field.component';

interface Props {
  schema: AyuSchema;
}

const AyuRenderer: React.FC<Props> = ({ schema }) => {
  const renderQuestion = (q: AyuQuestion) => {
    switch (q.input_type) {
      case 'text':
        return <AyuTextField key={q.id} question={q} />;
      case 'select':
        return <AyuSelect key={q.id} question={q} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full mt-4">{schema.questions.map(renderQuestion)}</div>
  );
};

export default AyuRenderer;
