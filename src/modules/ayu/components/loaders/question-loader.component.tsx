import { useEffect, useState } from 'react';
import iconQuestionMark from '../../../ayu/assets/icon-ayu.svg';

interface QuestionLoaderProps {
  question?: string;
  questionIndex: number;
  totalQuestions: number;
  isShowQuestionNumber?: boolean;
  children?: React.ReactNode; // Inject input/UI here
}

export const QuestionLoader = ({
  questionIndex,
  totalQuestions,
  children,
  isShowQuestionNumber = true,
}: QuestionLoaderProps) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [questionIndex]);

  return (
    <div className="w-full max-w-[950px]">
      {/* SINGLE ROW: ICON + (question count + green box) */}
      <div className="mt-2 flex items-start gap-10">
        {/* ICON */}
        <div className="shrink-0">
          <img
            src={iconQuestionMark}
            className="w-10 h-10"
            alt="Question Icon"
          />
        </div>

        {/* RIGHT COLUMN: question count (optional) + green box */}
        <div className="flex-1 min-w-0">
          <div className="shadow-[0px_4px_10px_0px_#3B3B3B0D] bg-[#E5FFF3] rounded-lg border-[1px] border-[#0FD197] px-4 py-2 min-h-[96px]">
            {loading ? (
              <div className="flex gap-2 items-center  px-5 py-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                    style={{
                      animation: 'dotBounce 1.4s infinite ease-in-out both',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <>
                {isShowQuestionNumber && (
                  <p className="text-sm font-medium text-[#2e1e91] mb-1">
                    {`Question ${questionIndex + 1}/${totalQuestions}`}
                  </p>
                )}
                {/* CHILD UI */}
                <>{children}</>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ANIMATION */}
      <style>
        {`
          @keyframes dotBounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};
