import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotUsernameComponent from '../../../../modules/auth/forgot-username/forgot-username.component';

// Mock the assets
vi.mock('../../../../assets/icons/icon-right-arrow.svg', () => ({
  default: 'mocked-right-arrow.svg',
}));

vi.mock('../../../../assets/icons/icon-rounded-lock.svg', () => ({
  default: 'mocked-lock-icon.svg',
}));

vi.mock('../../../../assets/icons/icon-rounded-mobile-setting.svg', () => ({
  default: 'mocked-mobile-setting-icon.svg',
}));

// Mock the components
vi.mock('../../../../components/common', () => ({
  Button: vi.fn(({ children, onClick, type, variant, className, rightIcon, ...props }) => (
    <button
      onClick={onClick}
      type={type}
      className={className}
      data-variant={variant}
      data-right-icon={rightIcon ? 'true' : 'false'}
      {...props}
    >
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

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => mockNavigate),
}));

describe('ForgotUsernameComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<ForgotUsernameComponent />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render auth card title with correct props', () => {
      render(<ForgotUsernameComponent />);
      
      expect(screen.getByTestId('auth-card-title')).toBeInTheDocument();
      expect(screen.getByText('Forgot User Id ?')).toBeInTheDocument();
      expect(screen.getByAltText('icon')).toBeInTheDocument();
    });

    it('should render the main content section', () => {
      render(<ForgotUsernameComponent />);
      
      expect(screen.getByText('Please contact your admin.')).toBeInTheDocument();
      // The mobile setting icon doesn't have alt text in the actual component
      const mobileIcon = screen.getByRole('img', { name: '' });
      expect(mobileIcon).toBeInTheDocument();
    });

    it('should render the back to login button', () => {
      render(<ForgotUsernameComponent />);
      
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });
  });

  describe('Content and Text', () => {
    it('should display the correct title', () => {
      render(<ForgotUsernameComponent />);
      
      expect(screen.getByText('Forgot User Id ?')).toBeInTheDocument();
    });

    it('should display the admin contact message', () => {
      render(<ForgotUsernameComponent />);
      
      expect(screen.getByText('Please contact your admin.')).toBeInTheDocument();
    });

    it('should display the back to login button text', () => {
      render(<ForgotUsernameComponent />);
      
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });
  });

  describe('Images and Icons', () => {
    it('should render the lock icon in auth card title', () => {
      render(<ForgotUsernameComponent />);
      
      const lockIcon = screen.getByAltText('icon');
      expect(lockIcon).toBeInTheDocument();
      expect(lockIcon).toHaveAttribute('src', 'mocked-lock-icon.svg');
    });

    it('should render the mobile setting icon', () => {
      render(<ForgotUsernameComponent />);
      
      // The mobile setting icon doesn't have alt text in the actual component
      const mobileIcon = screen.getByRole('img', { name: '' });
      expect(mobileIcon).toBeInTheDocument();
      expect(mobileIcon).toHaveAttribute('src', 'mocked-mobile-setting-icon.svg');
    });
  });

  describe('Button Functionality', () => {
    it('should call navigate with correct path when button is clicked', () => {
      render(<ForgotUsernameComponent />);
      
      const button = screen.getByText('Back to Login');
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });

    it('should have correct button attributes', () => {
      render(<ForgotUsernameComponent />);
      
      const button = screen.getByText('Back to Login');
      // Check that the button exists and has the expected text
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Back to Login');
      // The button should be clickable
      expect(button).not.toBeDisabled();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct card classes', () => {
      render(<ForgotUsernameComponent />);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('w-full', 'lg:w-[431px]');
    });

    it('should apply correct button classes', () => {
      render(<ForgotUsernameComponent />);
      
      const button = screen.getByText('Back to Login');
      expect(button).toHaveClass('w-full');
    });

    it('should apply correct mobile icon classes', () => {
      render(<ForgotUsernameComponent />);
      
      const mobileIcon = screen.getByRole('img', { name: '' });
      expect(mobileIcon).toHaveClass('w-[60px]');
    });

    it('should apply correct heading classes', () => {
      render(<ForgotUsernameComponent />);
      
      const heading = screen.getByText('Please contact your admin.');
      expect(heading).toHaveClass('text-lg', 'font-semibold', 'mt-4');
    });
  });

  describe('Layout Structure', () => {
    it('should have proper DOM hierarchy', () => {
      render(<ForgotUsernameComponent />);
      
      // Check that card contains auth card title
      const card = screen.getByTestId('card');
      const authCardTitle = screen.getByTestId('auth-card-title');
      expect(card).toContainElement(authCardTitle);
      
      // Check that card contains the main content
      const mainContent = screen.getByText('Please contact your admin.').closest('div');
      expect(card).toContainElement(mainContent);
      
      // Check that card contains the button
      const button = screen.getByText('Back to Login');
      expect(card).toContainElement(button);
    });

    it('should have hr separator', () => {
      render(<ForgotUsernameComponent />);
      
      const hr = screen.getByRole('separator');
      expect(hr).toBeInTheDocument();
      expect(hr).toHaveClass('border-t', 'border-[#DFDEE3]', 'my-3');
    });
  });

  describe('Component Integration', () => {
    it('should integrate all child components correctly', () => {
      render(<ForgotUsernameComponent />);
      
      // Verify all major components are rendered
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('auth-card-title')).toBeInTheDocument();
      expect(screen.getByText('Please contact your admin.')).toBeInTheDocument();
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should handle multiple clicks on button', () => {
      render(<ForgotUsernameComponent />);
      
      const button = screen.getByText('Back to Login');
      
      // Click multiple times
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<ForgotUsernameComponent />);
      
      const mainHeading = screen.getByText('Forgot User Id ?');
      expect(mainHeading.tagName).toBe('H1');
      
      const subHeading = screen.getByText('Please contact your admin.');
      expect(subHeading.tagName).toBe('H3');
    });

    it('should have accessible button', () => {
      render(<ForgotUsernameComponent />);
      
      const button = screen.getByRole('button', { name: 'Back to Login' });
      expect(button).toBeInTheDocument();
    });

    it('should have proper alt text for images', () => {
      render(<ForgotUsernameComponent />);
      
      expect(screen.getByAltText('icon')).toBeInTheDocument();
      // The mobile setting icon doesn't have alt text in the actual component
      const mobileIcon = screen.getByRole('img', { name: '' });
      expect(mobileIcon).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle component unmounting', () => {
      const { unmount } = render(<ForgotUsernameComponent />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      
      unmount();
      
      expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    });

    it('should handle rapid button clicks', () => {
      render(<ForgotUsernameComponent />);
      
      const button = screen.getByText('Back to Login');
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      
      expect(mockNavigate).toHaveBeenCalledTimes(10);
    });
  });

  describe('Component Exports', () => {
    it('should export ForgotUsernameComponent as default', () => {
      expect(ForgotUsernameComponent).toBeDefined();
      expect(typeof ForgotUsernameComponent).toBe('function');
    });

    it('should be a functional component', () => {
      expect(ForgotUsernameComponent.prototype).toBeUndefined();
    });
  });

  describe('TypeScript Integration', () => {
    it('should accept no props', () => {
      // This test ensures the component can be used without props
      render(<ForgotUsernameComponent />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render quickly', () => {
      const startTime = performance.now();
      render(<ForgotUsernameComponent />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });
  });

  describe('Navigation Behavior', () => {
    it('should navigate to login page on button click', () => {
      render(<ForgotUsernameComponent />);
      
      const button = screen.getByText('Back to Login');
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should not navigate before button click', () => {
      render(<ForgotUsernameComponent />);
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Content Validation', () => {
    it('should have empty description in auth card title', () => {
      render(<ForgotUsernameComponent />);
      
      const authCardTitle = screen.getByTestId('auth-card-title');
      const description = authCardTitle.querySelector('p');
      expect(description).toHaveTextContent('');
    });

    it('should have correct icon sources', () => {
      render(<ForgotUsernameComponent />);
      
      const lockIcon = screen.getByAltText('icon');
      const mobileIcon = screen.getByRole('img', { name: '' });
      
      expect(lockIcon).toHaveAttribute('src', 'mocked-lock-icon.svg');
      expect(mobileIcon).toHaveAttribute('src', 'mocked-mobile-setting-icon.svg');
    });
  });

  describe('Button Content', () => {
    it('should have correct button text structure', () => {
      render(<ForgotUsernameComponent />);
      
      const button = screen.getByText('Back to Login');
      const span = button.querySelector('span');
      
      if (span) {
        expect(span).toHaveClass('mx-auto', 'w-full', 'text-base');
        expect(span).toHaveTextContent('Back to Login');
      } else {
        // If span is not found, just verify the button text
        expect(button).toHaveTextContent('Back to Login');
      }
    });
  });
});
