import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncomingCallContext } from '../../context/IncomingCallContext';
import ROUTES from '../../routes/paths';

const formatCallDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const VideoCallPage = () => {
  const navigate = useNavigate();
  const { activeCall, isActiveCallOpen, endActiveCall, minimizeCall } =
    useIncomingCallContext();
  const [callSeconds, setCallSeconds] = useState(0);

  useEffect(() => {
    if (!isActiveCallOpen || !activeCall) {
      navigate(ROUTES.DASHBOARD, { replace: true });
      return;
    }

    const timer = globalThis.setInterval(() => {
      setCallSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      globalThis.clearInterval(timer);
      setCallSeconds(0);
    };
  }, [activeCall, isActiveCallOpen, navigate]);

  if (!activeCall || !isActiveCallOpen) {
    return null;
  }

  const { callerName } = activeCall;

  const handleEndCall = () => {
    endActiveCall();
    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  return (
    <div className="h-full w-full overflow-hidden bg-slate-950">
      <div className="relative h-full w-full bg-slate-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950/90" />
        <div className="absolute left-8 top-8 rounded-[28px] bg-slate-950/80 px-5 py-4 text-white shadow-2xl">
          <p className="text-sm font-semibold">Dr. {callerName}</p>
          <p className="mt-1 text-xs text-slate-300">General Physician</p>
        </div>
        <div className="absolute left-1/2 top-8 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm">
          {formatCallDuration(callSeconds)}
        </div>

        <div className="absolute right-8 top-2 w-72 overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-2xl">
          <div className="h-36 bg-slate-200" />
          <div className="border-t border-white/10 bg-white/90 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">You</p>
          </div>
        </div>

        <button
          type="button"
          onClick={minimizeCall}
          aria-label="Minimize call"
          className={
            'absolute bottom-8 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white'
          }
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 14H10V20M20 10H14V4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full px-4 py-3 shadow-2xl">
          <button
            type="button"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
            onClick={handleEndCall}
            aria-label="End call"
          >
            <svg
              width="24"
              height="24"
              fill="#000000"
              viewBox="0 0 32 32"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              transform="rotate(45)"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                {' '}
                <path d="M30.053 6.236c0 0.033-0.003 0.060-0.007 0.082-0.817 0.563-5.389 3.582-6.243 4.13-0.090 0.002-0.318-0.028-0.644-0.2-0.348-0.182-1.361-0.751-2.777-1.559l-1.102-0.629-1.039 0.729c-0.773 0.544-2.452 1.838-5.009 4.394-2.568 2.567-3.858 4.241-4.399 5.011l-0.729 1.039 0.63 1.102c0.611 1.069 1.342 2.36 1.563 2.779 0.178 0.337 0.191 0.567 0.191 0.63 0 0.010 0 0.019-0.001 0.026-0.48 0.765-3.581 5.436-4.146 6.26-0.080 0.014-0.254 0.001-0.471-0.151-1.758-1.269-3.592-3.070-3.856-3.775 0.176-3.751 3.473-9.014 9.299-14.84s11.085-9.121 14.824-9.295c0.707 0.253 2.52 2.088 3.779 3.829 0.088 0.129 0.14 0.288 0.14 0.437zM31.991 6.236c0-0.529-0.16-1.091-0.499-1.578-0.033-0.047-3.383-4.753-5.323-4.691-5.451 0.173-11.857 5.471-16.272 9.883s-9.713 10.819-9.887 16.292v0.045c0 1.916 4.646 5.284 4.692 5.316 1.263 0.884 2.653 0.562 3.217-0.243 0.344-0.489 3.905-5.846 4.306-6.502 0.175-0.286 0.261-0.635 0.261-1.014 0-0.489-0.143-1.032-0.421-1.561-0.271-0.515-1.16-2.077-1.596-2.841 0.473-0.673 1.684-2.254 4.177-4.745 2.474-2.476 4.068-3.697 4.745-4.173 0.764 0.435 2.325 1.323 2.839 1.593 0.969 0.511 1.936 0.57 2.589 0.155 0.615-0.389 5.931-3.937 6.438-4.303 0.477-0.346 0.735-0.964 0.735-1.634z"></path>{' '}
              </g>
            </svg>
          </button>
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
            aria-label="Mute microphone"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 14C14.2091 14 16 12.2091 16 10V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V10C8 12.2091 9.79086 14 12 14Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M19 10C19 13.866 15.866 17 12 17C8.13401 17 5 13.866 5 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M12 17V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
            aria-label="Toggle camera"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 7A2 2 0 0 1 7 5H15A2 2 0 0 1 17 7V17A2 2 0 0 1 15 19H7A2 2 0 0 1 5 17V7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M17 8L21 5V19L17 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
            aria-label="Open chat"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 15C21 16.6569 19.6569 18 18 18H8L3 23V6C3 4.34315 4.34315 3 6 3H18C19.6569 3 21 4.34315 21 6V15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
