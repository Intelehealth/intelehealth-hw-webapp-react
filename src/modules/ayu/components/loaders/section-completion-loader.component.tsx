import type { SectionCompletionLoaderProps } from './loader.types';

export const SectionCompletionLoader = ({
  sections,
  currentSectionIndex,
}: SectionCompletionLoaderProps) => {
  const section = sections[currentSectionIndex];
  const total = section?.totalQuestions || 1;
  const answered = section?.answeredQuestions || 0;
  const progress = Math.round(Math.min((answered / total) * 100, 100));

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
          Assessment Progress
        </span>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          LIVE
        </span>
        <span className="ml-auto text-lg font-semibold text-gray-700 whitespace-nowrap">
          {progress}
          <span className="ml-0.5 text-xs font-normal text-gray-400">%</span>
        </span>
      </div>
      <div className="h-[6px] w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
