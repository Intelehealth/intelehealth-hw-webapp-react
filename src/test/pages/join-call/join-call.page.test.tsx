import { act, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import JoinCallPage from '../../../pages/join-call/join-call.page';
import { magicLinkService } from '../../../services/magic-link.service';
import { showToast } from '../../../services/toast';

const h = vi.hoisted(() => ({
  params: {} as { magicToken?: string },
  lobby: null as any,
  callroom: null as any,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => h.params,
}));

vi.mock('@intelehealth/webrtc', () => ({
  PreJoinLobby: (props: any) => {
    h.lobby = props;
    return <div data-testid="lobby" />;
  },
  CallRoom: (props: any) => {
    h.callroom = props;
    return <div data-testid="callroom" />;
  },
}));

vi.mock('../../../services/magic-link.service', () => ({
  magicLinkService: { redeem: vi.fn(), roomStatus: vi.fn() },
}));

vi.mock('../../../services/toast', () => ({ showToast: vi.fn() }));

const redeem = vi.mocked(magicLinkService.redeem);
const roomStatus = vi.mocked(magicLinkService.roomStatus);
const toast = vi.mocked(showToast);

const sampleCall = {
  roomId: 'room-1',
  token: 'tok-1',
  visitUuid: 'v-1',
  doctorName: 'Dr. Who',
  patientName: 'Amy',
};

const flush = async (ms = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

let hrefValue = '';
let closeSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  h.params = { magicToken: 'magic-123' };
  h.lobby = null;
  h.callroom = null;
  roomStatus.mockResolvedValue({
    success: true,
    room: 'room-1',
    participantCount: 0,
    doctorPresent: false,
  });
  vi.stubEnv('VITE_WEBRTC_SDK_SERVER_URL', 'wss://sdk');
  vi.stubEnv('VITE_APP_RETURN_URL', '');
  hrefValue = '';
  closeSpy = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      set href(v: string) {
        hrefValue = v;
      },
      get href() {
        return hrefValue;
      },
    },
  });
  window.close = closeSpy as any;
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('JoinCallPage', () => {
  it('shows the loading state before the link is redeemed', async () => {
    redeem.mockReturnValue(new Promise(() => {}));
    render(<JoinCallPage />);
    expect(screen.getByText('Preparing your call…')).toBeInTheDocument();
  });

  it('errors when the magic token is missing', async () => {
    h.params = {};
    redeem.mockResolvedValue(sampleCall);
    render(<JoinCallPage />);
    await flush();
    expect(screen.getByText('Can’t join this call')).toBeInTheDocument();
    expect(
      screen.getByText('This call link is missing or malformed.')
    ).toBeInTheDocument();
    expect(redeem).not.toHaveBeenCalled();
  });

  it('redeems and shows the lobby with doctor presence polling', async () => {
    redeem.mockResolvedValue(sampleCall);
    roomStatus.mockResolvedValue({
      success: true,
      room: 'room-1',
      participantCount: 1,
      doctorPresent: true,
    });
    render(<JoinCallPage />);
    await flush();

    expect(screen.getByTestId('lobby')).toBeInTheDocument();
    expect(h.lobby.doctorName).toBe('Dr. Who');
    expect(h.lobby.patientName).toBe('Amy');
    expect(roomStatus).toHaveBeenCalledTimes(1);
    expect(h.lobby.doctorPresent).toBe(true);

    // interval keeps polling while in the lobby
    await flush(5000);
    expect(roomStatus).toHaveBeenCalledTimes(2);
  });

  it('ignores transient room-status polling errors', async () => {
    redeem.mockResolvedValue(sampleCall);
    roomStatus.mockRejectedValue(new Error('network'));
    render(<JoinCallPage />);
    await flush();
    expect(screen.getByTestId('lobby')).toBeInTheDocument();
    expect(h.lobby.doctorPresent).toBe(false);
  });

  it('shows an error with the thrown message', async () => {
    redeem.mockRejectedValue(new Error('This link has expired.'));
    render(<JoinCallPage />);
    await flush();
    expect(
      screen.getByText('This link has expired.')
    ).toBeInTheDocument();
  });

  it('shows a fallback error message for non-Error rejections', async () => {
    redeem.mockRejectedValue('boom');
    render(<JoinCallPage />);
    await flush();
    expect(screen.getByText('Unable to join the call.')).toBeInTheDocument();
  });

  it('joins from the lobby and stops polling once in the call', async () => {
    redeem.mockResolvedValue(sampleCall);
    render(<JoinCallPage />);
    await flush();
    expect(roomStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      h.lobby.onJoin({
        audioDeviceId: 'a1',
        videoDeviceId: 'v1',
        cameraEnabled: true,
      });
    });

    expect(screen.getByTestId('callroom')).toBeInTheDocument();
    expect(h.callroom.serverUrl).toBe('wss://sdk');
    expect(h.callroom.token).toBe('tok-1');
    expect(h.callroom.audioDeviceId).toBe('a1');
    expect(h.callroom.initialCameraOn).toBe(true);

    // interval no longer polls once state is not 'lobby'
    await flush(5000);
    expect(roomStatus).toHaveBeenCalledTimes(1);
  });

  it('defaults token and camera when the redeemed call omits them', async () => {
    redeem.mockResolvedValue({
      roomId: 'room-1',
      token: undefined,
      visitUuid: 'v-1',
    } as any);
    render(<JoinCallPage />);
    await flush();

    await act(async () => {
      h.lobby.onJoin({ cameraEnabled: undefined } as any);
    });

    expect(h.callroom.token).toBe('');
    expect(h.callroom.initialCameraOn).toBe(true);
  });

  it('toasts an info message and ends when the doctor leaves', async () => {
    redeem.mockResolvedValue(sampleCall);
    render(<JoinCallPage />);
    await flush();
    await act(async () => {
      h.lobby.onJoin({ cameraEnabled: true } as any);
    });

    await act(async () => {
      h.callroom.onEnd({
        reason: 'remote-left',
        message: 'The doctor has left the call.',
      });
    });

    expect(toast).toHaveBeenCalledWith(
      'Call ended',
      'The doctor has left the call.',
      'info'
    );
    expect(screen.getByText('Call ended')).toBeInTheDocument();
  });

  it('toasts a warning for non-remote end reasons', async () => {
    redeem.mockResolvedValue(sampleCall);
    render(<JoinCallPage />);
    await flush();
    await act(async () => {
      h.lobby.onJoin({ cameraEnabled: true } as any);
    });

    await act(async () => {
      h.callroom.onEnd({ reason: 'network', message: 'Call disconnected.' });
    });

    expect(toast).toHaveBeenCalledWith(
      'Call ended',
      'Call disconnected.',
      'warning'
    );
  });

  it('ends without a toast when there is no end message', async () => {
    redeem.mockResolvedValue(sampleCall);
    render(<JoinCallPage />);
    await flush();
    await act(async () => {
      h.lobby.onJoin({ cameraEnabled: true } as any);
    });

    await act(async () => {
      h.callroom.onEnd(undefined);
    });

    expect(toast).not.toHaveBeenCalled();
    expect(screen.getByText('Call ended')).toBeInTheDocument();
  });

  it('closes the tab on the ended screen (no return url)', async () => {
    redeem.mockResolvedValue(sampleCall);
    render(<JoinCallPage />);
    await flush();
    await act(async () => {
      h.lobby.onJoin({ cameraEnabled: true } as any);
    });
    await act(async () => {
      h.callroom.onEnd(undefined);
    });

    await act(async () => {
      screen.getByText('Close').click();
    });

    expect(closeSpy).toHaveBeenCalled();
    await flush(200);
    expect(hrefValue).toBe('');
  });

  it('redirects to the return url after closing when configured', async () => {
    vi.stubEnv('VITE_APP_RETURN_URL', 'myapp://home');
    redeem.mockResolvedValue(sampleCall);
    render(<JoinCallPage />);
    await flush();
    await act(async () => {
      h.lobby.onJoin({ cameraEnabled: true } as any);
    });
    await act(async () => {
      h.callroom.onEnd(undefined);
    });

    await act(async () => {
      screen.getByText('Close').click();
    });
    expect(closeSpy).toHaveBeenCalled();

    await flush(200);
    expect(hrefValue).toBe('myapp://home');
  });

  it('ignores a redeem success that resolves after unmount', async () => {
    let resolveRedeem: (v: unknown) => void = () => {};
    redeem.mockReturnValue(
      new Promise(res => {
        resolveRedeem = res;
      }) as any
    );
    const { unmount } = render(<JoinCallPage />);
    unmount();
    await act(async () => {
      resolveRedeem(sampleCall);
      await Promise.resolve();
    });
    expect(screen.queryByTestId('lobby')).not.toBeInTheDocument();
  });

  it('ignores a redeem failure that rejects after unmount', async () => {
    let rejectRedeem: (e: unknown) => void = () => {};
    redeem.mockReturnValue(
      new Promise((_res, rej) => {
        rejectRedeem = rej;
      }) as any
    );
    const { unmount } = render(<JoinCallPage />);
    unmount();
    await act(async () => {
      rejectRedeem(new Error('late'));
      await Promise.resolve().catch(() => {});
    });
    expect(screen.queryByText('Can’t join this call')).not.toBeInTheDocument();
  });
});
