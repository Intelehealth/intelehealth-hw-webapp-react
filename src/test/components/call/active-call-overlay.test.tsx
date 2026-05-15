import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ActiveCallOverlay from '../../../components/call/active-call-overlay.component';

const baseProps = {
  open: true,
  callerName: 'Dr Who',
  patientName: 'Pat',
  visitId: '7',
  onEndCall: vi.fn(),
};

describe('ActiveCallOverlay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns null when open is false', () => {
    const { container } = render(
      <ActiveCallOverlay {...baseProps} open={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders caller and patient info', () => {
    render(<ActiveCallOverlay {...baseProps} />);
    expect(screen.getByText(/Dr Who · Pat/)).toBeInTheDocument();
    expect(screen.getByText('#7')).toBeInTheDocument();
  });

  it('ticks the timer when open', () => {
    render(<ActiveCallOverlay {...baseProps} />);
    expect(screen.getByText(/In call · 00:00/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText(/In call · 00:03/)).toBeInTheDocument();
  });

  it('toggles mic and video buttons', () => {
    render(<ActiveCallOverlay {...baseProps} />);
    const mic = screen.getByLabelText('Toggle microphone');
    const video = screen.getByLabelText('Toggle video');
    fireEvent.click(mic);
    fireEvent.click(video);
    fireEvent.click(mic);
    fireEvent.click(video);
    expect(mic).toBeInTheDocument();
    expect(video).toBeInTheDocument();
  });

  it('invokes onEndCall', () => {
    const onEndCall = vi.fn();
    render(<ActiveCallOverlay {...baseProps} onEndCall={onEndCall} />);
    fireEvent.click(screen.getByLabelText('End call'));
    expect(onEndCall).toHaveBeenCalledTimes(1);
  });
});
