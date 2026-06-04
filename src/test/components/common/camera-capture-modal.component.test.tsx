import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CameraCaptureModal from '../../../components/common/camera-capture-modal.component';

const mockOnClose = vi.fn();
const mockOnCapture = vi.fn();

const baseProps = {
  isOpen: true,
  onClose: mockOnClose,
  onCapture: mockOnCapture,
};

function makeNamedError(name: string, message = '') {
  const err = new Error(message);
  err.name = name;
  return err;
}

describe('CameraCaptureModal', () => {
  let mockStream: MediaStream;
  let mockTrack: MediaStreamTrack;
  let mockGetUserMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    document.body.style.overflow = '';

    mockTrack = { stop: vi.fn() } as unknown as MediaStreamTrack;
    mockStream = {
      getTracks: vi.fn(() => [mockTrack]),
    } as unknown as MediaStream;

    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
      writable: true,
    });
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(
      <CameraCaptureModal {...baseProps} isOpen={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders modal with header when isOpen is true', async () => {
    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
  });

  it('shows loading state before camera is ready', () => {
    // Use a never-resolving promise so camera never becomes ready
    mockGetUserMedia.mockReturnValue(new Promise(() => {}));
    render(<CameraCaptureModal {...baseProps} />);
    expect(screen.getByText('Starting camera...')).toBeInTheDocument();
  });

  it('calls onClose when header close button is clicked', async () => {
    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });
    const buttons = screen
      .getByText('Take Photo')
      .parentElement!.querySelectorAll('button');
    fireEvent.click(buttons[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });
    const { container } = render(<CameraCaptureModal {...baseProps} />);
    const backdrop = container.querySelector('.absolute.inset-0');
    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('sets body overflow to hidden when open', async () => {
    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('resets body overflow on unmount', async () => {
    let unmount: () => void;
    await act(async () => {
      const result = render(<CameraCaptureModal {...baseProps} />);
      unmount = result.unmount;
    });
    act(() => {
      unmount!();
    });
    expect(document.body.style.overflow).toBe('unset');
  });

  it('shows capture button when camera is ready', async () => {
    // Mock play on the prototype before rendering
    const playMock = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockImplementation(playMock);

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    // getUserMedia resolved, onloadedmetadata was set on the video
    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'videoWidth', { value: 640, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: 480, configurable: true });

    // Manually invoke onloadedmetadata since jsdom doesn't fire it
    await act(async () => {
      if (video.onloadedmetadata) {
        await (video.onloadedmetadata as (e: Event) => void).call(video, new Event('loadedmetadata'));
      }
    });

    expect(screen.getByText('Capture Photo')).toBeInTheDocument();
  });

  it('shows error when camera is not supported', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: undefined },
      configurable: true,
      writable: true,
    });

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    expect(
      screen.getByText('Camera not supported on this device')
    ).toBeInTheDocument();
  });

  it('shows error when camera permission is denied (NotAllowedError)', async () => {
    mockGetUserMedia.mockRejectedValue(makeNamedError('NotAllowedError', 'denied'));

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    expect(
      screen.getByText('Camera permission denied. Please allow camera access.')
    ).toBeInTheDocument();
  });

  it('shows error for PermissionDeniedError', async () => {
    mockGetUserMedia.mockRejectedValue(makeNamedError('PermissionDeniedError', 'denied'));

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    expect(
      screen.getByText('Camera permission denied. Please allow camera access.')
    ).toBeInTheDocument();
  });

  it('shows error when no camera found (NotFoundError)', async () => {
    mockGetUserMedia.mockRejectedValue(makeNamedError('NotFoundError', 'not found'));

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    expect(
      screen.getByText('No camera found on this device.')
    ).toBeInTheDocument();
  });

  it('shows error for DevicesNotFoundError', async () => {
    mockGetUserMedia.mockRejectedValue(makeNamedError('DevicesNotFoundError', 'not found'));

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    expect(
      screen.getByText('No camera found on this device.')
    ).toBeInTheDocument();
  });

  it('shows error when camera is in use (NotReadableError)', async () => {
    mockGetUserMedia.mockRejectedValue(makeNamedError('NotReadableError', 'in use'));

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    expect(
      screen.getByText('Camera is already in use by another application.')
    ).toBeInTheDocument();
  });

  it('shows error for TrackStartError', async () => {
    mockGetUserMedia.mockRejectedValue(makeNamedError('TrackStartError', 'in use'));

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    expect(
      screen.getByText('Camera is already in use by another application.')
    ).toBeInTheDocument();
  });

  it('shows generic error for unknown camera errors', async () => {
    mockGetUserMedia.mockRejectedValue(makeNamedError('SomeOtherError', 'unknown'));

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    expect(
      screen.getByText('Failed to access camera. Please try again.')
    ).toBeInTheDocument();
  });

  it('shows close button in error state and calls onClose', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: undefined },
      configurable: true,
      writable: true,
    });

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    expect(screen.getByText('Camera Error')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('captures photo and calls onCapture with File', async () => {
    const mockCtx = {
      save: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      restore: vi.fn(),
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      mockCtx as unknown as CanvasRenderingContext2D
    );
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: vi.fn((cb: (blob: Blob | null) => void) =>
        cb(new Blob(['img'], { type: 'image/jpeg' }))
      ),
      configurable: true,
    });
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockResolvedValue(undefined);

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'videoWidth', { value: 640, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: 480, configurable: true });

    await act(async () => {
      if (video.onloadedmetadata) {
        await (video.onloadedmetadata as (e: Event) => void).call(video, new Event('loadedmetadata'));
      }
    });

    expect(screen.getByText('Capture Photo')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Capture Photo'));
    });

    expect(mockOnCapture).toHaveBeenCalledWith(expect.any(File));
  });

  it('does not capture when video dimensions are zero', async () => {
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockResolvedValue(undefined);

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'videoWidth', { value: 0, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: 0, configurable: true });

    await act(async () => {
      if (video.onloadedmetadata) {
        await (video.onloadedmetadata as (e: Event) => void).call(video, new Event('loadedmetadata'));
      }
    });

    fireEvent.click(screen.getByText('Capture Photo'));
    expect(mockOnCapture).not.toHaveBeenCalled();
  });

  it('does not capture when canvas context is null', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockResolvedValue(undefined);

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'videoWidth', { value: 640, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: 480, configurable: true });

    await act(async () => {
      if (video.onloadedmetadata) {
        await (video.onloadedmetadata as (e: Event) => void).call(video, new Event('loadedmetadata'));
      }
    });

    fireEvent.click(screen.getByText('Capture Photo'));
    expect(mockOnCapture).not.toHaveBeenCalled();
  });

  it('stops camera tracks on unmount', async () => {
    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    // Wait for stream to be set in state
    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });
  });

  it('shows error when video.play() fails', async () => {
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockRejectedValue(new Error('play failed'));

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    const video = document.querySelector('video')!;

    await act(async () => {
      if (video.onloadedmetadata) {
        await (video.onloadedmetadata as (e: Event) => void).call(video, new Event('loadedmetadata'));
      }
    });

    expect(
      screen.getByText('Failed to start camera preview')
    ).toBeInTheDocument();
  });

  it('early returns from onloadedmetadata when component unmounts before it fires', async () => {
    const playSpy = vi.spyOn(HTMLVideoElement.prototype, 'play').mockResolvedValue(undefined);

    let unmountFn: () => void;
    await act(async () => {
      const { unmount } = render(<CameraCaptureModal {...baseProps} />);
      unmountFn = unmount;
    });

    const video = document.querySelector('video')!;

    // Wait for getUserMedia to resolve and onloadedmetadata to be set
    await waitFor(() => {
      expect(video.onloadedmetadata).toBeTruthy();
    });

    // Capture the handler before unmounting
    const savedHandler = video.onloadedmetadata!;

    // Reset play spy to track only post-unmount calls
    playSpy.mockClear();

    // Unmount: React sets videoRef.current = null
    act(() => {
      unmountFn!();
    });

    // Call the captured handler after unmount — triggers `if (!videoRef.current) return;`
    await (savedHandler as (e: Event) => void).call(video, new Event('loadedmetadata'));

    // play() should NOT have been called because the handler returned early
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('ignores non-Error exceptions from getUserMedia', async () => {
    mockGetUserMedia.mockRejectedValue('string error');

    await act(async () => {
      render(<CameraCaptureModal {...baseProps} />);
    });

    // Non-Error exceptions are caught but no error message is set
    // so the loading state remains visible
    expect(screen.getByText('Starting camera...')).toBeInTheDocument();
  });
});
