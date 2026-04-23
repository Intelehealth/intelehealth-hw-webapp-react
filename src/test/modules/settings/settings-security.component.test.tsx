import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsSecurity from '../../../modules/settings/settings-security.component';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockHook = {
  values: { currentPassword: '', newPassword: '', confirmPassword: '' },
  errors: {} as Record<string, string | undefined>,
  isSaving: false,
  setCurrentPassword: vi.fn(),
  setNewPassword: vi.fn(),
  setConfirmPassword: vi.fn(),
  handleGenerate: vi.fn(),
  handleSave: vi.fn(),
};

vi.mock('../../../modules/settings/settings.hooks', () => ({
  useChangePassword: () => mockHook,
}));

describe('SettingsSecurity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook.values = { currentPassword: '', newPassword: '', confirmPassword: '' };
    mockHook.errors = {};
    mockHook.isSaving = false;
  });

  it('renders Security heading and Change Password subheading', () => {
    render(<SettingsSecurity />);
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('renders all three password inputs with correct placeholders', () => {
    render(<SettingsSecurity />);
    expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
  });

  it('renders Generate a new password link with help icon', () => {
    render(<SettingsSecurity />);
    expect(screen.getByText('Generate a new password')).toBeInTheDocument();
    expect(screen.getByAltText('help')).toBeInTheDocument();
  });

  it('calls handleGenerate when Generate link is clicked', () => {
    render(<SettingsSecurity />);
    fireEvent.click(screen.getByText('Generate a new password'));
    expect(mockHook.handleGenerate).toHaveBeenCalled();
  });

  it('calls setCurrentPassword when current password input changes', () => {
    render(<SettingsSecurity />);
    const input = screen.getByPlaceholderText('Enter current password');
    fireEvent.change(input, { target: { value: 'OldPass1' } });
    expect(mockHook.setCurrentPassword).toHaveBeenCalledWith('OldPass1');
  });

  it('calls setNewPassword when new password input changes', () => {
    render(<SettingsSecurity />);
    const input = screen.getByPlaceholderText('Enter new password');
    fireEvent.change(input, { target: { value: 'NewPass1' } });
    expect(mockHook.setNewPassword).toHaveBeenCalledWith('NewPass1');
  });

  it('calls setConfirmPassword when confirm input changes', () => {
    render(<SettingsSecurity />);
    const input = screen.getByPlaceholderText('Confirm password');
    fireEvent.change(input, { target: { value: 'NewPass1' } });
    expect(mockHook.setConfirmPassword).toHaveBeenCalledWith('NewPass1');
  });

  it('displays field-level errors when present', () => {
    mockHook.errors = {
      currentPassword: 'Enter current password',
      newPassword: 'Weak password',
      confirmPassword: 'Mismatch',
    };
    render(<SettingsSecurity />);
    expect(screen.getByText('Enter current password')).toBeInTheDocument();
    expect(screen.getByText('Weak password')).toBeInTheDocument();
    expect(screen.getByText('Mismatch')).toBeInTheDocument();
  });

  it('navigates back when Back is clicked', () => {
    render(<SettingsSecurity />);
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('calls handleSave when Save changes is clicked', () => {
    render(<SettingsSecurity />);
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));
    expect(mockHook.handleSave).toHaveBeenCalled();
  });

  it('shows Saving... when isSaving is true', () => {
    mockHook.isSaving = true;
    render(<SettingsSecurity />);
    expect(screen.getByText(/Saving/i)).toBeInTheDocument();
  });

  it('reflects values from the hook into the inputs', () => {
    mockHook.values = {
      currentPassword: 'old',
      newPassword: 'new',
      confirmPassword: 'confirm',
    };
    render(<SettingsSecurity />);
    expect(screen.getByPlaceholderText('Enter current password')).toHaveValue('old');
    expect(screen.getByPlaceholderText('Enter new password')).toHaveValue('new');
    expect(screen.getByPlaceholderText('Confirm password')).toHaveValue('confirm');
  });
});
