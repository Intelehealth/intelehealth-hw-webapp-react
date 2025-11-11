import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useLocation } from 'react-router-dom';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordComponent from '../../../../modules/auth/reset-password/reset-password.component';
import { useResetPassword } from '../../../../modules/auth/reset-password/reset-password.hooks';

// Mock functions
const mockNavigate = vi.fn();

// Mock the hooks and dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => mockNavigate),

  useLocation: vi.fn(() => ({
    state: { userUuid: 'test-uuid-123' },
  })),

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

// Mock react-hook-form
const mockRegister = vi.fn(() => ({ name: 'field' }));
const mockHandleSubmit = vi.fn((fn) => (e: any) => {
  e.preventDefault();
  fn({});
});
const mockSetValue = vi.fn();
let mockErrors: any = {};

// Create a getter function for errors so it's reactive
const getMockErrors = () => mockErrors;

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    formState: { 
      get errors() {
        return getMockErrors();
      }
    },
    setValue: mockSetValue,
  })),
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
    mockErrors = {}; // Reset errors
    // Reset mock implementations - ensure location returns state with userUuid
    vi.mocked(useLocation).mockReturnValue({

      state: { userUuid: 'test-uuid-123' },
      pathname: '/auth/reset-password',
      search: '',
      hash: '',
      key: 'default',
    } as any);

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
      

      // Capture the onSubmit callback passed to handleSubmit
      let capturedOnSubmit: ((data: any) => Promise<void>) | null = null;
      const captureHandleSubmit = vi.fn((fn) => {
        capturedOnSubmit = fn;
        return (e: any) => {
          e.preventDefault();
          if (capturedOnSubmit) {
            // Call with form data to trigger onSubmit (lines 62-65)
            capturedOnSubmit({ newPassword: 'NewPassword123!', confirmPassword: 'NewPassword123!' });
          }
        };
      });
      
      // Override useForm mock for this test
      const useFormModule = await import('react-hook-form');
      vi.mocked(useFormModule.useForm).mockReturnValueOnce({
        register: mockRegister,
        handleSubmit: captureHandleSubmit,
        formState: { errors: mockErrors },
        setValue: mockSetValue,
      } as any);
      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: 'Continue' });
      fireEvent.click(submitButton);
      
      // Wait for form submission to complete
      await waitFor(() => {
        // Verify onSubmit function (lines 62-65) was executed by checking handleResetPassword was called
        expect(mockHandleResetPassword).toHaveBeenCalledWith('test-uuid-123', {
          newPassword: 'NewPassword123!',
        });
      });
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
      vi.mocked(useLocation).mockReturnValue({
        state: null,
        pathname: '/auth/reset-password',
        search: '',
        hash: '',
        key: 'default',
      } as any);

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });

    it('should redirect to login when userUuid is missing', () => {
      vi.mocked(useLocation).mockReturnValue({
        state: {},
        pathname: '/auth/reset-password',
        search: '',
        hash: '',
        key: 'default',
      } as any);

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

      // Set up errors to show validation error
      mockErrors = {
        newPassword: {
          type: 'min',
          message: 'Password must be at least 6 characters',
        },
      };

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      // Wait for validation error to appear (lines 131-133)
      // The error should be visible immediately since mockErrors is set
      await waitFor(() => {
        const errorMessage = screen.queryByText('Password must be at least 6 characters') || 
                            screen.queryByText(/password must be at least 6 characters/i) || 
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

      // Set up errors to show validation error for password mismatch
      mockErrors = {
        confirmPassword: {
          type: 'oneOf',
          message: 'Passwords must match',
        },
      };

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );
      
      // Wait for validation error to appear (lines 154-156)
      // The error message should be "Passwords must match" from the validation schema
      // The error should be visible immediately since mockErrors is set
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

  describe('Form Submission Coverage', () => {
    it('should call handleResetPassword with correct parameters when form is submitted', async () => {
      // Ensure handleResetPassword is a resolved promise to properly test async onSubmit
      mockHandleResetPassword.mockResolvedValue(undefined);
      
      // Create a mock that properly handles async onSubmit
      let capturedOnSubmit: ((data: any) => Promise<void>) | null = null;
      
      const asyncHandleSubmit = vi.fn((fn) => {
        capturedOnSubmit = fn;
        // Return the submit handler that will be attached to the form
        return async (e: any) => {
          e.preventDefault();
          e.stopPropagation();
          if (capturedOnSubmit) {
            // Explicitly call onSubmit with await to cover lines 62-65
            await capturedOnSubmit({ 
              newPassword: 'TestPassword123!', 
              confirmPassword: 'TestPassword123!' 
            });
          }
        };
      });

      // Override useForm mock
      const useFormModule = await import('react-hook-form');
      vi.mocked(useFormModule.useForm).mockReturnValueOnce({
        register: mockRegister,
        handleSubmit: asyncHandleSubmit,
        formState: { errors: {} },
        setValue: mockSetValue,
      } as any);

      render(
        <ResetPasswordComponent
          changeTitle={mockChangeTitle}
          changeDescription={mockChangeDescription}
        />
      );

      // Wait for handleSubmit to be called and capture onSubmit
      await waitFor(() => {
        expect(asyncHandleSubmit).toHaveBeenCalled();
        expect(capturedOnSubmit).not.toBeNull();
      });

      // Directly call the captured onSubmit function to test lines 62-65
      expect(capturedOnSubmit).not.toBeNull();
      await capturedOnSubmit!({ 
        newPassword: 'TestPassword123!', 
        confirmPassword: 'TestPassword123!' 
      });

      // Wait for async onSubmit to complete
      await waitFor(() => {
        // Verify onSubmit was called and handleResetPassword was invoked with correct params (lines 62-65)
        expect(mockHandleResetPassword).toHaveBeenCalledWith('test-uuid-123', {
          newPassword: 'TestPassword123!',
        });
      });
    });
  });
});
