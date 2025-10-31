import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MobileNumberFormComponent from '../../../../../modules/auth/forgot-password/mobile-number-form/mobile-number-form.component';

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
  Input: vi.fn(({ register, error, rightIcon, leftIcon, size, variant, isRequired, ...props }) => (
    <div>
      <input {...register} {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  )),
}));

vi.mock('../../../../../modules/auth/common/contry-code-dropdown.component', () => ({
  default: vi.fn(({ onChange }) => (
    <div data-testid="country-dropdown">
      <button onClick={() => onChange({ name: 'United States', code: 'us', dial_code: '+1' })}>
        Select Country
      </button>
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

describe('MobileNumberFormComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<MobileNumberFormComponent />);
      expect(screen.getByText('Enter Mobile Number')).toBeInTheDocument();
    });

    it('should render form elements', () => {
      render(<MobileNumberFormComponent />);
      
      expect(screen.getByText('Enter Mobile Number')).toBeInTheDocument();
      expect(screen.getByText('Please enter the mobile number registered with Intelehealth')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your mobile number')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('should render country code dropdown', () => {
      render(<MobileNumberFormComponent />);
      
      expect(screen.getByTestId('country-dropdown')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty mobile number', async () => {
      render(<MobileNumberFormComponent />);
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mobile number is required')).toBeInTheDocument();
      });
    });

    it('should show validation error for short mobile number', async () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      fireEvent.change(mobileInput, { target: { value: '123' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mobile number must be at least 10 digits')).toBeInTheDocument();
      });
    });

    it('should show validation error for long mobile number', async () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      fireEvent.change(mobileInput, { target: { value: '12345678901' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mobile number cannot exceed 10 digits')).toBeInTheDocument();
      });
    });

    it('should accept valid mobile number', async () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      fireEvent.change(mobileInput, { target: { value: '1234567890' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-otp', {
          state: {
            value: '1234567890',
            type: 'phoneNumber',
            title: 'Forgot Password !',
            description: 'Follow the instructions below to use your account again.',
            icon: 'mocked-lock-icon.svg',
            otpFor: 'password',
            countryCode: '',
          },
        });
      });
    });
  });

  describe('Country Code Selection', () => {
    it('should handle country code selection', async () => {
      render(<MobileNumberFormComponent />);
      
      const selectButton = screen.getByText('Select Country');
      fireEvent.click(selectButton);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      fireEvent.change(mobileInput, { target: { value: '1234567890' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-otp', {
          state: {
            value: '1234567890',
            type: 'phoneNumber',
            title: 'Forgot Password !',
            description: 'Follow the instructions below to use your account again.',
            icon: 'mocked-lock-icon.svg',
            otpFor: 'password',
            countryCode: '+1',
          },
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('should navigate to verify-otp with correct state', async () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      fireEvent.change(mobileInput, { target: { value: '9876543210' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-otp', {
          state: {
            value: '9876543210',
            type: 'phoneNumber',
            title: 'Forgot Password !',
            description: 'Follow the instructions below to use your account again.',
            icon: 'mocked-lock-icon.svg',
            otpFor: 'password',
            countryCode: '',
          },
        });
      });
    });

    it('should not navigate when form is invalid', async () => {
      render(<MobileNumberFormComponent />);
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Input Handling', () => {
    it('should handle mobile number input changes', () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      fireEvent.change(mobileInput, { target: { value: '1234567890' } });
      
      expect(mobileInput).toHaveValue('1234567890');
    });

    it('should enforce maxLength on mobile input', () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      expect(mobileInput).toHaveAttribute('maxLength', '10');
    });

    it('should set correct input type', () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      expect(mobileInput).toHaveAttribute('type', 'tel');
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct form structure', () => {
      const { container } = render(<MobileNumberFormComponent />);
      
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveClass('w-full');
    });

    it('should have correct input container layout', () => {
      const { container } = render(<MobileNumberFormComponent />);
      
      const inputContainer = container.querySelector('.flex.gap-2.justify-between.w-full');
      expect(inputContainer).toBeInTheDocument();
    });

    it('should have correct country dropdown container', () => {
      const { container } = render(<MobileNumberFormComponent />);
      
      const countryContainer = container.querySelector('.w-1\\/3');
      expect(countryContainer).toBeInTheDocument();
    });

    it('should have correct mobile input container', () => {
      const { container } = render(<MobileNumberFormComponent />);
      
      const mobileContainer = container.querySelector('.w-2\\/3');
      expect(mobileContainer).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate with form validation', async () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      fireEvent.change(mobileInput, { target: { value: '123' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mobile number must be at least 10 digits')).toBeInTheDocument();
      });
    });

    it('should integrate with navigation', async () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      fireEvent.change(mobileInput, { target: { value: '1234567890' } });
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long mobile number input', () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      const longNumber = '12345678901234567890';
      fireEvent.change(mobileInput, { target: { value: longNumber } });
      
      // The input should accept the value but the form validation will catch it
      expect(mobileInput).toHaveValue(longNumber);
    });

    it('should handle special characters in mobile number', () => {
      render(<MobileNumberFormComponent />);
      
      const mobileInput = screen.getByPlaceholderText('Enter your mobile number');
      fireEvent.change(mobileInput, { target: { value: '123-456-7890' } });
      
      expect(mobileInput).toHaveValue('123-456-7890');
    });

    it('should handle empty form submission', async () => {
      render(<MobileNumberFormComponent />);
      
      const submitButton = screen.getByText('Continue');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mobile number is required')).toBeInTheDocument();
      });
    });
  });

  describe('Component Exports', () => {
    it('should export MobileNumberFormComponent as default', () => {
      expect(MobileNumberFormComponent).toBeDefined();
      expect(typeof MobileNumberFormComponent).toBe('function');
    });
  });
});
