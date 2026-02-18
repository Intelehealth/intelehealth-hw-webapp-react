import type { SideLoaderProps } from './loader.types';

export const SideLoader = ({
  sections,
  currentSectionIndex,
  currentQuestionIndex,
}: SideLoaderProps) => {
  const totalQuestions = sections[currentSectionIndex]?.totalQuestions || 0;
  return (
    <div className="fixed right-12 top-1/2 -translate-y-1/2 flex flex-col gap-3">
      {Array.from({ length: totalQuestions }).map((_, index) => {
        const isActive = index === currentQuestionIndex;
        return (
          <span
            key={index}
            className={`
              w-1.5 h-1.5 rounded-full transition-colors duration-200
              ${isActive ? 'bg-emerald-500' : 'bg-emerald-100'}
            `}
          />
        );
      })}
    </div>
  );
};
