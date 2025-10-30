import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PasswordSection from '../../../modules/profile/password-section.component';

// Mock the Button component
vi.mock('../../../components/common/button.component', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock the Input component
vi.mock('../../../components/common/input.component', () => ({
  default: ({ label, type, value, onChange, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e)}
        {...props}
      />
    </div>
  ),
}));

describe('PasswordSection', () => {
  const mockPasswordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  const mockOnPasswordChange = vi.fn();
  const mockOnGeneratePassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(
        <PasswordSection
          passwordData={mockPasswordData}
          onPasswordChange={mockOnPasswordChange}
          onGeneratePassword={mockOnGeneratePassword}
        />
      );
    }).not.toThrow();
  });

  it('should render change password title', () => {
    render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('should render all password input fields', () => {
    render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    expect(screen.getByText('Current password')).toBeInTheDocument();
    expect(screen.getByText('New password')).toBeInTheDocument();
    expect(screen.getByText('Confirm new password')).toBeInTheDocument();
  });

  it('should render generate password button', () => {
    render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    expect(screen.getByText('Generate a new password')).toBeInTheDocument();
  });

  it('should call onPasswordChange when current password changes', () => {
    render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });

    expect(mockOnPasswordChange).toHaveBeenCalledWith({
      ...mockPasswordData,
      currentPassword: 'oldpass123',
    });
  });

  it('should call onPasswordChange when new password changes', () => {
    render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const newPasswordInput = screen.getAllByDisplayValue('')[1];
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });

    expect(mockOnPasswordChange).toHaveBeenCalledWith({
      ...mockPasswordData,
      newPassword: 'newpass123',
    });
  });

  it('should call onPasswordChange when confirm password changes', () => {
    render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const confirmPasswordInput = screen.getAllByDisplayValue('')[2];
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    expect(mockOnPasswordChange).toHaveBeenCalledWith({
      ...mockPasswordData,
      confirmPassword: 'newpass123',
    });
  });

  it('should call onGeneratePassword when generate button is clicked', () => {
    render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const generateButton = screen.getByText('Generate a new password');
    fireEvent.click(generateButton);

    expect(mockOnGeneratePassword).toHaveBeenCalledTimes(1);
  });

  it('should display current password values', () => {
    const passwordDataWithValues = {
      currentPassword: 'current123',
      newPassword: 'new123',
      confirmPassword: 'new123',
    };

    render(
      <PasswordSection
        passwordData={passwordDataWithValues}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    expect(screen.getByDisplayValue('current123')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('new123')).toHaveLength(2);
  });

  it('should have correct section structure', () => {
    const { container } = render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const section = container.querySelector('div');
    expect(section).toHaveClass('space-y-2');
  });
});
