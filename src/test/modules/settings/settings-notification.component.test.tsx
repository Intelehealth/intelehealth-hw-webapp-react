import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsNotification from '../../../modules/settings/settings-notification.component';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockHook = {
  notificationAlerts: true,
  blackoutEnabled: false,
  isSaving: false,
  toggleNotificationAlerts: vi.fn(),
  toggleBlackout: vi.fn(),
  handleSave: vi.fn(),
};

vi.mock('../../../modules/settings/settings.hooks', () => ({
  useNotificationSettings: () => mockHook,
}));

describe('SettingsNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook.notificationAlerts = true;
    mockHook.blackoutEnabled = false;
    mockHook.isSaving = false;
  });

  it('renders the section heading and both toggles', () => {
    render(<SettingsNotification />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Notification alerts')).toBeInTheDocument();
    expect(
      screen.getByText('Blackout (From 9:00 pm to 6:00 am)')
    ).toBeInTheDocument();
  });

  it('renders both helper descriptions', () => {
    render(<SettingsNotification />);
    expect(
      screen.getByText(
        /Turning off notifications, you will not receive any notifications/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/To disable notification between below time period/i)
    ).toBeInTheDocument();
  });

  it('renders Back and Save changes buttons', () => {
    render(<SettingsNotification />);
    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Save changes/i })
    ).toBeInTheDocument();
  });

  it('navigates back when Back is clicked', () => {
    render(<SettingsNotification />);
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('calls handleSave when Save changes is clicked', () => {
    render(<SettingsNotification />);
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));
    expect(mockHook.handleSave).toHaveBeenCalled();
  });

  it('shows the Saving... loading state when isSaving is true', () => {
    mockHook.isSaving = true;
    render(<SettingsNotification />);
    expect(screen.getByText(/Saving/i)).toBeInTheDocument();
  });

  it('invokes toggleBlackout when blackout toggle is clicked', () => {
    render(<SettingsNotification />);
    const checkboxes = screen.getAllByRole('checkbox');
    // Second checkbox = blackout
    fireEvent.click(checkboxes[1]);
    expect(mockHook.toggleBlackout).toHaveBeenCalled();
  });

  it('invokes toggleNotificationAlerts when the alerts toggle is clicked', () => {
    render(<SettingsNotification />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(mockHook.toggleNotificationAlerts).toHaveBeenCalled();
  });
});
