import { getDisabledLocationIdentitiesFor } from '../../../../ayu-library/logic/option-dependency.logic';
import { componentMap } from '../../../pages/component-map';
import { resolveAyuComponent } from '../../../pages/decision-matrix';
import type { AyuRendererBaseProps } from '../../../../ayu-library/types/ayu-renderer-props.types';
export const AyuRenderer = ({
  question,
  parent,
  previousSibling,
  value,
  onChange,
  answers,
  setAnswer,
  q1LocationSelections,
  q2LocationSelections,
}: AyuRendererBaseProps) => {
  if (!question) return null;

  const type = resolveAyuComponent(question);
  const Component = componentMap[type as keyof typeof componentMap];

  return (
    <Component
      question={question}
      parent={parent}
      previousSibling={previousSibling}
      value={value}
      onChange={onChange}
      answers={answers || {}}
      setAnswer={(question, value) => setAnswer?.(question, value)}
      disabledOptionIdentities={getDisabledLocationIdentitiesFor(
        question,
        q1LocationSelections ?? new Set(),
        q2LocationSelections ?? new Set()
      )}
    />
  );
};
