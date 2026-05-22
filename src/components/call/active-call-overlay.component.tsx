import { useEffect, useState } from 'react';
import type { ActiveCallOverlayProps } from '../../types/incoming-call.types';

const formatCallDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const ActiveCallOverlay = ({
  open,
  callerName,
  patientName,
  visitId,
  onEndCall,
}: ActiveCallOverlayProps) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);

  useEffect(() => {
    if (!open) {
      setCallSeconds(0);
      return;
    }

    const timer = globalThis.setInterval(() => {
      setCallSeconds(prev => prev + 1);
    }, 1000);

    return () => globalThis.clearInterval(timer);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-300 overflow-hidden rounded-4xl bg-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Telemedicine call
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {callerName} · {patientName}
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            In call · {formatCallDuration(callSeconds)}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 px-8 py-6">
          <div className="col-span-8 relative overflow-hidden rounded-4xl bg-slate-900 text-white shadow-xl">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(15,23,42,0.22)_40%,rgba(15,23,42,0.48)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.28),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.22),transparent_24%)]" />

            <div className="absolute left-6 top-6 flex flex-col rounded-3xl bg-slate-950/90 px-4 py-3 text-sm text-slate-100 shadow-lg">
              <span className="font-semibold">Dr. {callerName}</span>
              <span className="text-xs text-slate-300">General Physician</span>
            </div>

            <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/10 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              Live
            </div>

            <div className="absolute left-6 bottom-6 rounded-[28px] bg-slate-950/80 px-5 py-4 text-white shadow-2xl">
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-300">
                Patient
              </p>
              <p className="mt-2 text-lg font-semibold">{patientName}</p>
              <p className="text-sm text-slate-300">Visit #{visitId}</p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="flex h-56 w-full max-w-130 flex-col items-center justify-center rounded-[40px] border border-white/10 bg-white/10 text-center text-white/90 shadow-2xl backdrop-blur-sm">
                <div className="mb-3 h-16 w-16 rounded-full bg-white/15" />
                <p className="text-xl font-semibold">Live video</p>
                <p className="mt-2 text-sm text-slate-300">
                  Doctor is connected
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
                  You
                </div>
                <div>
                  <p className="text-sm text-slate-500">Your video</p>
                  <p className="font-semibold text-slate-900">Self view</p>
                </div>
              </div>
              <div className="h-52 bg-slate-100" />
            </div>

            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Call details
              </p>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Doctor</span>
                  <span className="font-semibold text-slate-900">
                    {callerName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Patient</span>
                  <span className="font-semibold text-slate-900">
                    {patientName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Visit</span>
                  <span className="font-semibold text-slate-900">
                    #{visitId}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-8 py-6">
          <div className="mx-auto flex w-fit items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMicOn(prev => !prev)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
              aria-label="Toggle microphone"
            >
              {isMicOn ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 14a3.989 3.989 0 0 0 3.285-1.743"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7.5 10A4.5 4.5 0 0 0 16.5 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 19v-3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 4h8v6a4 4 0 0 1-8 0V4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 4h8v6a4 4 0 0 1-8 0V4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 14a3.989 3.989 0 0 0 3.285-1.743"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 4l16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsVideoOn(prev => !prev)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
              aria-label="Toggle video"
            >
              {isVideoOn ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M15 9l6-4v14l-6-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 4l16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={onEndCall}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
              aria-label="End call"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 13.5c1.5 2 3.5 3.5 6.5 3.5s5-1.5 6.5-3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M7.5 10.5c1.5-2 3.5-3.5 6.5-3.5s5 1.5 6.5 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveCallOverlay;
