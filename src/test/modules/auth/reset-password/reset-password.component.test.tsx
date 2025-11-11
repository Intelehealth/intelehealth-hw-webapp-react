import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordComponent from '../../../../modules/auth/reset-password/reset-password.component';
import { useResetPassword } from '../../../../modules/auth/reset-password/reset-password.hooks';

// Mock functions
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();

// Mock the hooks and dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => mockNavigate),
  useLocation: () => mockUseLocation(),
}));

vi.mock('../../../../modules/auth/reset-password/reset-password.hooks', () => ({
  useResetPassword: vi.fn(),
}));

vi.mock('../../../../components/common', () => ({
  Button: vi.fn(({ children, onClick, type, isLoading, ...props }) => (
    <button onClick={onClick} type={type} disabled={isLoading} {...props}>
      {children}
    </button>
  )),
  Input: vi.fn(({ register, ...props }) => {
    // register is already the spread result from {...register('fieldName')}
    const registerProps = register || {};
    return <input {...registerProps} {...props} />;
  }),
}));

vi.mock('../../../../components/common/card.component', () => ({
  default: vi.fn(({ children, className }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  )),
}));

vi.mock('../../../../components/common/tooltip.component', () => ({
  default: vi.fn(({ children, text }) => (
    <div data-testid="tooltip" title={text}>
      {children}
    </div>
  )),
}));

vi.mock('../../../../modules/auth/common/auth-card-title.component', () => ({
  default: vi.fn(({ title, description, icon }) => (
    <div data-testid="auth-card-title">
      <h1>{title}</h1>
      <p>{description}</p>
      {icon && <img src={icon} alt="icon" />}
    </div>
  )),
}));

// Mock assets
vi.mock('../../../../assets/icons/icon-right-arrow.svg', () => ({
  default: 'mocked-right-arrow.svg',
}));
vi.mock('../../../../assets/icons/icon-rounded-lock.svg', () => ({
  default: 'mocked-lock-icon.svg',
}));
vi.mock('../../../../assets/icons/icon-rounded-question-mark.svg', () => ({
  default: 'mocked-question-icon.svg',
}));
vi.mock('../../../../assets/images/smiley-yellow.png', () => ({
  default: 'mocked-smiley.png',
}));

