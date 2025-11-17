import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    // Reset Notification API
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: {
        permission: 'default',
      },
    });
    // Reset serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {},
    });
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
    it('should show unsupported message when Notification API is not available', () => {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        value: undefined,
      });

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
          "Your browser does not support push notifications. Please use a modern browser like Chrome, Edge, or Firefox."
        )
      ).toBeInTheDocument();
    });

    it('should show unsupported message when serviceWorker is not available', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: undefined,
      });

      render(
        <NotificationPermissionModal
          isOpen={true}
          onAllow={mockOnAllow}
          onDeny={mockOnDeny}
        />
      );

      expect(screen.getByText('Notifications Not Supported')).toBeInTheDocument();
    });

    it('should show normal modal when both APIs are available', () => {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        value: {
          permission: 'default',
        },
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
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
      Object.defineProperty(window, 'Notification', {
        writable: true,
        value: undefined,
      });

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
  });
});

