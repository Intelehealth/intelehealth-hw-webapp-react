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
      {/* TOP ROW: ICON + QUESTION COUNT */}
      <div className="flex items-start gap-3">
        {/* ICON */}
        <div className="flex flex-col items-center">
          <img
            src={iconQuestionMark}
            className="w-10 h-10"
            alt="Question Icon"
          />

          {/* TRIANGLE */}
          <svg
            width="18"
            height="9"
            viewBox="0 0 20 10"
            className="mt-1 text-emerald-50"
          >
            <path
              d="M0 10 C5 10 7.5 0 10 0 C12.5 0 15 10 20 10 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* QUESTION COUNT */}
        <p className="pt-2 text-sm font-medium text-[#2e1e91]">
          {isShowQuestionNumber &&
            `${questionIndex + 1} of ${totalQuestions} questions`}
        </p>
      </div>

      {/* GREEN COMMENT BOX (FULL WIDTH) */}
      <div className="bg-emerald-50 rounded-lg px-2 py-2 min-h-[96px]">
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
            <p className="text-base font-medium text-gray-900">
              {/* {question} */}
              {/* {question && <span className="text-red-500">*</span>} */}
            </p>
            {/* CHILD UI */}
            <>{children}</>
          </>
        )}
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
