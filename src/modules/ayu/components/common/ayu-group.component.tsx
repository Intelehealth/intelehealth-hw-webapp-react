import type { AyuQuestion } from '../../../ayu-library/types/ayu.types';
import { AyuRenderer } from '../start-visit/visit-reason/ayu-renderer.component';

export function AyuGroup({ question }: { question?: AyuQuestion }) {
  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-md border border-gray-200">
      {question?.text && (
        <h3 className="font-semibold text-lg">{question?.text}</h3>
      )}

      {question?.item?.map((child, index, arr) => (
        <AyuRenderer
          key={child.linkId}
          question={child}
          parent={question}
          previousSibling={index > 0 ? arr[index - 1] : undefined}
        />
      ))}
    </div>
  );
}
