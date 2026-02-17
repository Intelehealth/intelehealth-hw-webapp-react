import type { SectionCompletionLoaderProps } from './loader.types';

export const SectionCompletionLoader = ({
  sections,
  currentSectionIndex,
}: SectionCompletionLoaderProps) => {
  return (
    <div className="flex w-full gap-2">
      {sections.map((section, index) => {
        let width = '0%';

        const total = section.totalQuestions || 1;
        const answered = section.answeredQuestions || 0;

        const progress = Math.min((answered / total) * 100, 100);

        if (answered >= total) {
          width = '100%';
        } else if (index === currentSectionIndex) {
          width = `${progress}%`;
        }

        return (
          <div
            key={index}
            className="flex-1 h-[3px] rounded bg-gray-200 overflow-hidden"
          >
            <div
              className="h-full bg-emerald-400 transition-all duration-300 ease-out"
              style={{ width }}
            />
          </div>
        );
      })}
    </div>
  );
};
