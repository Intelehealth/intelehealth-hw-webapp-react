import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconCallChatActive from '../../assets/icons/icon-call-chat-active.svg';
import iconCallChat from '../../assets/icons/icon-call-chat.svg';
import iconCallEnd from '../../assets/icons/icon-call-end.svg';
import iconCallMicOff from '../../assets/icons/icon-call-mic-off.svg';
import iconCallMicOn from '../../assets/icons/icon-call-mic-on.svg';
import iconCallVideoOff from '../../assets/icons/icon-call-video-off.svg';
import iconCallVideoOn from '../../assets/icons/icon-call-video-on.svg';
import iconMinimize from '../../assets/icons/icon-minimize.svg';
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
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
        <div className="absolute left-3 top-3 max-w-[55%] rounded-2xl bg-slate-950/80 px-3 py-2 text-white shadow-2xl sm:left-8 sm:top-8 sm:max-w-none sm:rounded-[28px] sm:px-5 sm:py-4">
          <p className="truncate text-xs font-semibold sm:text-sm">
            Dr. {callerName}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-300 sm:mt-1 sm:text-xs">
            General Physician
          </p>
        </div>
        <div className="absolute left-1/2 bottom-32 -translate-x-1/2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm sm:bottom-auto sm:top-8 sm:px-4 sm:py-2 sm:text-sm">
          {formatCallDuration(callSeconds)}
        </div>

        <div className="absolute right-3 top-3 w-28 overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl sm:right-8 sm:top-2 sm:w-72 sm:rounded-4xl">
          <div className="h-20 bg-slate-200 sm:h-36" />
          <div className="border-t border-white/10 bg-white/90 px-2 py-1.5 text-xs text-slate-600 sm:px-4 sm:py-3 sm:text-sm">
            <p className="font-semibold text-slate-900">You</p>
          </div>
        </div>

        <button
          type="button"
          onClick={minimizeCall}
          aria-label="Minimize call"
          className="absolute bottom-28 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white sm:right-8 sm:bottom-12 sm:h-12 sm:w-12"
        >
          <img src={iconMinimize} alt="" className="h-5 w-5" />
        </button>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-2 py-2 shadow-2xl sm:bottom-8 sm:gap-4 sm:px-4 sm:py-3">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 sm:h-16 sm:w-16"
            onClick={handleEndCall}
            aria-label="End call"
          >
            <img src={iconCallEnd} alt="" className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setIsMicOn(prev => !prev)}
            aria-pressed={!isMicOn}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition sm:h-14 sm:w-14 ${
              isMicOn
                ? 'bg-white text-slate-700 hover:bg-slate-100'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            <img
              src={isMicOn ? iconCallMicOn : iconCallMicOff}
              alt=""
              className="h-5 w-5"
            />
          </button>

          <button
            type="button"
            onClick={() => setIsVideoOn(prev => !prev)}
            aria-pressed={!isVideoOn}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition sm:h-14 sm:w-14 ${
              isVideoOn
                ? 'bg-white text-slate-700 hover:bg-slate-100'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            aria-label={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            <img
              src={isVideoOn ? iconCallVideoOn : iconCallVideoOff}
              alt=""
              className="h-5 w-5"
            />
          </button>
          <button
            type="button"
            onClick={() => setIsChatOpen(prev => !prev)}
            aria-pressed={isChatOpen}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition sm:h-14 sm:w-14 ${
              isChatOpen
                ? 'bg-[#2C22B5] text-white hover:brightness-110'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
            aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
          >
            <img
              src={isChatOpen ? iconCallChatActive : iconCallChat}
              alt=""
              className="h-5 w-5"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
