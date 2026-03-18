import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationDropdown from '../../../components/navbar/notification-dropdown.component';

let mockUnreadCount = 0;

vi.mock('../../../context/NotificationContext', () => ({
  useNotificationContext: () => ({
    unreadCount: mockUnreadCount,
    token: '',
    notifications: [],
    isEnabled: true,
    requestPermission: vi.fn(),
    toggleNotifications: vi.fn(),
  }),
}));

describe('NotificationDropdown', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnreadCount = 0;
  });

  it('should render without crashing', () => {
    render(<NotificationDropdown onClose={mockOnClose} />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should show "No notifications" message', () => {
    render(<NotificationDropdown onClose={mockOnClose} />);
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('should display unread count when greater than 0', () => {
    mockUnreadCount = 5;
    render(<NotificationDropdown onClose={mockOnClose} />);
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('should not display unread count when 0', () => {
    mockUnreadCount = 0;
    render(<NotificationDropdown onClose={mockOnClose} />);
    expect(screen.queryByText('(0)')).not.toBeInTheDocument();
  });

  it('should call onClose when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <NotificationDropdown onClose={mockOnClose} />
      </div>
    );

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when clicking inside', () => {
    render(<NotificationDropdown onClose={mockOnClose} />);

    fireEvent.mouseDown(screen.getByText('Notifications'));
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should have correct container classes', () => {
    const { container } = render(<NotificationDropdown onClose={mockOnClose} />);

    const dropdown = container.firstChild as HTMLElement;
    expect(dropdown).toHaveClass('absolute', 'right-0', 'top-full', 'w-80', 'bg-white', 'rounded-lg', 'shadow-lg', 'z-50');
  });

  it('should have header with correct styling', () => {
    render(<NotificationDropdown onClose={mockOnClose} />);

    const header = screen.getByText('Notifications').closest('div');
    expect(header).toHaveClass('flex', 'items-center', 'justify-between', 'px-4', 'py-3', 'border-b', 'border-gray-100', 'bg-gray-50');
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<NotificationDropdown onClose={mockOnClose} />);

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
