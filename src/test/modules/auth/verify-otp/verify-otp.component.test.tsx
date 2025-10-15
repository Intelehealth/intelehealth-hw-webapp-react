import { fireEvent, render, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VerifyOtpComponent from '../../../../modules/auth/verify-otp/verify-otp.component';
import { useVerifyOtp } from '../../../../modules/auth/verify-otp/verify-otp.hooks';

// Mock the hooks and dependencies
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
}));

const mockUseLocation = vi.mocked(useLocation);

vi.mock('../../../../modules/auth/verify-otp/verify-otp.hooks', () => ({
  useVerifyOtp: vi.fn(),
}));

const mockUseVerifyOtp = vi.mocked(useVerifyOtp);

vi.mock('../../../../components/common', () => ({
  Button: vi.fn(({ children, onClick, disabled, isLoading, ...props }) => (
    <button onClick={onClick} disabled={disabled || isLoading} {...props}>
      {children}
    </button>
  )),
}));

vi.mock('../../../../components/common/card.component', () => ({
  default: vi.fn(({ children, className }) => (
    <div data-testid="card" className={className}>
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

describe('VerifyOtpComponent', () => {
  const mockHandleChange = vi.fn();
  const mockHandleKeyDown = vi.fn();
  const mockHandleResend = vi.fn();
  const mockVerifyOtp = vi.fn();
  const mockFormatTime = vi.fn((seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`);

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseLocation.mockReturnValue({
      key: 'mockKey',
      pathname: '/mock-path',
      search: '',
      hash: '',
      state: {
        title: 'Verify OTP',
        description: 'Enter the OTP sent to your device',
        icon: 'mocked-icon.svg',
        value: 'test@example.com',
        type: 'email',
        otpFor: 'reset-password',
      },
    });

    mockUseVerifyOtp.mockReturnValue({
      otp: ['', '', '', '', '', ''],
      timeLeft: 180,
      loading: false,
      inputsRef: { current: [] },
      handleChange: mockHandleChange,
      handleKeyDown: mockHandleKeyDown,
      handleResend: mockHandleResend,
      verifyOtp: mockVerifyOtp,
      formatTime: mockFormatTime,
      requestOtp: vi.fn(),
      userUuid: 'test-uuid',
    });
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<VerifyOtpComponent />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render title and description from state', () => {
      render(<VerifyOtpComponent />);
      
      expect(screen.getByText('Verify OTP')).toBeInTheDocument();
      expect(screen.getByText('Enter the OTP sent to your device')).toBeInTheDocument();
    });

    it('should render default title when state is empty', () => {
      mockUseLocation.mockReturnValue({
        state: null,
        key: '',
        pathname: '',
        search: '',
        hash: ''
      });

      render(<VerifyOtpComponent />);
      
      expect(screen.getByText('Verify OTP')).toBeInTheDocument();
    });

    it('should render OTP input fields', () => {
      render(<VerifyOtpComponent />);
      
      const otpInputs = screen.getAllByRole('textbox');
      expect(otpInputs).toHaveLength(6);
    });

    it('should render continue button', () => {
      render(<VerifyOtpComponent />);
      
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  describe('OTP Input Functionality', () => {
    it('should render OTP inputs with correct attributes', () => {
      render(<VerifyOtpComponent />);
      
      const otpInputs = screen.getAllByRole('textbox');
      otpInputs.forEach((input) => {
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('inputMode', 'numeric');
        expect(input).toHaveAttribute('maxLength', '1');
        expect(input).toHaveValue('');
      });
    });

    it('should call handleChange when input value changes', () => {
      render(<VerifyOtpComponent />);
      
      const firstInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(firstInput, { target: { value: '1' } });
      
      expect(mockHandleChange).toHaveBeenCalledWith(0, '1');
    });

    it('should call handleKeyDown when key is pressed', () => {
      render(<VerifyOtpComponent />);
      
      const firstInput = screen.getAllByRole('textbox')[0];
      fireEvent.keyDown(firstInput, { key: 'Backspace' });
      
      expect(mockHandleKeyDown).toHaveBeenCalledWith(0, expect.any(Object));
    });
  });

  describe('Timer Functionality', () => {
    it('should show resend timer when timeLeft > 0', () => {
      render(<VerifyOtpComponent />);
      
      expect(screen.getByText(/Resend in/)).toBeInTheDocument();
    });

    it('should show resend button when timeLeft = 0', () => {
      mockUseVerifyOtp.mockReturnValue({
        otp: ['', '', '', '', '', ''],
        timeLeft: 0,
        loading: false,
        inputsRef: { current: [] },
        handleChange: mockHandleChange,
        handleKeyDown: mockHandleKeyDown,
        handleResend: mockHandleResend,
        verifyOtp: mockVerifyOtp,
        formatTime: mockFormatTime,
        requestOtp: vi.fn(),
        userUuid: 'test-uuid',
      });

      render(<VerifyOtpComponent />);
      
      expect(screen.getByText('Resend')).toBeInTheDocument();
    });

    it('should call formatTime with correct timeLeft', () => {
      render(<VerifyOtpComponent />);
      
      expect(mockFormatTime).toHaveBeenCalledWith(180);
    });

    it('should handle resend button click', () => {
      mockUseVerifyOtp.mockReturnValue({
        otp: ['', '', '', '', '', ''],
        timeLeft: 0,
        loading: false,
        inputsRef: { current: [] },
        handleChange: mockHandleChange,
        handleKeyDown: mockHandleKeyDown,
        handleResend: mockHandleResend,
        verifyOtp: mockVerifyOtp,
        formatTime: mockFormatTime,
        requestOtp: vi.fn(),
        userUuid: 'test-uuid',
      });

      render(<VerifyOtpComponent />);
      
      const resendButton = screen.getByText('Resend');
      fireEvent.click(resendButton);
      
      expect(mockHandleResend).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state on resend button', () => {
      mockUseVerifyOtp.mockReturnValue({
        otp: ['', '', '', '', '', ''],
        timeLeft: 0,
        loading: true,
        inputsRef: { current: [] },
        handleChange: mockHandleChange,
        handleKeyDown: mockHandleKeyDown,
        handleResend: mockHandleResend,
        verifyOtp: mockVerifyOtp,
        formatTime: mockFormatTime,
        requestOtp: vi.fn(),
        userUuid: 'test-uuid',
      });

      render(<VerifyOtpComponent />);
      
      expect(screen.getByText('Resending...')).toBeInTheDocument();
    });

    it('should disable continue button when loading', () => {
      mockUseVerifyOtp.mockReturnValue({
        otp: ['1', '2', '3', '4', '5', '6'],
        timeLeft: 180,
        loading: true,
        inputsRef: { current: [] },
        handleChange: mockHandleChange,
        handleKeyDown: mockHandleKeyDown,
        handleResend: mockHandleResend,
        verifyOtp: mockVerifyOtp,
        formatTime: mockFormatTime,
        requestOtp: vi.fn(),
        userUuid: 'test-uuid',
      });

      render(<VerifyOtpComponent />);
      
      const continueButton = screen.getByRole('button', { name: 'Continue' });
      expect(continueButton).toBeDisabled();
    });
  });

  describe('OTP Validation', () => {
    it('should disable continue button when OTP is incomplete', () => {
      mockUseVerifyOtp.mockReturnValue({
        otp: ['1', '2', '', '4', '5', '6'],
        timeLeft: 180,
        loading: false,
        inputsRef: { current: [] },
        handleChange: mockHandleChange,
        handleKeyDown: mockHandleKeyDown,
        handleResend: mockHandleResend,
        verifyOtp: mockVerifyOtp,
        formatTime: mockFormatTime,
        requestOtp: vi.fn(),
        userUuid: 'test-uuid',
      });

      render(<VerifyOtpComponent />);
      
      const continueButton = screen.getByRole('button', { name: 'Continue' });
      expect(continueButton).toBeDisabled();
    });

    it('should enable continue button when OTP is complete', () => {
      mockUseVerifyOtp.mockReturnValue({
        otp: ['1', '2', '3', '4', '5', '6'],
        timeLeft: 180,
        loading: false,
        inputsRef: { current: [] },
        handleChange: mockHandleChange,
        handleKeyDown: mockHandleKeyDown,
        handleResend: mockHandleResend,
        verifyOtp: mockVerifyOtp,
        formatTime: mockFormatTime,
        requestOtp: vi.fn(),
        userUuid: 'test-uuid',
      });

      render(<VerifyOtpComponent />);
      
      const continueButton = screen.getByText('Continue');
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Continue Button Functionality', () => {
    it('should call verifyOtp when continue button is clicked', () => {
      mockUseVerifyOtp.mockReturnValue({
        otp: ['1', '2', '3', '4', '5', '6'],
        timeLeft: 180,
        loading: false,
        inputsRef: { current: [] },
        handleChange: mockHandleChange,
        handleKeyDown: mockHandleKeyDown,
        handleResend: mockHandleResend,
        verifyOtp: mockVerifyOtp,
        formatTime: mockFormatTime,
        requestOtp: vi.fn(),
        userUuid: 'test-uuid',
      });

      render(<VerifyOtpComponent />);
      
      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);
      
      expect(mockVerifyOtp).toHaveBeenCalled();
    });
  });

  describe('State Data Handling', () => {
    it('should use state data for title and description', () => {
      mockUseLocation.mockReturnValue({
        state: {
          title: 'Custom Title',
          description: 'Custom Description',
          icon: 'custom-icon.svg',
          value: 'test@example.com',
          type: 'email',
          otpFor: 'reset-password',
        },
        key: '',
        pathname: '',
        search: '',
        hash: ''
      });

      render(<VerifyOtpComponent />);
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Description')).toBeInTheDocument();
    });

    it('should use default values when state is null', () => {
      mockUseLocation.mockReturnValue({
        state: null,
        key: '',
        pathname: '',
        search: '',
        hash: ''
      });

      render(<VerifyOtpComponent />);
      
      expect(screen.getByText('Verify OTP')).toBeInTheDocument();
      // Check that description is empty by looking for the auth card title component
      expect(screen.getByTestId('auth-card-title')).toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export VerifyOtpComponent as default', () => {
      expect(VerifyOtpComponent).toBeDefined();
      expect(typeof VerifyOtpComponent).toBe('function');
    });
  });
});
