import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import VideoCallPage from '../../../pages/video-call/video-call.page';
import { IncomingCallProvider, useIncomingCallContext } from '../../../context/IncomingCallContext';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const payload = {
  callerName: 'Dr. Foo',
  patientName: 'Bar',
  visitId: '11',
};

const renderWithProvider = () => {
  let ctx!: ReturnType<typeof useIncomingCallContext>;
  const Capture = () => {
    ctx = useIncomingCallContext();
    return null;
  };
  const utils = render(
    <MemoryRouter>
      <IncomingCallProvider>
        <Capture />
        <VideoCallPage />
      </IncomingCallProvider>
    </MemoryRouter>
  );
  return { ...utils, getCtx: () => ctx };
};

describe('VideoCallPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('redirects to dashboard when there is no active call', () => {
    render(
      <MemoryRouter>
        <IncomingCallProvider>
          <VideoCallPage />
        </IncomingCallProvider>
      </MemoryRouter>
    );
    expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('renders caller and starts the call timer', () => {
    const { getCtx } = renderWithProvider();
    act(() => getCtx().showIncomingCall(payload));
    act(() => getCtx().acceptIncomingCall());

    expect(screen.getByText('Dr. Dr. Foo')).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('00:02')).toBeInTheDocument();
  });

  it('formats minutes and seconds correctly', () => {
    const { getCtx } = renderWithProvider();
    act(() => getCtx().showIncomingCall(payload));
    act(() => getCtx().acceptIncomingCall());
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(screen.getByText('01:05')).toBeInTheDocument();
  });

  it('end call button invokes endActiveCall and navigates to dashboard', () => {
    const { getCtx } = renderWithProvider();
    act(() => getCtx().showIncomingCall(payload));
    act(() => getCtx().acceptIncomingCall());

    fireEvent.click(screen.getByLabelText('End call'));
    expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    expect(getCtx().isActiveCallOpen).toBe(false);
  });

  it('minimize button triggers minimizeCall', () => {
    const { getCtx } = renderWithProvider();
    act(() => getCtx().showIncomingCall(payload));
    act(() => getCtx().acceptIncomingCall());

    fireEvent.click(screen.getByLabelText('Minimize call'));
    expect(getCtx().isCallMinimized).toBe(true);
  });

  it('toggles the microphone button', () => {
    const { getCtx } = renderWithProvider();
    act(() => getCtx().showIncomingCall(payload));
    act(() => getCtx().acceptIncomingCall());

    expect(screen.getByLabelText('Mute microphone')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Mute microphone'));
    expect(screen.getByLabelText('Unmute microphone')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Unmute microphone'));
    expect(screen.getByLabelText('Mute microphone')).toBeInTheDocument();
  });

  it('toggles the camera button', () => {
    const { getCtx } = renderWithProvider();
    act(() => getCtx().showIncomingCall(payload));
    act(() => getCtx().acceptIncomingCall());

    expect(screen.getByLabelText('Turn off camera')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Turn off camera'));
    expect(screen.getByLabelText('Turn on camera')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Turn on camera'));
    expect(screen.getByLabelText('Turn off camera')).toBeInTheDocument();
  });

  it('toggles the chat button', () => {
    const { getCtx } = renderWithProvider();
    act(() => getCtx().showIncomingCall(payload));
    act(() => getCtx().acceptIncomingCall());

    expect(screen.getByLabelText('Open chat')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Open chat'));
    expect(screen.getByLabelText('Close chat')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close chat'));
    expect(screen.getByLabelText('Open chat')).toBeInTheDocument();
  });
});
