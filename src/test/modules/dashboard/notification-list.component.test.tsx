import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationList from '../../../modules/dashboard/notification-list.component';

let mockNotifications: any[] = [];
let mockUnreadCount = 0;

vi.mock('../../../context/NotificationContext', () => ({
  useNotificationContext: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    token: '',
    isEnabled: true,
    requestPermission: vi.fn(),
    toggleNotifications: vi.fn(),
  }),
}));

describe('NotificationList', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications = [];
    mockUnreadCount = 0;
  });

  it('should render without crashing', () => {
    render(<NotificationList />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should show "No notifications" when list is empty', () => {
    render(<NotificationList />);
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('should display unread count when greater than 0', () => {
    mockUnreadCount = 3;
    render(<NotificationList />);
    expect(screen.getByText('(3 new)')).toBeInTheDocument();
  });

  it('should not display unread count when 0', () => {
    mockUnreadCount = 0;
    render(<NotificationList />);
    expect(screen.queryByText(/new\)/)).not.toBeInTheDocument();
  });

  it('should render close button when onClose is provided', () => {
    render(<NotificationList onClose={mockOnClose} />);
    const closeBtn = screen.getByText('✕');
    expect(closeBtn).toBeInTheDocument();
  });

  it('should not render close button when onClose is not provided', () => {
    render(<NotificationList />);
    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<NotificationList onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('✕'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render unread notification with correct styling', () => {
    mockNotifications = [
      { id: 1, title: 'New prescription', description: 'From Dr. Smith', isRead: false, createdAt: new Date().toISOString() },
    ];
    render(<NotificationList />);

    expect(screen.getByText('New prescription')).toBeInTheDocument();
    expect(screen.getByText('From Dr. Smith')).toBeInTheDocument();

    // Unread notification has bg-[#F0EDFF] class
    const item = screen.getByText('New prescription').closest('[class*="flex items-start"]');
    expect(item?.className).toContain('bg-[#F0EDFF]');
  });

  it('should render read notification without unread styling', () => {
    mockNotifications = [
      { id: 2, title: 'Old notification', isRead: true, createdAt: new Date().toISOString() },
    ];
    render(<NotificationList />);

    expect(screen.getByText('Old notification')).toBeInTheDocument();
    const item = screen.getByText('Old notification').closest('[class*="flex items-start"]');
    expect(item?.className).not.toContain('bg-[#F0EDFF]');
  });

  it('should show unread dot for unread notifications', () => {
    mockNotifications = [
      { id: 1, title: 'Unread', isRead: false, createdAt: new Date().toISOString() },
    ];
    const { container } = render(<NotificationList />);

    const dot = container.querySelector('.bg-\\[\\#2E1E91\\]');
    expect(dot).toBeInTheDocument();
  });

  it('should not show unread dot for read notifications', () => {
    mockNotifications = [
      { id: 1, title: 'Read', isRead: true, createdAt: new Date().toISOString() },
    ];
    const { container } = render(<NotificationList />);

    const dot = container.querySelector('.bg-\\[\\#2E1E91\\]');
    expect(dot).not.toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    mockNotifications = [
      { id: 1, title: 'No desc', isRead: false, createdAt: new Date().toISOString() },
    ];
    render(<NotificationList />);

    const descElements = screen.queryAllByText(/From/);
    expect(descElements).toHaveLength(0);
  });

  it('should format time as "Just now" for recent', () => {
    mockNotifications = [
      { id: 1, title: 'Recent', isRead: false, createdAt: new Date().toISOString() },
    ];
    render(<NotificationList />);
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('should format time as minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    mockNotifications = [
      { id: 1, title: 'Minutes', isRead: false, createdAt: fiveMinAgo },
    ];
    render(<NotificationList />);
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('should format time as hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    mockNotifications = [
      { id: 1, title: 'Hours', isRead: false, createdAt: twoHoursAgo },
    ];
    render(<NotificationList />);
    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('should format time as days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    mockNotifications = [
      { id: 1, title: 'Days', isRead: false, createdAt: threeDaysAgo },
    ];
    render(<NotificationList />);
    expect(screen.getByText('3d ago')).toBeInTheDocument();
  });

  it('should render multiple notifications', () => {
    mockNotifications = [
      { id: 1, title: 'First', description: 'Desc 1', isRead: false, createdAt: new Date().toISOString() },
      { id: 2, title: 'Second', description: 'Desc 2', isRead: true, createdAt: new Date().toISOString() },
    ];
    render(<NotificationList />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.queryByText('No notifications')).not.toBeInTheDocument();
  });
});