describe('ResetPasswordComponent', () => {
  const mockChangeTitle = vi.fn();
  const mockChangeDescription = vi.fn();
  const mockHandleResetPassword = vi.fn();
  const mockHandleGenerateNewPassword = vi.fn();
  const mockUseResetPassword = vi.mocked(useResetPassword);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations - default state with userUuid
    mockUseLocation.mockReturnValue({
      state: { userUuid: 'test-uuid-123' },
    });

    mockUseResetPassword.mockReturnValue({
      handleResetPassword: mockHandleResetPassword,
      handleGenerateNewPassword: mockHandleGenerateNewPassword,
      isResetSuccessful: false,
      loading: false,
    });
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render form when not successful', () => {
      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      expect(screen.getByText('Reset Password ?')).toBeInTheDocument();
      expect(screen.getByText('Enter your new password')).toBeInTheDocument();
      expect(screen.getByText('Generate a new password')).toBeInTheDocument();
    });

    it('should render success state when reset is successful', () => {
      mockUseResetPassword.mockReturnValue({
        handleResetPassword: mockHandleResetPassword,
        handleGenerateNewPassword: mockHandleGenerateNewPassword,
        isResetSuccessful: true,
        loading: false,
      });

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      expect(screen.getByText('Password Reset!')).toBeInTheDocument();
      expect(screen.getByText('Your password has changed successfully!')).toBeInTheDocument();
      expect(screen.getByText('Go to Login')).toBeInTheDocument();
    });
  });

  describe('Form Functionality', () => {
    it('should render form inputs correctly', () => {
      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      expect(screen.getByPlaceholderText('Enter your new password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('should handle form submission', async () => {
      mockHandleResetPassword.mockResolvedValue(undefined);
      
      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Enter your password');
      const form = newPasswordInput.closest('form');
      
      // Fill in the form with valid data
      fireEvent.change(newPasswordInput, { target: { value: 'newPassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newPassword123' } });
      
      // Submit the form directly (lines 62-65)
      if (form) {
        fireEvent.submit(form);
      }
      
      // Wait for async operation
      await waitFor(() => {
        expect(mockHandleResetPassword).toHaveBeenCalledWith('test-uuid-123', {
          newPassword: 'newPassword123',
        });
      }, { timeout: 3000 });
    });

    it('should show loading state during submission', () => {
      mockUseResetPassword.mockReturnValue({
        handleResetPassword: mockHandleResetPassword,
        handleGenerateNewPassword: mockHandleGenerateNewPassword,
        isResetSuccessful: false,
        loading: true,
      });

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      const submitButton = screen.getByRole('button', { name: 'Continue' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Generate Password Functionality', () => {
    it('should call generate password when clicked', () => {
      mockHandleGenerateNewPassword.mockReturnValue('GeneratedPassword123!');
      
      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      const generateButton = screen.getByText('Generate a new password');
      fireEvent.click(generateButton);
      
      expect(mockHandleGenerateNewPassword).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should redirect to login when no userUuid', () => {
      mockUseLocation.mockReturnValue({
        state: null,
      });

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });

    it('should redirect to login when userUuid is missing', () => {
      mockUseLocation.mockReturnValue({
        state: {},
      });

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });

    it('should navigate to login on success', () => {
      mockUseResetPassword.mockReturnValue({
        handleResetPassword: mockHandleResetPassword,
        handleGenerateNewPassword: mockHandleGenerateNewPassword,
        isResetSuccessful: true,
        loading: false,
      });

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      const loginButton = screen.getByText('Go to Login');
      fireEvent.click(loginButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Props Handling', () => {
    it('should call changeTitle and changeDescription on success', () => {
      mockUseResetPassword.mockReturnValue({
        handleResetPassword: mockHandleResetPassword,
        handleGenerateNewPassword: mockHandleGenerateNewPassword,
        isResetSuccessful: true,
        loading: false,
      });

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      expect(mockChangeTitle).toHaveBeenCalledWith('Password Reset!');
      expect(mockChangeDescription).toHaveBeenCalledWith(
        'Follow the instructions below to use your account again.'
      );
    });
  });

  describe('Tooltips', () => {
    it('should render tooltips with correct text', () => {
      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      const tooltips = screen.getAllByTestId('tooltip');
      expect(tooltips).toHaveLength(2);
      expect(tooltips[0]).toHaveAttribute('title', 'Enter the credentials given by intelehealth team');
      expect(tooltips[1]).toHaveAttribute('title', 'Generate a new random password for you');
    });
  });

  describe('Icons and Assets', () => {
    it('should render icons correctly', () => {
      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      expect(screen.getByAltText('icon')).toBeInTheDocument();
      expect(screen.getAllByAltText('info')).toHaveLength(2);
    });

    it('should render success icon when successful', () => {
      mockUseResetPassword.mockReturnValue({
        handleResetPassword: mockHandleResetPassword,
        handleGenerateNewPassword: mockHandleGenerateNewPassword,
        isResetSuccessful: true,
        loading: false,
      });

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      expect(screen.getByAltText('success')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display new password error message when validation fails', async () => {
      mockUseResetPassword.mockReturnValue({
        handleResetPassword: mockHandleResetPassword,
        handleGenerateNewPassword: mockHandleGenerateNewPassword,
        isResetSuccessful: false,
        loading: false,
      });

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const form = newPasswordInput.closest('form');
      
      // Trigger validation by entering invalid value (too short) and submitting
      fireEvent.change(newPasswordInput, { target: { value: '123' } });
      fireEvent.blur(newPasswordInput);
      
      // Submit the form to trigger validation
      if (form) {
        fireEvent.submit(form);
      }
      
      // Wait for validation error to appear (lines 131-133)
      await waitFor(() => {
        const errorMessage = screen.queryByText(/password must be at least 6 characters/i) || 
                            screen.queryByText(/password is required/i);
        expect(errorMessage).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display confirm password error message when passwords do not match', async () => {
      mockUseResetPassword.mockReturnValue({
        handleResetPassword: mockHandleResetPassword,
        handleGenerateNewPassword: mockHandleGenerateNewPassword,
        isResetSuccessful: false,
        loading: false,
      });

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      const newPasswordInput = screen.getByPlaceholderText('Enter your new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Enter your password');
      const form = newPasswordInput.closest('form');
      
      // Enter different passwords to trigger mismatch error
      fireEvent.change(newPasswordInput, { target: { value: 'newPassword123' } });
      fireEvent.blur(newPasswordInput);
      
      // Enter different confirm password
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentPassword' } });
      fireEvent.blur(confirmPasswordInput);
      
      // Submit the form to trigger validation
      if (form) {
        fireEvent.submit(form);
      }
      
      // Wait for validation error to appear (lines 154-156)
      // The error message should be "Passwords must match" from the validation schema
      await waitFor(() => {
        const errorMessage = screen.queryByText('Passwords must match') || 
                            screen.queryByText(/passwords must match/i) ||
                            screen.queryByText('Please confirm your password') ||
                            screen.queryByText(/please confirm your password/i);
        expect(errorMessage).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Component Exports', () => {
    it('should export ResetPasswordComponent as default', () => {
      expect(ResetPasswordComponent).toBeDefined();
      expect(typeof ResetPasswordComponent).toBe('function');
    });
  });
});
