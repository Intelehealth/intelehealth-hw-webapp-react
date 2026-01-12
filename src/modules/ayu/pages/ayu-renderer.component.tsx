import type { AyuRendererBaseProps } from '../types/ayu-renderer-props.types';
import { componentMap } from './component-map';
import { resolveAyuComponent } from './decision-matrix';
export function AyuRenderer({
  question,
  parent,
  previousSibling,
}: AyuRendererBaseProps) {
  const type = resolveAyuComponent(question);
  const Component = componentMap[type];

  return (
    <Component
      question={question}
      parent={parent}
      previousSibling={previousSibling}
    />
  );
}
