import iconQuestionMark from '../../../ayu/assets/icon-ayu.svg';

export const QuestionLoader = () => {
  return (
    <div className="">
      <img
        src={iconQuestionMark}
        className="object-cover rounded-full mb-4 pl-1"
        alt="Ayu Loader"
      />
      <div className="relative inline-flex flex-col items-center">
        {/* Bigger triangle */}
        <svg
          width="20"
          height="10"
          viewBox="0 0 20 10"
          className="absolute -top-2 left-4 text-emerald-50"
        >
          <path
            d="M0 10 C5 10 7.5 0 10 0 C12.5 0 15 10 20 10 Z"
            fill="currentColor"
          />
        </svg>

        {/* Bigger bubble */}
        <div className="px-3 py-3 rounded-md bg-emerald-50 flex items-center justify-center">
          <div className="flex gap-3">
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
    </div>
  );
};
