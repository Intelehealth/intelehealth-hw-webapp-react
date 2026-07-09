import {
  CallRoom,
  PreJoinLobby,
  type PreJoinDevices,
} from '@intelehealth/webrtc';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  magicLinkService,
  type RedeemedCall,
} from '../../services/magic-link.service';
import { showToast } from '../../services/toast';

type JoinState = 'loading' | 'lobby' | 'incall' | 'error' | 'ended';

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center text-white">
    {children}
  </div>
);

const JoinCallPage = () => {
  const { magicToken } = useParams<{ magicToken: string }>();
  const [state, setState] = useState<JoinState>('loading');
  const [call, setCall] = useState<RedeemedCall | null>(null);
  const [devices, setDevices] = useState<PreJoinDevices | null>(null);
  const [doctorPresent, setDoctorPresent] = useState(false);
  const [error, setError] = useState('');
  const stateRef = useRef<JoinState>('loading');
  stateRef.current = state;

  const handleClose = () => {
    const returnUrl = import.meta.env.VITE_APP_RETURN_URL as string | undefined;
    window.close();
    if (returnUrl) {
      window.setTimeout(() => {
        window.location.href = returnUrl;
      }, 150);
    }
  };

  useEffect(() => {
    let active = true;
    if (!magicToken) {
      setError('This call link is missing or malformed.');
      setState('error');
      return;
    }
    magicLinkService
      .redeem(magicToken)
      .then(redeemed => {
        if (!active) return;
        setCall(redeemed);
        setState('lobby');
      })
      .catch(err => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : 'Unable to join the call.'
        );
        setState('error');
      });
    return () => {
      active = false;
    };
  }, [magicToken]);

  useEffect(() => {
    const roomId = call?.roomId;
    if (!roomId) return;
    let active = true;
    const poll = async () => {
      try {
        const status = await magicLinkService.roomStatus(roomId);
        if (active) setDoctorPresent(status.doctorPresent);
      } catch {
        /* ignore transient poll errors */
      }
    };
    poll();
    const id = setInterval(() => {
      if (stateRef.current === 'lobby') poll();
    }, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [call?.roomId]);

  if (state === 'loading') {
    return (
      <Centered>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <p className="text-sm text-slate-300">Preparing your call…</p>
      </Centered>
    );
  }

  if (state === 'error') {
    return (
      <Centered>
        <p className="text-lg font-semibold">Can’t join this call</p>
        <p className="max-w-sm text-sm text-slate-300">{error}</p>
      </Centered>
    );
  }

  if (state === 'ended') {
    return (
      <Centered>
        <p className="text-lg font-semibold">Call ended</p>
        <p className="text-sm text-slate-300">
          Thank you for using Intelehealth.
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="mt-3 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Close
        </button>
      </Centered>
    );
  }

  if (state === 'lobby') {
    return (
      <div className="ihrtc-call-shell ihrtc-call-shell--full">
        <PreJoinLobby
          doctorName={call?.doctorName}
          patientName={call?.patientName}
          doctorPresent={doctorPresent}
          onJoin={selected => {
            setDevices(selected);
            setState('incall');
          }}
        />
      </div>
    );
  }

  return (
    <div className="ihrtc-call-shell ihrtc-call-shell--full">
      <CallRoom
        serverUrl={import.meta.env.VITE_WEBRTC_SDK_SERVER_URL}
        token={call?.token ?? ''}
        callerName={call?.doctorName}
        audioDeviceId={devices?.audioDeviceId}
        videoDeviceId={devices?.videoDeviceId}
        initialCameraOn={devices?.cameraEnabled ?? true}
        onEnd={info => {
          if (info?.message) {
            showToast(
              'Call ended',
              info.message,
              info.reason === 'remote-left' ? 'info' : 'warning'
            );
          }
          setState('ended');
        }}
      />
    </div>
  );
};

export default JoinCallPage;
