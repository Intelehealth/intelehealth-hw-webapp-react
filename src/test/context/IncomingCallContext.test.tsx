import { render, renderHook, act, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  IncomingCallProvider,
  useIncomingCallContext,
} from '../../context/IncomingCallContext';
import ROUTES from '../../routes/paths';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <IncomingCallProvider>{children}</IncomingCallProvider>
);

const payload = {
  callerName: 'Dr A',
  patientName: 'Patient B',
  visitId: '99',
};

describe('IncomingCallContext', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    delete (window as unknown as { triggerIncomingCall?: unknown })
      .triggerIncomingCall;
  });

  it('throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useIncomingCallContext())).toThrow(
      /useIncomingCallContext must be used inside IncomingCallProvider/
    );
    spy.mockRestore();
  });

  it('exposes initial state', () => {
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    expect(result.current.isIncomingCallOpen).toBe(false);
    expect(result.current.isActiveCallOpen).toBe(false);
    expect(result.current.isCallMinimized).toBe(false);
    expect(result.current.incomingCall).toBeUndefined();
    expect(result.current.activeCall).toBeUndefined();
  });

  it('showIncomingCall opens incoming modal and sets active call', () => {
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.showIncomingCall(payload));
    expect(result.current.isIncomingCallOpen).toBe(true);
    expect(result.current.incomingCall).toEqual(payload);
    expect(result.current.activeCall).toEqual(payload);
  });

  it('acceptIncomingCall transitions to active call and navigates to video call route', () => {
    window.location.hash = '/dashboard';
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.showIncomingCall(payload));
    act(() => result.current.acceptIncomingCall());
    expect(result.current.isIncomingCallOpen).toBe(false);
    expect(result.current.isActiveCallOpen).toBe(true);
    expect(result.current.isCallMinimized).toBe(false);
    expect(window.location.hash).toBe(`#${ROUTES.VIDEO_CALL}`);
  });

  it('declineIncomingCall closes modal and clears active call', () => {
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.showIncomingCall(payload));
    act(() => result.current.declineIncomingCall());
    expect(result.current.isIncomingCallOpen).toBe(false);
    expect(result.current.activeCall).toBeUndefined();
  });

  it('endActiveCall returns to dashboard when no previous route stored', () => {
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.showIncomingCall(payload));
    act(() => result.current.acceptIncomingCall());
    act(() => result.current.endActiveCall());
    expect(result.current.isActiveCallOpen).toBe(false);
    expect(result.current.activeCall).toBeUndefined();
    expect(window.location.hash).toBe(`#${ROUTES.DASHBOARD}`);
  });

  it('endActiveCall returns to previously stored route', () => {
    window.location.hash = '/prescriptions';
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.showIncomingCall(payload));
    act(() => result.current.acceptIncomingCall());
    act(() => result.current.endActiveCall());
    expect(window.location.hash).toBe('#/prescriptions');
  });

  it('minimizeCall navigates back to previous route and sets minimized state', () => {
    window.location.hash = '/dashboard';
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.showIncomingCall(payload));
    act(() => result.current.acceptIncomingCall());
    expect(window.location.hash).toBe(`#${ROUTES.VIDEO_CALL}`);
    act(() => result.current.minimizeCall());
    expect(result.current.isCallMinimized).toBe(true);
    expect(window.location.hash).toBe('#/dashboard');
  });

  it('minimizeCall does not change hash if not currently on the video-call route', () => {
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.showIncomingCall(payload));
    act(() => result.current.acceptIncomingCall());
    window.location.hash = '/some-other';
    act(() => result.current.minimizeCall());
    expect(window.location.hash).toBe('#/some-other');
    expect(result.current.isCallMinimized).toBe(true);
  });

  it('minimizeCall falls back to dashboard when no previousHash is stored', () => {
    window.location.hash = ROUTES.VIDEO_CALL;
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.minimizeCall());
    expect(window.location.hash).toBe(`#${ROUTES.DASHBOARD}`);
  });

  it('maximizeCall sets minimized to false and navigates to video call', () => {
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.showIncomingCall(payload));
    act(() => result.current.acceptIncomingCall());
    act(() => result.current.minimizeCall());
    act(() => result.current.maximizeCall());
    expect(result.current.isCallMinimized).toBe(false);
    expect(window.location.hash).toBe(`#${ROUTES.VIDEO_CALL}`);
  });

  it('accept stores fallback dashboard route when hash is empty', () => {
    window.location.hash = '';
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.showIncomingCall(payload));
    act(() => result.current.acceptIncomingCall());
    act(() => result.current.endActiveCall());
    expect(window.location.hash).toBe(`#${ROUTES.DASHBOARD}`);
  });

  it('accept does not overwrite previousHash when already on video-call route', () => {
    window.location.hash = '/prescriptions';
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    act(() => result.current.showIncomingCall(payload));
    act(() => result.current.acceptIncomingCall());
    // simulate user already on video-call when "accepting" again
    act(() => result.current.acceptIncomingCall());
    act(() => result.current.endActiveCall());
    expect(window.location.hash).toBe('#/prescriptions');
  });

  it('exposes window.triggerIncomingCall and uses provided payload', () => {
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    const trigger = (
      window as unknown as {
        triggerIncomingCall: (call?: Partial<typeof payload>) => void;
      }
    ).triggerIncomingCall;
    expect(typeof trigger).toBe('function');
    act(() => trigger({ callerName: 'Custom', patientName: 'PX', visitId: '7' }));
    expect(result.current.incomingCall).toEqual({
      callerName: 'Custom',
      patientName: 'PX',
      visitId: '7',
    });
  });

  it('window.triggerIncomingCall falls back to default values', () => {
    const { result } = renderHook(() => useIncomingCallContext(), { wrapper });
    const trigger = (
      window as unknown as {
        triggerIncomingCall: () => void;
      }
    ).triggerIncomingCall;
    act(() => trigger());
    expect(result.current.incomingCall).toEqual({
      callerName: 'Dr. Test Doctor',
      patientName: 'Test Patient',
      visitId: '1234',
    });
  });

  it('renders floating PiP when active call is minimized', () => {
    render(
      <IncomingCallProvider>
        <button
          onClick={() => {
            (
              window as unknown as { triggerIncomingCall: () => void }
            ).triggerIncomingCall();
          }}
        >
          trigger
        </button>
      </IncomingCallProvider>
    );
    fireEvent.click(screen.getByText('trigger'));
    fireEvent.click(screen.getByLabelText('Close incoming call'));
    // PiP not visible after decline
    expect(screen.queryByLabelText('Maximize call')).not.toBeInTheDocument();
  });

  it('renders maximize and end buttons in PiP', () => {
    let ctx!: ReturnType<typeof useIncomingCallContext>;
    const Capture = () => {
      ctx = useIncomingCallContext();
      return null;
    };
    render(
      <IncomingCallProvider>
        <Capture />
      </IncomingCallProvider>
    );
    act(() => ctx.showIncomingCall(payload));
    act(() => ctx.acceptIncomingCall());
    act(() => ctx.minimizeCall());
    expect(screen.getByLabelText('Maximize call')).toBeInTheDocument();
    expect(screen.getByLabelText('End call')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Maximize call'));
    expect(ctx.isCallMinimized).toBe(false);

    act(() => ctx.minimizeCall());
    fireEvent.click(screen.getByLabelText('End call'));
    expect(ctx.isActiveCallOpen).toBe(false);
  });
});
