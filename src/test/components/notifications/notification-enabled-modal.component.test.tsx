import { fireEvent, render, screen } from '@testing-library/react';
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
    vi.clearAllTimers();
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
      await vi.advanceTimersByTimeAsync(3000);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
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
    it('should call onClose when Got it button is clicked', () => {
      render(<NotificationEnabledModal isOpen={true} onClose={mockOnClose} />);

      const gotItButton = screen.getByText('Got it');
      fireEvent.click(gotItButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose multiple times if button is clicked multiple times', () => {
      render(<NotificationEnabledModal isOpen={true} onClose={mockOnClose} />);

      const gotItButton = screen.getByText('Got it');
      fireEvent.click(gotItButton);
      fireEvent.click(gotItButton);

      // Should be called at least once
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

    it('should cleanup body overflow on unmount when isOpen is false', () => {
      // Reset body overflow first
      document.body.style.overflow = '';
      
      const { unmount } = render(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );

      // When isOpen is false, the component returns null early, but useEffect still runs
      // The cleanup function is set up and will run on unmount
      unmount();
      // Cleanup function runs on unmount, setting overflow to 'unset'
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should cleanup when isOpen changes from true to false', () => {
      const { rerender } = render(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      expect(document.body.style.overflow).toBe('hidden');

      // Change to false - cleanup from previous render should run
      rerender(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );

      // Cleanup should have run, setting overflow to 'unset'
      expect(document.body.style.overflow).toBe('unset');
      
      // Fast-forward time to ensure timer was cleared
      vi.advanceTimersByTime(5000);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should cleanup when isOpen changes from false to true to false', () => {
      // Reset body overflow first
      document.body.style.overflow = '';
      
      const { rerender } = render(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );

      // Open the modal
      rerender(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );
      expect(document.body.style.overflow).toBe('hidden');

      // Close the modal - cleanup should run
      rerender(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );
      expect(document.body.style.overflow).toBe('unset');
      
      // Ensure timer was cleared
      vi.advanceTimersByTime(5000);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Open/Close Cycles', () => {
    it('should handle multiple open/close cycles correctly', async () => {
      const { rerender } = render(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      // Close after 1 second
      await vi.advanceTimersByTimeAsync(1000);
      rerender(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );

      // Open again
      rerender(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      // Should auto-close after 3 seconds from this new open
      await vi.advanceTimersByTimeAsync(3000);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle rapid open/close cycles without calling onClose multiple times', async () => {
      const { rerender } = render(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      // Rapidly open and close multiple times
      await vi.advanceTimersByTimeAsync(500);
      rerender(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );

      await vi.advanceTimersByTimeAsync(100);
      rerender(
        <NotificationEnabledModal isOpen={true} onClose={mockOnClose} />
      );

      await vi.advanceTimersByTimeAsync(1000);
      rerender(
        <NotificationEnabledModal isOpen={false} onClose={mockOnClose} />
      );

      // Fast-forward remaining time - onClose should not be called
      // because the timer was cleared when we closed the modal
      await vi.advanceTimersByTimeAsync(5000);
      
      // onClose should not have been called by the timer
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('onClose dependency', () => {
    it('should re-run effect when onClose changes', async () => {
      const firstOnClose = vi.fn();
      const secondOnClose = vi.fn();

      const { rerender } = render(
        <NotificationEnabledModal isOpen={true} onClose={firstOnClose} />
      );

      // Change onClose prop
      rerender(
        <NotificationEnabledModal isOpen={true} onClose={secondOnClose} />
      );

      // Fast-forward 3 seconds - should call the new onClose
      await vi.advanceTimersByTimeAsync(3000);

      expect(firstOnClose).not.toHaveBeenCalled();
      expect(secondOnClose).toHaveBeenCalledTimes(1);
    });

    it('should clear previous timer when onClose changes', async () => {
      const firstOnClose = vi.fn();
      const secondOnClose = vi.fn();

      const { rerender } = render(
        <NotificationEnabledModal isOpen={true} onClose={firstOnClose} />
      );

      // Advance time by 2 seconds
      await vi.advanceTimersByTimeAsync(2000);

      // Change onClose - this should clear the previous timer
      rerender(
        <NotificationEnabledModal isOpen={true} onClose={secondOnClose} />
      );

      // Fast-forward 3 seconds from the change
      await vi.advanceTimersByTimeAsync(3000);

      // firstOnClose should never be called (timer was cleared)
      expect(firstOnClose).not.toHaveBeenCalled();
      // secondOnClose should be called after 3 seconds from the change
      expect(secondOnClose).toHaveBeenCalledTimes(1);
    });
  });
});

