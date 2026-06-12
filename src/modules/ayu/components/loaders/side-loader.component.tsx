import type { SideLoaderProps } from './loader.types';

export const SideLoader = ({
  sections,
  currentSectionIndex,
  currentQuestionIndex,
}: SideLoaderProps) => {
  const totalQuestions = sections[currentSectionIndex]?.totalQuestions || 0;
  const gapClass = totalQuestions > 12 ? 'gap-1.5' : 'gap-3';
  return (
    <div
      className={`fixed right-12 top-60 bottom-8 flex flex-col items-center justify-center ${gapClass} overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]`}
    >
      {Array.from({ length: totalQuestions }).map((_, index) => {
        const isActive = index === currentQuestionIndex;
        return (
          <span
            key={index}
            className={`
              w-1.5 h-1.5 shrink-0 rounded-full transition-colors duration-200
              ${isActive ? 'bg-emerald-500' : 'bg-emerald-100'}
            `}
          />
        );
      })}
    </div>
  );
};
