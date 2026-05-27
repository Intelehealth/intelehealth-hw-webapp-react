import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import CallPip from '../components/call/call-pip.component';
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
      globalThis.location.hash.replace(/^#/, '') || ROUTES.DASHBOARD;
    if (currentHash !== ROUTES.VIDEO_CALL) {
      setPreviousHash(currentHash);
    }
    setIsCallMinimized(false);
    setIsActiveCallOpen(true);
    globalThis.location.hash = ROUTES.VIDEO_CALL;
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
    globalThis.location.hash = target;
  }, [previousHash]);

  const minimizeCall = useCallback(() => {
    setIsCallMinimized(true);
    const target = previousHash || ROUTES.DASHBOARD;
    if (globalThis.location.hash.replace(/^#/, '') === ROUTES.VIDEO_CALL) {
      globalThis.location.hash = target;
    }
  }, [previousHash]);

  const maximizeCall = useCallback(() => {
    setIsCallMinimized(false);
    globalThis.location.hash = ROUTES.VIDEO_CALL;
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
      />

      {isActiveCallOpen && isCallMinimized && activeCall && (
        <CallPip
          callerName={activeCall.callerName}
          onMaximize={maximizeCall}
          onEndCall={endActiveCall}
        />
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
