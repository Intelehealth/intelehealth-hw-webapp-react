import type { SectionCompletionLoaderProps } from './loader.types';

export const SectionCompletionLoader = ({
  sections,
  currentSectionIndex,
  currentQuestionIndex,
}: SectionCompletionLoaderProps) => {
  return (
    <div className="flex w-full gap-2">
      {sections.map((section, index) => {
        let width = '0%';

        const isCompleted = section.answeredQuestions >= section.totalQuestions;

        if (isCompleted) {
          width = '100%';
        } else if (index === currentSectionIndex) {
          width = `${Math.min(
            ((currentQuestionIndex + 1) / section.totalQuestions) * 100,
            100
          )}%`;
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
