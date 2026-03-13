import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CustomToast from '../../components/common/custom-toast.component';

describe('CustomToast', () => {
  it('should render title and message', () => {
    render(<CustomToast title="Test Title" message="Test message" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render default Dismiss secondary label', () => {
    render(<CustomToast title="Title" message="Message" />);

    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  it('should render custom secondary label', () => {
    render(<CustomToast title="Title" message="Message" secondaryLabel="Close" />);

    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should render primary label when provided', () => {
    render(
      <CustomToast title="Title" message="Message" primaryLabel="View Details" />
    );

    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('should not render primary label when not provided', () => {
    render(<CustomToast title="Title" message="Message" />);

    // Only Dismiss should be in the action area
    const actions = screen.getByText('Dismiss').parentElement;
    expect(actions?.children.length).toBe(1);
  });

  it('should call onSecondary when secondary label is clicked', () => {
    const onSecondary = vi.fn();
    render(
      <CustomToast title="Title" message="Message" onSecondary={onSecondary} />
    );

    fireEvent.click(screen.getByText('Dismiss'));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('should call onPrimary when primary label is clicked', () => {
    const onPrimary = vi.fn();
    render(
      <CustomToast
        title="Title"
        message="Message"
        primaryLabel="Review"
        onPrimary={onPrimary}
      />
    );

    fireEvent.click(screen.getByText('Review'));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('should have correct styling on title', () => {
    render(<CustomToast title="Prescription Ready" message="Test" />);

    const title = screen.getByText('Prescription Ready');
    expect(title.tagName).toBe('STRONG');
    expect(title).toHaveClass('text-[13px]', 'font-bold', 'text-gray-900');
  });

  it('should have correct styling on message', () => {
    render(<CustomToast title="Title" message="Patient info here" />);

    const message = screen.getByText('Patient info here');
    expect(message.tagName).toBe('P');
    expect(message).toHaveClass('text-[12px]', 'text-gray-600');
  });

  it('should have correct styling on primary label', () => {
    render(
      <CustomToast title="Title" message="Msg" primaryLabel="Review Prescription" />
    );

    const primary = screen.getByText('Review Prescription');
    expect(primary).toHaveStyle({ color: '#2f1e91' });
    expect(primary).toHaveClass('text-[12px]', 'font-semibold', 'cursor-pointer');
  });

  it('should render close button when onClose is provided', () => {
    const onClose = vi.fn();
    render(<CustomToast title="Title" message="Msg" onClose={onClose} />);

    const closeBtn = screen.getByText('×');
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not render close button when onClose is not provided', () => {
    render(<CustomToast title="Title" message="Msg" />);

    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  it('should render with all props provided', () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();

    render(
      <CustomToast
        title="Prescription Ready"
        message="John Doe (OP-123) – Prescription received from Dr. Smith"
        primaryLabel="Review Prescription"
        secondaryLabel="Dismiss"
        onPrimary={onPrimary}
        onSecondary={onSecondary}
      />
    );

    expect(screen.getByText('Prescription Ready')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText('Review Prescription')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Review Prescription'));
    expect(onPrimary).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Dismiss'));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });
});
