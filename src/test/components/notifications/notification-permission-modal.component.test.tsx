import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationPermissionModal from '../../../components/notifications/notification-permission-modal.component';

// Mock Button component
vi.mock('../../../components/common/button.component', () => ({
  default: ({
    children,
    onClick,
    disabled,
    isLoading,
    loadingText,
    variant,
    size,
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      data-testid="button"
      data-variant={variant}
      data-size={size}
    >
      {isLoading ? loadingText || 'Loading...' : children}
    </button>
  ),
}));

describe('NotificationPermissionModal', () => {
  const mockOnAllow = vi.fn();
  const mockOnDeny = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure window and navigator are properly set up
    if (typeof window !== 'undefined') {
      // Restore Notification API if it was deleted
      if (!('Notification' in window)) {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: {
            permission: 'default',
          },
        });
      } else {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: {
            permission: 'default',
          },
        });
      }
    }
    // Reset serviceWorker - only if navigator exists
    if (typeof navigator !== 'undefined') {
      if (!('serviceWorker' in navigator)) {
        Object.defineProperty(navigator, 'serviceWorker', {
          writable: true,
          configurable: true,
          value: {},
        });
      } else {
        Object.defineProperty(navigator, 'serviceWorker', {
          writable: true,
          configurable: true,
          value: {},
        });
      }
    }
  });

  afterEach(() => {
    // Ensure window and navigator are restored after each test
    if (typeof window !== 'undefined') {
      if (!('Notification' in window)) {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: {
            permission: 'default',
          },
        });
      }
    }
    if (typeof navigator !== 'undefined') {
      if (!('serviceWorker' in navigator)) {
        Object.defineProperty(navigator, 'serviceWorker', {
          writable: true,
          configurable: true,
          value: {},
        });
      }
    }
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <NotificationPermissionModal
          isOpen={false}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
      expect(
        screen.getByText(
          "Stay updated with important alerts and messages. We'll send you notifications about new updates and important information."
        )
      ).toBeInTheDocument();
    });

    it('should render both action buttons', () => {
      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(screen.getByText('Not Now')).toBeInTheDocument();
      expect(screen.getByText('Allow Notifications')).toBeInTheDocument();
    });

    it('should apply body overflow hidden when open', () => {
      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body overflow when closed', () => {
      const { rerender } = render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <NotificationPermissionModal
          isOpen={false}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Browser Support', () => {
    it('should show normal modal when both APIs are available', () => {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        configurable: true,
        value: {
          permission: 'default',
        },
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {},
      });

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
      expect(
        screen.queryByText('Notifications Not Supported')
      ).not.toBeInTheDocument();
    });

    it('should handle case where Notification exists but serviceWorker does not', () => {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        configurable: true,
        value: {
          permission: 'default',
        },
      });
      delete (navigator as any).serviceWorker;

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      expect(screen.getByText('Notifications Not Supported')).toBeInTheDocument();
      expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();

      // Restore serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {},
      });
    });

    it('should handle case where serviceWorker exists but Notification does not', () => {
      delete (window as any).Notification;
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {},
      });

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      expect(screen.getByText('Notifications Not Supported')).toBeInTheDocument();
      expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();

      // Restore Notification
      Object.defineProperty(window, 'Notification', {
        writable: true,
        configurable: true,
        value: {
          permission: 'default',
        },
      });
    });

    it('should show unsupported message when Notification API is not available', () => {
      const originalNotification = window.Notification;
      delete (window as any).Notification;

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      expect(screen.getByText('Notifications Not Supported')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Your browser does not support push notifications. Please use a modern browser like Chrome, Edge, or Firefox.'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();

      // Restore Notification
      if (originalNotification) {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: originalNotification,
        });
      }
    });

    it('should show unsupported message when serviceWorker is not available', () => {
      const originalServiceWorker = navigator.serviceWorker;
      delete (navigator as any).serviceWorker;

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      expect(screen.getByText('Notifications Not Supported')).toBeInTheDocument();
      expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();

      // Restore serviceWorker
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', {
          writable: true,
          configurable: true,
          value: originalServiceWorker,
        });
      }
    });

    it('should show unsupported message when both APIs are not available', () => {
      const originalNotification = window.Notification;
      const originalServiceWorker = navigator.serviceWorker;
      delete (window as any).Notification;
      delete (navigator as any).serviceWorker;

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      expect(screen.getByText('Notifications Not Supported')).toBeInTheDocument();
      expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();

      // Restore APIs
      if (originalNotification) {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: originalNotification,
        });
      }
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', {
          writable: true,
          configurable: true,
          value: originalServiceWorker,
        });
      }
    });

    it('should default to unsupported when window check fails', () => {
      // This test verifies the component handles the case where
      // typeof window !== 'undefined' check passes but Notification check fails
      // We simulate this by removing Notification after component mount
      const originalNotification = window.Notification;
      const originalServiceWorker = navigator.serviceWorker;
      
      // Remove both APIs
      delete (window as any).Notification;
      delete (navigator as any).serviceWorker;

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      // Should show unsupported when APIs are not available
      expect(screen.getByText('Notifications Not Supported')).toBeInTheDocument();

      // Restore APIs
      if (originalNotification) {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: originalNotification,
        });
      }
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', {
          writable: true,
          configurable: true,
          value: originalServiceWorker,
        });
      }
    });
  });

  describe('User Interactions', () => {
    it('should call onAllow when Allow button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      const allowButton = screen.getByText('Allow Notifications');
      await user.click(allowButton);

      expect(mockOnAllow).toHaveBeenCalledTimes(1);
    });

    it('should call onDeny when Not Now button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      const denyButton = screen.getByText('Not Now');
      await user.click(denyButton);

      expect(mockOnDeny).toHaveBeenCalledTimes(1);
    });

    it('should call onDeny when Close button is clicked in unsupported view', async () => {
      const user = userEvent.setup();
      const originalNotification = window.Notification;
      delete (window as any).Notification;

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(mockOnDeny).toHaveBeenCalledTimes(1);

      // Restore Notification
      if (originalNotification) {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: originalNotification,
        });
      }
    });

    it('should not call onAllow when Allow button is clicked in unsupported view', async () => {
      const originalNotification = window.Notification;
      delete (window as any).Notification;

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      // Allow button should not exist in unsupported view
      expect(screen.queryByText('Allow Notifications')).not.toBeInTheDocument();
      expect(mockOnAllow).not.toHaveBeenCalled();

      // Restore Notification
      if (originalNotification) {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: originalNotification,
        });
      }
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
          isLoading={true}
        />
      );

      const allowButton = screen.getByText('Enabling...');
      expect(allowButton).toBeInTheDocument();
      expect(allowButton).toBeDisabled();
    });

    it('should disable buttons when loading', () => {
      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
          isLoading={true}
        />
      );

      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should not disable buttons when not loading', () => {
      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
          isLoading={false}
        />
      );

      const allowButton = screen.getByText('Allow Notifications');
      const denyButton = screen.getByText('Not Now');

      expect(allowButton).not.toBeDisabled();
      expect(denyButton).not.toBeDisabled();
    });

    it('should use default isLoading value when not provided', () => {
      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      const allowButton = screen.getByText('Allow Notifications');
      const denyButton = screen.getByText('Not Now');

      expect(allowButton).not.toBeDisabled();
      expect(denyButton).not.toBeDisabled();
    });

    it('should not show loading state in unsupported view even when isLoading is true', () => {
      const originalNotification = window.Notification;
      delete (window as any).Notification;

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
          isLoading={true}
        />
      );

      // In unsupported view, there's no loading state, just a Close button
      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.queryByText('Enabling...')).not.toBeInTheDocument();

      // Restore Notification
      if (originalNotification) {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: originalNotification,
        });
      }
    });
  });

  describe('Cleanup', () => {
    it('should cleanup body overflow on unmount', () => {
      const { unmount } = render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should cleanup body overflow on unmount even in unsupported view', () => {
      const originalNotification = window.Notification;
      delete (window as any).Notification;

      const { unmount } = render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('unset');

      // Restore Notification
      if (originalNotification) {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: originalNotification,
        });
      }
    });

    it('should cleanup body overflow when isOpen changes from false to true to false', () => {
      // Reset body overflow first
      document.body.style.overflow = '';
      
      const { rerender } = render(
        <NotificationPermissionModal
          isOpen={false}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      // When isOpen is false, the component returns null early, but useEffect still runs
      // The cleanup function is set up, so when isOpen changes, cleanup runs
      // Initially, overflow should be 'unset' because cleanup from previous render (if any) ran
      // But since we just rendered with false, and there's no previous state, it should be ''
      // Actually, the cleanup function runs when the dependency changes, so when we change from false to true,
      // the cleanup from the false render runs, setting it to 'unset'
      
      // Open the modal - cleanup from previous render (false) runs first, then effect runs
      rerender(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(document.body.style.overflow).toBe('hidden');

      // Close the modal - cleanup should run
      rerender(
        <NotificationPermissionModal
          isOpen={false}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should handle multiple isOpen changes correctly', () => {
      const { rerender } = render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      expect(document.body.style.overflow).toBe('hidden');

      // Close
      rerender(
        <NotificationPermissionModal
          isOpen={false}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(document.body.style.overflow).toBe('unset');

      // Open again
      rerender(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(document.body.style.overflow).toBe('hidden');

      // Close again
      rerender(
        <NotificationPermissionModal
          isOpen={false}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should cleanup body overflow on unmount when isOpen is false', () => {
      // Reset body overflow first
      document.body.style.overflow = '';
      
      const { unmount } = render(
        <NotificationPermissionModal
          isOpen={false}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      // When isOpen is false, the component returns null early, but useEffect still runs
      // The cleanup function is set up and will run on unmount
      unmount();
      // Cleanup function runs on unmount, setting overflow to 'unset'
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Unsupported View Details', () => {
    it('should render correct styling and content in unsupported view', () => {
      const originalNotification = window.Notification;
      delete (window as any).Notification;

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      // Check for unsupported view specific elements
      expect(screen.getByText('Notifications Not Supported')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Your browser does not support push notifications. Please use a modern browser like Chrome, Edge, or Firefox.'
        )
      ).toBeInTheDocument();

      // Check that only Close button exists, not Allow/Not Now buttons
      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.queryByText('Allow Notifications')).not.toBeInTheDocument();
      expect(screen.queryByText('Not Now')).not.toBeInTheDocument();

      // Restore Notification
      if (originalNotification) {
        Object.defineProperty(window, 'Notification', {
          writable: true,
          configurable: true,
          value: originalNotification,
        });
      }
    });
  });
});

