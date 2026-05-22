import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import IncomingCallModal from '../components/call/incoming-call-modal.component';
import ROUTES from '../routes/paths';
import type {
  IncomingCallContextType,
  IncomingCallPayload,
} from '../types/incoming-call.types';

const IncomingCallContext = createContext<IncomingCallContextType | null>(null);

export const IncomingCallProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(
    null
  );
  const [isIncomingCallOpen, setIsIncomingCallOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<IncomingCallPayload | null>(
    null
  );
  const [isActiveCallOpen, setIsActiveCallOpen] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [previousHash, setPreviousHash] = useState<string>('');

  const closeIncomingCall = useCallback(() => {
    setIsIncomingCallOpen(false);
  }, []);

  const showIncomingCall = useCallback((call: IncomingCallPayload) => {
    setIncomingCall(call);
    setActiveCall(call);
    setIsIncomingCallOpen(true);
  }, []);

  const acceptIncomingCall = useCallback(() => {
    closeIncomingCall();
    const currentHash =
      window.location.hash.replace(/^#/, '') || ROUTES.DASHBOARD;
    if (currentHash !== ROUTES.VIDEO_CALL) {
      setPreviousHash(currentHash);
    }
    setIsCallMinimized(false);
    setIsActiveCallOpen(true);
    window.location.hash = ROUTES.VIDEO_CALL;
  }, [closeIncomingCall]);

  const declineIncomingCall = useCallback(() => {
    closeIncomingCall();
    setActiveCall(null);
  }, [closeIncomingCall]);

  const endActiveCall = useCallback(() => {
    setIsActiveCallOpen(false);
    setIsCallMinimized(false);
    setActiveCall(null);
    const target = previousHash || ROUTES.DASHBOARD;
    window.location.hash = target;
  }, [previousHash]);

  const minimizeCall = useCallback(() => {
    setIsCallMinimized(true);
    const target = previousHash || ROUTES.DASHBOARD;
    if (window.location.hash.replace(/^#/, '') === ROUTES.VIDEO_CALL) {
      window.location.hash = target;
    }
  }, [previousHash]);

  const maximizeCall = useCallback(() => {
    setIsCallMinimized(false);
    window.location.hash = ROUTES.VIDEO_CALL;
  }, []);

  useEffect(() => {
    (
      window as unknown as {
        triggerIncomingCall?: (call?: Partial<IncomingCallPayload>) => void;
      }
    ).triggerIncomingCall = call => {
      showIncomingCall({
        callerName: call?.callerName ?? 'Dr. Test Doctor',
        patientName: call?.patientName ?? 'Test Patient',
        visitId: call?.visitId ?? '1234',
      });
    };
  }, [showIncomingCall]);

  const contextValue = useMemo(
    () => ({
      isIncomingCallOpen,
      isActiveCallOpen,
      isCallMinimized,
      incomingCall: incomingCall ?? undefined,
      activeCall: activeCall ?? undefined,
      showIncomingCall,
      acceptIncomingCall,
      declineIncomingCall,
      endActiveCall,
      minimizeCall,
      maximizeCall,
    }),
    [
      isIncomingCallOpen,
      isActiveCallOpen,
      isCallMinimized,
      incomingCall,
      activeCall,
      showIncomingCall,
      acceptIncomingCall,
      declineIncomingCall,
      endActiveCall,
      minimizeCall,
      maximizeCall,
    ]
  );

  return (
    <IncomingCallContext.Provider value={contextValue}>
      {children}

      <IncomingCallModal
        open={isIncomingCallOpen}
        callerName={incomingCall?.callerName || 'Unknown'}
        patientName={incomingCall?.patientName || 'Unknown'}
        visitId={incomingCall?.visitId || '0000'}
        onAccept={acceptIncomingCall}
        onDecline={declineIncomingCall}
        onClose={declineIncomingCall}
      />

      {isActiveCallOpen && isCallMinimized && activeCall && (
        <div className="fixed bottom-6 right-6 z-[70] h-56 w-80 overflow-hidden rounded-2xl bg-slate-950 shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/70" />
          <div className="absolute left-0 right-0 top-0 px-3 py-2 text-white">
            <p className="truncate text-xs font-semibold">
              Dr. {activeCall.callerName}
            </p>
            <p className="text-[10px] text-slate-300">In call</p>
          </div>
          <button
            type="button"
            onClick={maximizeCall}
            aria-label="Maximize call"
            className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 4H4V9M15 4H20V9M9 20H4V15M15 20H20V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={endActiveCall}
            aria-label="End call"
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
          >
            <svg
              width="14"
              height="14"
              fill="currentColor"
              viewBox="0 0 32 32"
              transform="rotate(45)"
            >
              <path d="M30.053 6.236c0 0.033-0.003 0.060-0.007 0.082-0.817 0.563-5.389 3.582-6.243 4.13-0.090 0.002-0.318-0.028-0.644-0.2-0.348-0.182-1.361-0.751-2.777-1.559l-1.102-0.629-1.039 0.729c-0.773 0.544-2.452 1.838-5.009 4.394-2.568 2.567-3.858 4.241-4.399 5.011l-0.729 1.039 0.63 1.102c0.611 1.069 1.342 2.36 1.563 2.779 0.178 0.337 0.191 0.567 0.191 0.63 0 0.010 0 0.019-0.001 0.026-0.48 0.765-3.581 5.436-4.146 6.26-0.080 0.014-0.254 0.001-0.471-0.151-1.758-1.269-3.592-3.070-3.856-3.775 0.176-3.751 3.473-9.014 9.299-14.84s11.085-9.121 14.824-9.295c0.707 0.253 2.52 2.088 3.779 3.829 0.088 0.129 0.14 0.288 0.14 0.437zM31.991 6.236c0-0.529-0.16-1.091-0.499-1.578-0.033-0.047-3.383-4.753-5.323-4.691-5.451 0.173-11.857 5.471-16.272 9.883s-9.713 10.819-9.887 16.292v0.045c0 1.916 4.646 5.284 4.692 5.316 1.263 0.884 2.653 0.562 3.217-0.243 0.344-0.489 3.905-5.846 4.306-6.502 0.175-0.286 0.261-0.635 0.261-1.014 0-0.489-0.143-1.032-0.421-1.561-0.271-0.515-1.16-2.077-1.596-2.841 0.473-0.673 1.684-2.254 4.177-4.745 2.474-2.476 4.068-3.697 4.745-4.173 0.764 0.435 2.325 1.323 2.839 1.593 0.969 0.511 1.936 0.57 2.589 0.155 0.615-0.389 5.931-3.937 6.438-4.303 0.477-0.346 0.735-0.964 0.735-1.634z" />
            </svg>
          </button>
        </div>
      )}
    </IncomingCallContext.Provider>
  );
};

export const useIncomingCallContext = () => {
  const context = useContext(IncomingCallContext);
  if (!context) {
    throw new Error(
      'useIncomingCallContext must be used inside IncomingCallProvider'
    );
  }
  return context;
};
