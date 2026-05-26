import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IncomingCallModal from '../../../components/call/incoming-call-modal.component';

const baseProps = {
  open: true,
  callerName: 'Jane Doe',
  patientName: 'John Smith',
  visitId: '4321',
  onAccept: vi.fn(),
  onDecline: vi.fn(),
};

describe('IncomingCallModal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <IncomingCallModal {...baseProps} open={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders caller and patient info when open', () => {
    render(<IncomingCallModal {...baseProps} />);
    expect(screen.getByText('Jane Doe calling')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText(/Visit #4321/)).toBeInTheDocument();
  });

  it('renders initials from two-word name', () => {
    render(<IncomingCallModal {...baseProps} callerName="Jane Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders first two letters as initials for single-word name', () => {
    render(<IncomingCallModal {...baseProps} callerName="Alex" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('renders empty initials for empty name', () => {
    const { container } = render(
      <IncomingCallModal {...baseProps} callerName="   " />
    );
    const initialsEl = container.querySelector('.rounded-full.bg-gradient-to-br');
    expect(initialsEl?.textContent).toBe('');
  });

  it('invokes onAccept when accept button clicked', () => {
    const onAccept = vi.fn();
    render(<IncomingCallModal {...baseProps} onAccept={onAccept} />);
    fireEvent.click(screen.getByText('Accept').previousSibling as HTMLElement);
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('invokes onDecline when decline button clicked', () => {
    const onDecline = vi.fn();
    render(<IncomingCallModal {...baseProps} onDecline={onDecline} />);
    fireEvent.click(screen.getByText('Decline').previousSibling as HTMLElement);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

});
