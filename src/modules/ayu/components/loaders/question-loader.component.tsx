import iconQuestionMark from '../../../ayu/assets/icon-ayu.svg';
import type { SectionProps } from '../../types/start-visit.types';

interface QuestionLoaderProps extends SectionProps {
  totalQuestions: number;
}

export const QuestionLoader = ({
  questionIndex,
  totalQuestions,
}: QuestionLoaderProps) => {
  return (
    <div className="flex items-start">
      {/* LEFT: Icon + Loader */}
      <div className="flex flex-col items-center">
        <img
          src={iconQuestionMark}
          className="w-10 h-10 object-cover mb-1"
          alt="Ayu Loader"
        />

        <div className="relative inline-flex flex-col items-center">
          {/* Triangle */}
          <svg
            width="20"
            height="10"
            viewBox="0 0 20 10"
            className="-top-2 text-emerald-50"
          >
            <path
              d="M0 10 C5 10 7.5 0 10 0 C12.5 0 15 10 20 10 Z"
              fill="currentColor"
            />
          </svg>

          {/* Bubble */}
          <div className="px-2 py-3 rounded-md bg-emerald-50">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  style={{
                    animation: 'dotBounce 1.4s infinite ease-in-out both',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Text */}
      <div className="pt-2">
        <span
          className="text-sm font-medium text-gray-800"
          style={{ color: '#2e1e91' }}
        >
          {questionIndex + 1} of {totalQuestions} questions
        </span>
      </div>

      {/* Animation */}
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
