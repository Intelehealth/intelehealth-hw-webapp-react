import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsernameFormComponent from '../../../../../modules/auth/forgot-password/username-form/username-form.component';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock('../../../../../components/common', () => ({
  Button: vi.fn(({ children, onClick, type, ...props }) => (
    <button onClick={onClick} type={type} {...props}>
      {children}
    </button>
  )),
  Input: vi.fn(({ register, error, ...props }) => (
    <div>
      <input {...register} {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  )),
}));

// Mock assets
vi.mock('../../../../../assets/icons/icon-right-arrow.svg', () => ({
  default: 'mocked-right-arrow.svg',
}));
vi.mock('../../../../../assets/icons/icon-rounded-lock.svg', () => ({
  default: 'mocked-lock-icon.svg',
}));

describe('UsernameFormComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<UsernameFormComponent />);
      expect(screen.getByText('Enter Username')).toBeInTheDocument();
    });

    it('should render form elements', () => {
      render(<UsernameFormComponent />);
      
      expect(screen.getByText('Enter Username')).toBeInTheDocument();
      expect(screen.getByText('Please enter your username provided by Intelehealth')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty username', async () => {
      render(<UsernameFormComponent />);
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });

    it('should accept valid username', async () => {
      render(<UsernameFormComponent />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-otp', {
          state: {
            value: 'testuser',
            type: 'username',
            title: 'Forgot Password !',
            description: 'Follow the instructions below to use your account again.',
            icon: 'mocked-lock-icon.svg',
            otpFor: 'password',
          },
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('should navigate to verify-otp with correct state', async () => {
      render(<UsernameFormComponent />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameInput, { target: { value: 'testuser123' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-otp', {
          state: {
            value: 'testuser123',
            type: 'username',
            title: 'Forgot Password !',
            description: 'Follow the instructions below to use your account again.',
            icon: 'mocked-lock-icon.svg',
            otpFor: 'password',
          },
        });
      });
    });

    it('should not navigate when form is invalid', async () => {
      render(<UsernameFormComponent />);
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Input Handling', () => {
    it('should handle username input changes', () => {
      render(<UsernameFormComponent />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      
      expect(usernameInput).toHaveValue('testuser');
    });

    it('should handle special characters in username', () => {
      render(<UsernameFormComponent />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameInput, { target: { value: 'test_user-123' } });
      
      expect(usernameInput).toHaveValue('test_user-123');
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct form structure', () => {
      const { container } = render(<UsernameFormComponent />);
      
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveClass('w-full');
    });

    it('should have correct input container layout', () => {
      const { container } = render(<UsernameFormComponent />);
      
      const inputContainer = container.querySelector('.mb-2.lg\\:mb-4');
      expect(inputContainer).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate with form validation', async () => {
      render(<UsernameFormComponent />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameInput, { target: { value: '' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });

    it('should integrate with navigation', async () => {
      render(<UsernameFormComponent />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long username', () => {
      render(<UsernameFormComponent />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      const longUsername = 'A'.repeat(1000);
      fireEvent.change(usernameInput, { target: { value: longUsername } });
      
      expect(usernameInput).toHaveValue(longUsername);
    });

    it('should handle empty form submission', async () => {
      render(<UsernameFormComponent />);
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });

    it('should handle username with spaces', () => {
      render(<UsernameFormComponent />);
      
      const usernameInput = screen.getByPlaceholderText('Enter your username');
      fireEvent.change(usernameInput, { target: { value: 'test user 123' } });
      
      expect(usernameInput).toHaveValue('test user 123');
    });
  });

  describe('Component Exports', () => {
    it('should export UsernameFormComponent as default', () => {
      expect(UsernameFormComponent).toBeDefined();
      expect(typeof UsernameFormComponent).toBe('function');
    });
  });
});
