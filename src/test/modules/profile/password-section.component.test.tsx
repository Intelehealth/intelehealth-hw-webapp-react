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
  default: ({ label, type, value, onChange, placeholder, variant, size, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e)}
        placeholder={placeholder}
        data-variant={variant}
        data-size={size}
        {...props}
      />
    </div>
  ),
}));

// Mock the icon
vi.mock('../../../assets/icons/icon-rounded-question-mark.svg', () => ({
  default: 'icon-question-mark.svg',
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

  it('should render change password title with correct styling', () => {
    const { container } = render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const title = container.querySelector('h3');
    expect(title).toHaveClass('text-lg', 'font-bold', 'pb-2');
    expect(title).toHaveStyle({ color: 'var(--color-primary)' });
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

  it('should render generate password button with icon', () => {
    const { container } = render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const icon = container.querySelector('img[alt="help"]');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', 'icon-question-mark.svg');
    expect(icon).toHaveClass('w-4', 'h-4');
  });

  it('should render generate password button with correct styling', () => {
    render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword} />
    );

    const generateButton = screen.getByText('Generate a new password').closest('button');
    expect(generateButton).toHaveClass(
      'text-sm',
      'font-bold',
      'inline-flex',
      'items-center',
      'gap-1',
      'hover:underline',
      'cursor-pointer'
    );
    expect(generateButton).toHaveStyle({ color: 'var(--color-primary)' });
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

    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });

    expect(mockOnPasswordChange).toHaveBeenCalledWith({
      ...mockPasswordData,
      newPassword: 'newpass123',
    });
  });

  it('should call onPasswordChange when Confirm new password changes', () => {
    render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
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

    const generateButton = screen.getByText('Generate a new password').closest('button');
    fireEvent.click(generateButton!);

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

  it('should have correct grid layout', () => {
    const { container } = render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-3', 'gap-4');
  });

  it('should pass correct props to Input components', () => {
    const { container } = render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const inputs = container.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('data-variant', 'default');
      expect(input).toHaveAttribute('data-size', 'md');
    });
  });

  it('should handle onChange events with correct data structure', () => {
    const existingData = {
      currentPassword: 'old',
      newPassword: 'new',
      confirmPassword: 'confirm',
    };

    render(
      <PasswordSection
        passwordData={existingData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    fireEvent.change(currentPasswordInput, { target: { value: 'updated' } });

    expect(mockOnPasswordChange).toHaveBeenCalledWith({
      currentPassword: 'updated',
      newPassword: 'new',
      confirmPassword: 'confirm',
    });
  });

  it('should maintain all fields when updating a single field', () => {
    const existingData = {
      currentPassword: 'current',
      newPassword: 'newpass',
      confirmPassword: 'confirmpass',
    };

    render(
      <PasswordSection
        passwordData={existingData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    fireEvent.change(newPasswordInput, { target: { value: 'updatednew' } });

    expect(mockOnPasswordChange).toHaveBeenCalledWith({
      currentPassword: 'current',
      newPassword: 'updatednew',
      confirmPassword: 'confirmpass',
    });
  });

  it('should render new password label correctly', () => {
    const { container } = render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const newPasswordLabel = container.querySelector('label.form-label');
    expect(newPasswordLabel).toBeInTheDocument();
    expect(newPasswordLabel).toHaveTextContent('New password');
  });

  it('should have correct wrapper structure for new password field', () => {
    const { container } = render(
      <PasswordSection
        passwordData={mockPasswordData}
        onPasswordChange={mockOnPasswordChange}
        onGeneratePassword={mockOnGeneratePassword}
      />
    );

    const newPasswordWrapper = container.querySelector('.flex.items-center.justify-between.mb-2');
    expect(newPasswordWrapper).toBeInTheDocument();
  });
});

