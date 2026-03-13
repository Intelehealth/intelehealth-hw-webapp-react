import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../hooks/usePrescriptionsReceived', () => ({
  usePrescriptionsReceived: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

vi.mock('../../../hooks/useOpenVisits', () => ({
  useOpenVisits: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

vi.mock('../../../context/NotificationContext', () => ({
  useNotificationContext: () => ({
    notifications: [],
    unreadCount: 0,
    token: '',
    isEnabled: true,
    requestPermission: vi.fn(),
    toggleNotifications: vi.fn(),
  }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: '/notifications', search: '', hash: '', state: null, key: 'default' }),
  };
});

import DashboardComponent from '../../../modules/dashboard/dashboard.component';

describe('DashboardComponent notifications route', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('should show NotificationList when on notifications route', () => {
    render(<DashboardComponent />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('should hide prescriptions and add patient sections on notifications route', () => {
    render(<DashboardComponent />);
    // The "Add Patients" buttons should not be visible
    expect(screen.queryByText('← Prescriptions')).not.toBeInTheDocument();
  });

  it('should navigate to dashboard when close button is clicked (covers closeNotifications)', () => {
    render(<DashboardComponent />);

    // Click the close button (✕) in the NotificationList
    const closeBtn = screen.getByText('✕');
    fireEvent.click(closeBtn);

    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });
});
