import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmationModal } from '../../../components/modal/confirmation.modal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    open: true,
    type: 'confirm' as const,
    title: 'Test Modal',
    onClose: vi.fn(),
  };

  it('renders nothing when open is false', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with title when open is true', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <ConfirmationModal {...defaultProps} description="This is a test description" />
    );
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<ConfirmationModal {...defaultProps} icon="/test-icon.svg" />);
    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/test-icon.svg');
    expect(icon).toHaveClass('w-12', 'h-12');

    // Check wrapper div and classes
    const wrapper = icon.parentElement;
    expect(wrapper).toHaveClass('flex', 'justify-center', 'mb-4');
  });

  it('does not render icon when not provided', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders default button text', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders custom button text when provided', () => {
    render(
      <ConfirmationModal
        {...defaultProps}
        cancelText="Cancel"
        confirmText="OK"
      />
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ConfirmationModal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText('Back'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders with correct modal structure and styling classes', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} />);
    const modal = container.querySelector('.fixed.inset-0.z-50');
    const modalBox = container.querySelector('.bg-white');

    expect(modal).toBeInTheDocument();
    expect(modalBox).toBeInTheDocument();
  });

  it('handles multiline description with whitespace-pre-line', () => {
    const description = 'Line 1\nLine 2\nLine 3';
    render(<ConfirmationModal {...defaultProps} description={description} />);

    const descElement = screen.getByText((_content, element) => {
      return element?.textContent === description;
    });
    expect(descElement).toHaveClass('whitespace-pre-line');
  });

  it('renders both buttons with correct variants', () => {
    render(<ConfirmationModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');

    expect(buttons).toHaveLength(2);
  });

  it('works without onConfirm callback', async () => {
    const user = userEvent.setup();
    render(<ConfirmationModal {...defaultProps} onConfirm={undefined} />);

    // Should not throw error when clicking confirm without callback
    await user.click(screen.getByText('Confirm'));
    expect(true).toBe(true);
  });
});
