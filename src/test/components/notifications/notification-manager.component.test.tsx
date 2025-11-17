import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MessagePayload } from 'firebase/messaging';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationManager from '../../../components/notifications/notification-manager.component';

// Mock useFCM hook
const mockUseFCM = vi.fn();
vi.mock('../../../hooks/useFCM', () => ({
  default: (...args: any[]) => mockUseFCM(...args),
}));

// Mock modal components
vi.mock('../../../components/notifications/notification-permission-modal.component', () => ({
  default: ({
    isOpen,
    onAllow,
    onDeny,
    isLoading,
  }: {
    isOpen: boolean;
    onAllow: () => void;
    onDeny: () => void;
    isLoading: boolean;
  }) =>
    isOpen ? (
      <div data-testid="permission-modal">
        <button onClick={onAllow} disabled={isLoading}>
          Allow
        </button>
        <button onClick={onDeny} disabled={isLoading}>
          Deny
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../components/notifications/notification-enabled-modal.component', () => ({
  default: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="enabled-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe('NotificationManager', () => {
  const mockOnNotificationReceived = vi.fn();
  const mockOnPermissionGranted = vi.fn();
  const mockOnPermissionDenied = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should not render anything when not initialized', () => {
      mockUseFCM.mockReturnValue({
        isInitialized: false,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: null,
        requestPermission: vi.fn(),
        error: null,
      });

      const { container } = render(
        <NotificationManager
          onNotificationReceived={mockOnNotificationReceived}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render anything when there is an error', () => {
      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: null,
        requestPermission: vi.fn(),
        error: new Error('FCM error'),
      });

      const { container } = render(
        <NotificationManager
          onNotificationReceived={mockOnNotificationReceived}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when initialized without error', () => {
      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: null,
        requestPermission: vi.fn(),
        error: null,
      });

      render(
        <NotificationManager
          onNotificationReceived={mockOnNotificationReceived}
        />
      );

      // Component should render (modals may not be visible)
      expect(screen.queryByTestId('permission-modal')).not.toBeInTheDocument();
      expect(screen.queryByTestId('enabled-modal')).not.toBeInTheDocument();
    });
  });

  describe('Permission Already Granted', () => {
    it('should show enabled modal when permission is already granted and autoRequest is true', async () => {
      const mockToken = 'test-token-123';
      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: true,
        isPermissionDenied: false,
        isPermissionDefault: false,
        token: mockToken,
        requestPermission: vi.fn(),
        error: null,
      });

      render(
        <NotificationManager
          autoRequest={true}
          onPermissionGranted={mockOnPermissionGranted}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('enabled-modal')).toBeInTheDocument();
      });

      expect(mockOnPermissionGranted).toHaveBeenCalledWith(mockToken);
    });

    it('should not show enabled modal when permission is granted but autoRequest is false', () => {
      const mockToken = 'test-token-123';
      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: true,
        isPermissionDenied: false,
        isPermissionDefault: false,
        token: mockToken,
        requestPermission: vi.fn(),
        error: null,
      });

      render(
        <NotificationManager
          autoRequest={false}
          onPermissionGranted={mockOnPermissionGranted}
        />
      );

      expect(screen.queryByTestId('enabled-modal')).not.toBeInTheDocument();
      expect(mockOnPermissionGranted).not.toHaveBeenCalled();
    });
  });

  describe('Permission Denied', () => {
    it('should not show permission modal when permission is denied', () => {
      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: true,
        isPermissionDefault: false,
        token: null,
        requestPermission: vi.fn(),
        error: null,
      });

      render(<NotificationManager autoRequest={true} />);

      expect(screen.queryByTestId('permission-modal')).not.toBeInTheDocument();
    });
  });

  describe('Auto Request Permission', () => {
    it('should show permission modal after delay when autoRequest is true and permission is default', async () => {
      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: null,
        requestPermission: vi.fn(),
        error: null,
      });

      render(<NotificationManager autoRequest={true} requestDelay={2000} />);

      expect(screen.queryByTestId('permission-modal')).not.toBeInTheDocument();

      // Fast-forward delay
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('permission-modal')).toBeInTheDocument();
      });
    });

    it('should use custom requestDelay', async () => {
      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: null,
        requestPermission: vi.fn(),
        error: null,
      });

      render(<NotificationManager autoRequest={true} requestDelay={5000} />);

      expect(screen.queryByTestId('permission-modal')).not.toBeInTheDocument();

      // Fast-forward less than delay
      vi.advanceTimersByTime(3000);
      expect(screen.queryByTestId('permission-modal')).not.toBeInTheDocument();

      // Fast-forward to delay
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByTestId('permission-modal')).toBeInTheDocument();
      });
    });

    it('should not show permission modal when autoRequest is false', () => {
      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: null,
        requestPermission: vi.fn(),
        error: null,
      });

      render(<NotificationManager autoRequest={false} />);

      vi.advanceTimersByTime(5000);

      expect(screen.queryByTestId('permission-modal')).not.toBeInTheDocument();
    });
  });

  describe('Permission Request Flow', () => {
    it('should call requestPermission when Allow is clicked', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue(undefined);
      const mockToken = 'new-token-456';

      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: mockToken,
        requestPermission: mockRequestPermission,
        error: null,
      });

      render(<NotificationManager autoRequest={true} requestDelay={0} />);

      await waitFor(() => {
        expect(screen.getByTestId('permission-modal')).toBeInTheDocument();
      });

      const allowButton = screen.getByText('Allow');
      await userEvent.click(allowButton);

      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    });

    it('should show enabled modal after successful permission request', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue(undefined);
      const mockToken = 'new-token-456';

      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: mockToken,
        requestPermission: mockRequestPermission,
        error: null,
      });

      render(
        <NotificationManager
          autoRequest={true}
          requestDelay={0}
          onPermissionGranted={mockOnPermissionGranted}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('permission-modal')).toBeInTheDocument();
      });

      const allowButton = screen.getByText('Allow');
      await userEvent.click(allowButton);

      await waitFor(() => {
        expect(screen.getByTestId('enabled-modal')).toBeInTheDocument();
      });

      expect(mockOnPermissionGranted).toHaveBeenCalledWith(mockToken);
    });

    it('should call onPermissionDenied when permission request fails', async () => {
      const mockRequestPermission = vi
        .fn()
        .mockRejectedValue(new Error('Permission denied'));

      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: null,
        requestPermission: mockRequestPermission,
        error: null,
      });

      render(
        <NotificationManager
          autoRequest={true}
          requestDelay={0}
          onPermissionDenied={mockOnPermissionDenied}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('permission-modal')).toBeInTheDocument();
      });

      const allowButton = screen.getByText('Allow');
      await userEvent.click(allowButton);

      await waitFor(() => {
        expect(mockOnPermissionDenied).toHaveBeenCalled();
      });
    });

    it('should call onPermissionDenied when Deny is clicked', async () => {
      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: null,
        requestPermission: vi.fn(),
        error: null,
      });

      render(
        <NotificationManager
          autoRequest={true}
          requestDelay={0}
          onPermissionDenied={mockOnPermissionDenied}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('permission-modal')).toBeInTheDocument();
      });

      const denyButton = screen.getByText('Deny');
      await userEvent.click(denyButton);

      expect(mockOnPermissionDenied).toHaveBeenCalledTimes(1);
    });
  });

  describe('Notification Received', () => {
    it('should call onNotificationReceived when notification is received', () => {
      const mockPayload: MessagePayload = {
        notification: {
          title: 'Test Notification',
          body: 'Test body',
        },
        data: {},
        from: 'test-sender',
        collapseKey: 'test-key',
        messageId: 'test-message-id',
      } as MessagePayload;

      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: false,
        isPermissionDenied: false,
        isPermissionDefault: true,
        token: null,
        requestPermission: vi.fn(),
        error: null,
      });

      render(
        <NotificationManager
          onNotificationReceived={mockOnNotificationReceived}
        />
      );

      // Simulate notification received by calling the callback passed to useFCM
      const useFCMCall = mockUseFCM.mock.calls[0];
      if (useFCMCall && useFCMCall[0]) {
        useFCMCall[0](mockPayload);
      }

      expect(mockOnNotificationReceived).toHaveBeenCalledWith(mockPayload);
    });
  });

  describe('Enabled Modal Close', () => {
    it('should close enabled modal when Close is clicked', async () => {
      const mockToken = 'test-token-123';
      mockUseFCM.mockReturnValue({
        isInitialized: true,
        isPermissionGranted: true,
        isPermissionDenied: false,
        isPermissionDefault: false,
        token: mockToken,
        requestPermission: vi.fn(),
        error: null,
      });

      render(<NotificationManager autoRequest={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('enabled-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('enabled-modal')).not.toBeInTheDocument();
      });
    });
  });
});

