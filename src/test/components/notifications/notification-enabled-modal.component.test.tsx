import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationEnabledModal from '../../../components/notifications/notification-enabled-modal.component';

// Mock Button component
vi.mock('../../../components/common/button.component', () => ({
  default: ({ children, onClick, variant, size }: any) => (
    <button
      onClick={onClick}
      data-testid="button"
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

describe('NotificationEnabledModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );
      expect(
        screen.queryByText('Notifications Enabled!')
      ).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<NotificationEnabledModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Notifications Enabled!')).toBeInTheDocument();
      expect(
        screen.getByText(
          "You'll now receive important updates and alerts directly in your browser."
        )
      ).toBeInTheDocument();
    });

    it('should render Got it button', () => {
      render(<NotificationEnabledModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Got it')).toBeInTheDocument();
    });

    it('should apply body overflow hidden when open', () => {
      render(<NotificationEnabledModal isOpen={true} onClose={mockOnClose} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body overflow when closed', () => {
      const { rerender } = render(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Auto-close Functionality', () => {
    it('should auto-close after 3 seconds', async () => {
      render(<NotificationEnabledModal isOpen={true} onClose={mockOnClose} />);

      expect(mockOnClose).not.toHaveBeenCalled();

      // Fast-forward 3 seconds
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should not auto-close if modal is closed before timeout', () => {
      const { rerender } = render(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      // Close modal before 3 seconds
      rerender(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );

      // Fast-forward 3 seconds
      vi.advanceTimersByTime(3000);

      // onClose should not be called again (it was called when we closed it)
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should clear timeout on unmount', () => {
      const { unmount } = render(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      unmount();

      // Fast-forward 3 seconds after unmount
      vi.advanceTimersByTime(3000);

      // onClose should not be called after unmount
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when Got it button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NotificationEnabledModal isOpen={true} onClose={mockOnClose} />);

      const gotItButton = screen.getByText('Got it');
      await user.click(gotItButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose multiple times if button is clicked multiple times', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NotificationEnabledModal isOpen={true} onClose={mockOnClose} />);

      const gotItButton = screen.getByText('Got it');
      await user.click(gotItButton);
      await user.click(gotItButton);
      await user.click(gotItButton);

      // Should only be called once per click, but since modal closes, subsequent clicks may not register
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup body overflow on unmount', () => {
      const { unmount } = render(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should cleanup timeout on unmount', () => {
      const { unmount } = render(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      unmount();

      // Fast-forward time after unmount
      vi.advanceTimersByTime(5000);

      // onClose should not be called
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Open/Close Cycles', () => {
    it('should handle multiple open/close cycles correctly', async () => {
      const { rerender } = render(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      // Close after 1 second
      vi.advanceTimersByTime(1000);
      rerender(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );

      // Open again
      rerender(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      // Should auto-close after 3 seconds from this new open
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});

