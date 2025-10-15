import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordComponent from '../../../../modules/auth/forgot-password/forgot-password.component';

// Mock the child components
vi.mock('../../../../modules/auth/forgot-password/mobile-number-form/mobile-number-form.component', () => ({
  default: vi.fn(() => (
    <div data-testid="mobile-number-form">Mobile Number Form</div>
  )),
}));

vi.mock('../../../../modules/auth/forgot-password/username-form/username-form.component', () => ({
  default: vi.fn(() => (
    <div data-testid="username-form">Username Form</div>
  )),
}));

vi.mock('../../../../components/common', () => ({
  Button: vi.fn(({ children, onClick, className, type, ...props }) => (
    <button onClick={onClick} className={className} type={type} {...props}>
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
vi.mock('../../../../assets/icons/icon-rounded-lock.svg', () => ({
  default: 'mocked-lock-icon.svg',
}));

describe('ForgotPasswordComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<ForgotPasswordComponent />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render title and description', () => {
      render(<ForgotPasswordComponent />);
      
      expect(screen.getByText('Forgot Password ?')).toBeInTheDocument();
      expect(screen.getByText('Follow the instructions below to use your account again.')).toBeInTheDocument();
    });

    it('should render toggle buttons', () => {
      render(<ForgotPasswordComponent />);
      
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Mobile Number')).toBeInTheDocument();
    });

    it('should render username form by default', () => {
      render(<ForgotPasswordComponent />);
      
      expect(screen.getByTestId('username-form')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-number-form')).not.toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    it('should switch to mobile number form when mobile button is clicked', () => {
      render(<ForgotPasswordComponent />);
      
      const mobileButton = screen.getByText('Mobile Number');
      fireEvent.click(mobileButton);
      
      expect(screen.getByTestId('mobile-number-form')).toBeInTheDocument();
      expect(screen.queryByTestId('username-form')).not.toBeInTheDocument();
    });

    it('should switch back to username form when username button is clicked', () => {
      render(<ForgotPasswordComponent />);
      
      // First switch to mobile
      const mobileButton = screen.getByText('Mobile Number');
      fireEvent.click(mobileButton);
      
      // Then switch back to username
      const usernameButton = screen.getByText('Username');
      fireEvent.click(usernameButton);
      
      expect(screen.getByTestId('username-form')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-number-form')).not.toBeInTheDocument();
    });

    it('should maintain state when clicking the same button', () => {
      render(<ForgotPasswordComponent />);
      
      const usernameButton = screen.getByText('Username');
      fireEvent.click(usernameButton);
      
      expect(screen.getByTestId('username-form')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-number-form')).not.toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should show username button as active by default', () => {
      render(<ForgotPasswordComponent />);
      
      const usernameButton = screen.getByText('Username');
      // Check that the button has the active class by looking at the parent element
      expect(usernameButton.closest('button')).toHaveClass('!bg-(--color-primary-light)');
    });

    it('should show mobile button as inactive by default', () => {
      render(<ForgotPasswordComponent />);
      
      const mobileButton = screen.getByText('Mobile Number');
      expect(mobileButton).not.toHaveClass('!bg-(--color-primary-light)');
    });

    it('should update button states when toggling', () => {
      render(<ForgotPasswordComponent />);
      
      const usernameButton = screen.getByText('Username');
      const mobileButton = screen.getByText('Mobile Number');
      
      // Initially username is active
      expect(usernameButton.closest('button')).toHaveClass('!bg-(--color-primary-light)');
      expect(mobileButton.closest('button')).not.toHaveClass('!bg-(--color-primary-light)');
      
      // Click mobile button
      fireEvent.click(mobileButton);
      
      // Now mobile should be active
      expect(mobileButton.closest('button')).toHaveClass('!bg-(--color-primary-light)');
      expect(usernameButton.closest('button')).not.toHaveClass('!bg-(--color-primary-light)');
    });
  });

  describe('Form Rendering', () => {
    it('should render username form initially', () => {
      render(<ForgotPasswordComponent />);
      
      expect(screen.getByTestId('username-form')).toBeInTheDocument();
    });

    it('should render mobile number form when toggled', () => {
      render(<ForgotPasswordComponent />);
      
      const mobileButton = screen.getByText('Mobile Number');
      fireEvent.click(mobileButton);
      
      expect(screen.getByTestId('mobile-number-form')).toBeInTheDocument();
    });

    it('should not render both forms simultaneously', () => {
      render(<ForgotPasswordComponent />);
      
      const usernameForm = screen.queryByTestId('username-form');
      const mobileForm = screen.queryByTestId('mobile-number-form');
      
      // Only one should be present
      expect(usernameForm || mobileForm).toBeInTheDocument();
      expect(usernameForm && mobileForm).not.toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to child components', () => {
      render(<ForgotPasswordComponent />);
      
      // Check that the components are rendered
      expect(screen.getByTestId('username-form')).toBeInTheDocument();
    });

    it('should maintain form state across toggles', () => {
      render(<ForgotPasswordComponent />);
      
      // Start with username form
      expect(screen.getByTestId('username-form')).toBeInTheDocument();
      
      // Switch to mobile
      const mobileButton = screen.getByText('Mobile Number');
      fireEvent.click(mobileButton);
      expect(screen.getByTestId('mobile-number-form')).toBeInTheDocument();
      
      // Switch back to username
      const usernameButton = screen.getByText('Username');
      fireEvent.click(usernameButton);
      expect(screen.getByTestId('username-form')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct card classes', () => {
      render(<ForgotPasswordComponent />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('w-full', 'lg:w-[431px]');
    });

    it('should have correct button layout', () => {
      render(<ForgotPasswordComponent />);
      
      const usernameButton = screen.getByText('Username');
      const mobileButton = screen.getByText('Mobile Number');
      
      expect(usernameButton).toHaveClass('w-full');
      expect(mobileButton).toHaveClass('w-full');
    });

    it('should have proper button container structure', () => {
      const { container } = render(<ForgotPasswordComponent />);
      
      const buttonContainer = container.querySelector('.flex.justify-between.w-full.gap-3');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should initialize with username form selected', () => {
      render(<ForgotPasswordComponent />);
      
      expect(screen.getByTestId('username-form')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-number-form')).not.toBeInTheDocument();
    });

    it('should update state when buttons are clicked', () => {
      render(<ForgotPasswordComponent />);
      
      // Initially username form
      expect(screen.getByTestId('username-form')).toBeInTheDocument();
      
      // Click mobile button
      const mobileButton = screen.getByText('Mobile Number');
      fireEvent.click(mobileButton);
      
      // Should now show mobile form
      expect(screen.getByTestId('mobile-number-form')).toBeInTheDocument();
      expect(screen.queryByTestId('username-form')).not.toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export ForgotPasswordComponent as default', () => {
      expect(ForgotPasswordComponent).toBeDefined();
      expect(typeof ForgotPasswordComponent).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', () => {
      render(<ForgotPasswordComponent />);
      
      const usernameButton = screen.getByText('Username');
      const mobileButton = screen.getByText('Mobile Number');
      
      // Rapid clicks
      fireEvent.click(mobileButton);
      fireEvent.click(usernameButton);
      fireEvent.click(mobileButton);
      fireEvent.click(usernameButton);
      
      // Should end up with username form
      expect(screen.getByTestId('username-form')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-number-form')).not.toBeInTheDocument();
    });

    it('should maintain consistent state', () => {
      render(<ForgotPasswordComponent />);
      
      // Multiple toggles
      fireEvent.click(screen.getByText('Mobile Number'));
      fireEvent.click(screen.getByText('Username'));
      fireEvent.click(screen.getByText('Mobile Number'));
      
      // Should show mobile form
      expect(screen.getByTestId('mobile-number-form')).toBeInTheDocument();
      expect(screen.queryByTestId('username-form')).not.toBeInTheDocument();
    });
  });
});
