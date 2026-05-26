export interface IncomingCallPayload {
  callerName: string;
  patientName: string;
  visitId: string;
}

export interface IncomingCallContextType {
  isIncomingCallOpen: boolean;
  isActiveCallOpen: boolean;
  isCallMinimized: boolean;
  incomingCall?: IncomingCallPayload;
  activeCall?: IncomingCallPayload;
  showIncomingCall: (call: IncomingCallPayload) => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
  endActiveCall: () => void;
  minimizeCall: () => void;
  maximizeCall: () => void;
}

export interface ActiveCallOverlayProps extends IncomingCallPayload {
  open: boolean;
  onEndCall: () => void;
}

export interface CallPipProps {
  callerName: string;
  onMaximize: () => void;
  onEndCall: () => void;
}

export interface IncomingCallModalProps {
  open: boolean;
  callerName: string;
  patientName: string;
  visitId: string;
  onAccept: () => void;
  onDecline: () => void;
}
