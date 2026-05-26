import iconCallAccept from '../../assets/icons/icon-call-accept.svg';
import iconCallDecline from '../../assets/icons/icon-call-decline.svg';
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
              <img src={iconCallDecline} alt="" className="h-6 w-6" />
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
              <img src={iconCallAccept} alt="" className="h-6 w-6" />
            </button>
            <span className="text-sm font-semibold text-slate-700">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
