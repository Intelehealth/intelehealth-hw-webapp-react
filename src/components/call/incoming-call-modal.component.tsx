import type { IncomingCallModalProps } from '../../types/incoming-call.types';

const getInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(Boolean).slice(0, 2);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const IncomingCallModal = ({
  open,
  callerName,
  patientName,
  visitId,
  onAccept,
  onDecline,
}: IncomingCallModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-[36rem] rounded-[32px] bg-white px-8 py-10 shadow-[0_24px_80px_rgba(21,24,40,0.18)]">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#402E9D] to-[#5B45F5] text-4xl font-semibold text-white shadow-[0_20px_40px_rgba(69,64,163,0.24)]">
            {getInitials(callerName)}
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm border border-slate-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Incoming Call
          </div>

          <div>
            <p className="text-2xl font-semibold text-slate-900">
              {callerName} calling
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Patient:{' '}
              <span className="font-medium text-slate-900">{patientName}</span>{' '}
              · Visit #{visitId}
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center gap-10">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onDecline}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600 shadow-[0_24px_50px_rgba(239,68,68,0.18)] transition hover:bg-red-100"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 -960 960 960"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                className="rotate-90"
              >
                <path d="M792-52 570-274q-89 72-193.5 113T162-120q-24 0-33-12t-9-30v-162q0-14 9-24.5t23-13.5l138-28q11-2 27.5 3t24.5 13l94 94q18-11 39-25t37-27L56-788l56-56 736 736-56 56ZM360-244l-66-66-94 20v88q41-3 81-14t79-28Zm322-144-56-56q15-17 30.5-39t24.5-41l-97-98q-8-8-11-22.5t-1-23.5l26-140q3-14 13.5-23t24.5-9h162q18 0 30 12t12 30q0 110-42 214.5T682-388Zm36-212q17-39 26-79t14-81h-88l-18 94 66 66Zm0 0ZM360-244Z" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-slate-700">
              Decline
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onAccept}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2C22B5] text-white shadow-[0_24px_50px_rgba(46,34,159,0.28)] transition hover:brightness-110"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.11-.21 11.72 11.72 0 0 0 3.72.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1c0 1.26.21 2.48.6 3.72a1 1 0 0 1-.21 1.11l-2.27 2.27Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="text-sm font-semibold text-slate-700">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
