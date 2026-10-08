import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import WhatsAppShareModal, {
  SHARE_FAILED_MESSAGE,
} from '../../../components/modal/whatsapp-share.modal';

describe('WhatsAppShareModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onShare: vi.fn(),
  };

  it('should not render when open is false', () => {
    const { container } = render(
      <WhatsAppShareModal {...defaultProps} open={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render input and share button when open', () => {
    render(<WhatsAppShareModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('+918179987770')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('should show "Sharing..." when isLoading', () => {
    render(<WhatsAppShareModal {...defaultProps} isLoading />);
    expect(screen.getByText('Sharing...')).toBeInTheDocument();
  });

  it('should call onShare with full digits when valid number is entered', async () => {
    const onShare = vi.fn();
    render(<WhatsAppShareModal {...defaultProps} onShare={onShare} />);
    const input = screen.getByPlaceholderText('+918179987770');
    // Default value is +91, append 10 digits
    await userEvent.clear(input);
    await userEvent.type(input, '+911234567890');
    fireEvent.click(screen.getByText('Share'));
    expect(onShare).toHaveBeenCalledWith('911234567890');
  });

  it('should show error when country code is not recognized', async () => {
    render(<WhatsAppShareModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('+918179987770');
    await userEvent.clear(input);
    await userEvent.type(input, '+0001234567890');
    fireEvent.click(screen.getByText('Share'));
    expect(screen.getByText('Please enter a valid country code')).toBeInTheDocument();
  });

  it('should show error when phone number is not 10 digits', async () => {
    render(<WhatsAppShareModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('+918179987770');
    await userEvent.clear(input);
    await userEvent.type(input, '+9112345');
    fireEvent.click(screen.getByText('Share'));
    expect(
      screen.getByText('Please enter a valid 10-digit phone number')
    ).toBeInTheDocument();
  });

  it('should clear error when input changes after error', async () => {
    render(<WhatsAppShareModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('+918179987770');
    await userEvent.clear(input);
    await userEvent.type(input, '+9112345');
    fireEvent.click(screen.getByText('Share'));
    expect(
      screen.getByText('Please enter a valid 10-digit phone number')
    ).toBeInTheDocument();
    // Type more to clear error
    await userEvent.type(input, '6');
    expect(
      screen.queryByText('Please enter a valid 10-digit phone number')
    ).not.toBeInTheDocument();
  });

  it('should prepend + if user removes it', async () => {
    render(<WhatsAppShareModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('+918179987770') as HTMLInputElement;
    // Simulate typing without +
    fireEvent.change(input, { target: { value: '911234567890' } });
    expect(input.value).toBe('+911234567890');
  });

  it('should call onClose when clicking backdrop', () => {
    const onClose = vi.fn();
    render(<WhatsAppShareModal {...defaultProps} onClose={onClose} />);
    // Click the backdrop (outermost div)
    const backdrop = screen.getByText('Enter the mobile number to which you want to share the prescription.').closest('.fixed');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  describe('share failure feedback', () => {
    const fillValidNumber = async () => {
      const input = screen.getByPlaceholderText('+918179987770');
      await userEvent.clear(input);
      await userEvent.type(input, '+911234567890');
      return input;
    };

    it('should show the failure message in the modal when onShare rejects, keeping the number for a retry', async () => {
      const onShare = vi.fn().mockRejectedValue(new Error('token=secret-123'));
      render(<WhatsAppShareModal {...defaultProps} onShare={onShare} />);
      const input = await fillValidNumber();
      fireEvent.click(screen.getByText('Share'));

      expect(await screen.findByText(SHARE_FAILED_MESSAGE)).toBeInTheDocument();
      // only the fixed message is shown, never the rejected error
      expect(screen.queryByText(/secret-123/)).not.toBeInTheDocument();
      expect(input).toHaveValue('+911234567890');
      expect(screen.getByText('Share')).toBeEnabled();
    });

    it('should also show the failure message when onShare throws synchronously', async () => {
      const onShare = vi.fn(() => {
        throw new Error('sync failure');
      });
      render(<WhatsAppShareModal {...defaultProps} onShare={onShare} />);
      await fillValidNumber();
      fireEvent.click(screen.getByText('Share'));
      expect(await screen.findByText(SHARE_FAILED_MESSAGE)).toBeInTheDocument();
    });

    it('should clear the failure message and call onShare again on a successful retry', async () => {
      const onShare = vi
        .fn()
        .mockRejectedValueOnce(new Error('first attempt failed'))
        .mockResolvedValueOnce(undefined);
      render(<WhatsAppShareModal {...defaultProps} onShare={onShare} />);
      await fillValidNumber();
      fireEvent.click(screen.getByText('Share'));
      expect(await screen.findByText(SHARE_FAILED_MESSAGE)).toBeInTheDocument();

      fireEvent.click(screen.getByText('Share'));
      await waitFor(() => {
        expect(screen.queryByText(SHARE_FAILED_MESSAGE)).not.toBeInTheDocument();
      });
      expect(onShare).toHaveBeenCalledTimes(2);
      expect(onShare).toHaveBeenLastCalledWith('911234567890');
    });

    it('should not show a failure message when onShare resolves', async () => {
      const onShare = vi.fn().mockResolvedValue(undefined);
      render(<WhatsAppShareModal {...defaultProps} onShare={onShare} />);
      await fillValidNumber();
      fireEvent.click(screen.getByText('Share'));
      await waitFor(() => {
        expect(onShare).toHaveBeenCalledWith('911234567890');
      });
      expect(screen.queryByText(SHARE_FAILED_MESSAGE)).not.toBeInTheDocument();
    });

    it('should clear the failure message when the user edits the number', async () => {
      const onShare = vi.fn().mockRejectedValue(new Error('failed'));
      render(<WhatsAppShareModal {...defaultProps} onShare={onShare} />);
      const input = await fillValidNumber();
      fireEvent.click(screen.getByText('Share'));
      expect(await screen.findByText(SHARE_FAILED_MESSAGE)).toBeInTheDocument();
      await userEvent.type(input, '1');
      expect(screen.queryByText(SHARE_FAILED_MESSAGE)).not.toBeInTheDocument();
    });

    it('should not greet the user with an old failure message when the modal is reopened', async () => {
      const onShare = vi.fn().mockRejectedValue(new Error('failed'));
      const { rerender } = render(
        <WhatsAppShareModal {...defaultProps} onShare={onShare} />
      );
      await fillValidNumber();
      fireEvent.click(screen.getByText('Share'));
      expect(await screen.findByText(SHARE_FAILED_MESSAGE)).toBeInTheDocument();

      rerender(<WhatsAppShareModal {...defaultProps} onShare={onShare} open={false} />);
      rerender(<WhatsAppShareModal {...defaultProps} onShare={onShare} open />);
      expect(screen.queryByText(SHARE_FAILED_MESSAGE)).not.toBeInTheDocument();
    });
  });
});
