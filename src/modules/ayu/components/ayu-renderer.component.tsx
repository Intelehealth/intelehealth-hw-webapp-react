import { componentMap } from '../pages/component-map';
import { resolveAyuComponent } from '../pages/decision-matrix';
import type { AyuRendererBaseProps } from '../types/ayu-renderer-props.types';
export const AyuRenderer = ({
  question,
  parent,
  previousSibling,
}: AyuRendererBaseProps) => {
  const type = resolveAyuComponent(question);
  const Component = componentMap[type];

  return (
    <Component
      question={question}
      parent={parent}
      previousSibling={previousSibling}
    />
  );
};
