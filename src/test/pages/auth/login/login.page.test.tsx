import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../../../../pages/auth/login/login.page';

// Mock the assets
vi.mock('../../../../assets/images/slider/slider-image-1.png', () => ({
  default: 'mocked-slider-1.png',
}));

vi.mock('../../../../assets/images/slider/slider-image-2.png', () => ({
  default: 'mocked-slider-2.png',
}));

vi.mock('../../../../assets/images/slider/slider-image-3.png', () => ({
  default: 'mocked-slider-3.png',
}));

vi.mock('../../../../assets/logo/intelehealth-logo-white.png', () => ({
  default: 'mocked-logo.png',
}));

// Mock the AuthComponent
vi.mock('../../../../modules/auth/auth.component', () => ({
  default: vi.fn(({ children, title, description, slides, mobileImage, hideSliderImagesForMobile }) => (
    <div data-testid="auth-component">
      <div data-testid="auth-title">{title}</div>
      <div data-testid="auth-description">{description}</div>
      <div data-testid="auth-mobile-image">{mobileImage}</div>
      <div data-testid="auth-hide-slider">{String(hideSliderImagesForMobile)}</div>
      <div data-testid="auth-slides">
        {slides.map((slide: { title: string; description: string; image: string }, index: number) => (
          <div key={index} data-testid={`slide-${index}`}>
            <div data-testid={`slide-title-${index}`}>{slide.title}</div>
            <div data-testid={`slide-description-${index}`}>{slide.description}</div>
            <div data-testid={`slide-image-${index}`}>{slide.image}</div>
          </div>
        ))}
      </div>
      <div data-testid="auth-children">{children}</div>
    </div>
  )),
}));

// Mock the LoginComponent
vi.mock('../../../../modules/auth/login/login.component', () => ({
  default: vi.fn(() => <div data-testid="login-component">Login Component</div>),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<LoginPage />);
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });

    it('should render AuthComponent with correct props', () => {
      render(<LoginPage />);
      
      expect(screen.getByTestId('auth-title')).toHaveTextContent('Welcome back!');
      expect(screen.getByTestId('auth-description')).toHaveTextContent('Please login to continue with your work');
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-logo.png');
      expect(screen.getByTestId('auth-hide-slider')).toHaveTextContent('true');
    });

    it('should render LoginComponent as children', () => {
      render(<LoginPage />);
      
      expect(screen.getByTestId('auth-children')).toBeInTheDocument();
      expect(screen.getByTestId('login-component')).toBeInTheDocument();
    });
  });

  describe('Slides Configuration', () => {
    it('should render all slides with correct content', () => {
      render(<LoginPage />);
      
      // Check slide 0
      expect(screen.getByTestId('slide-title-0')).toHaveTextContent('Who are we?');
      expect(screen.getByTestId('slide-description-0')).toHaveTextContent(
        'Intelehealth is an innovative telemedicine platform designed to bridge the healthcare access gap in remote regions by connecting frontline health workers and patients with a virtual doctor to provide high-quality health services.'
      );
      expect(screen.getByTestId('slide-image-0')).toHaveTextContent('mocked-slider-1.png');
      
      // Check slide 1
      expect(screen.getByTestId('slide-title-1')).toHaveTextContent('Take patient visits');
      expect(screen.getByTestId('slide-description-1')).toHaveTextContent(
        'This platform is powered by Ayu, a programmable digital assistant that supports frontline health workers with evidence-based protocols for primary healthcare in regional languages.'
      );
      expect(screen.getByTestId('slide-image-1')).toHaveTextContent('mocked-slider-2.png');
      
      // Check slide 2
      expect(screen.getByTestId('slide-title-2')).toHaveTextContent('Provide prescriptions');
      expect(screen.getByTestId('slide-description-2')).toHaveTextContent(
        'The cloud-based open source platform designed for a low-resource environment combined with a customized implementation strategy creates a digital health solution for impactful health outcomes.'
      );
      expect(screen.getByTestId('slide-image-2')).toHaveTextContent('mocked-slider-3.png');
    });

    it('should have exactly 3 slides', () => {
      render(<LoginPage />);
      
      const slides = screen.getAllByTestId(/^slide-\d+$/);
      expect(slides).toHaveLength(3);
    });
  });

  describe('Component Integration', () => {
    it('should integrate AuthComponent and LoginComponent correctly', () => {
      render(<LoginPage />);
      
      // Verify AuthComponent is rendered
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      
      // Verify LoginComponent is rendered as children
      expect(screen.getByTestId('login-component')).toBeInTheDocument();
      
      // Verify they are properly nested
      const authChildren = screen.getByTestId('auth-children');
      expect(authChildren).toContainElement(screen.getByTestId('login-component'));
    });
  });

  describe('Props Validation', () => {
    it('should pass correct props to AuthComponent', () => {
      render(<LoginPage />);
      
      // Verify all props are passed correctly
      expect(screen.getByTestId('auth-title')).toHaveTextContent('Welcome back!');
      expect(screen.getByTestId('auth-description')).toHaveTextContent('Please login to continue with your work');
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-logo.png');
      expect(screen.getByTestId('auth-hide-slider')).toHaveTextContent('true');
    });

    it('should have slides array with correct structure', () => {
      render(<LoginPage />);
      
      // Verify slides are rendered with proper structure
      expect(screen.getByTestId('slide-title-0')).toBeInTheDocument();
      expect(screen.getByTestId('slide-description-0')).toBeInTheDocument();
      expect(screen.getByTestId('slide-image-0')).toBeInTheDocument();
    });
  });

  describe('Asset Imports', () => {
    it('should import and use slider images correctly', () => {
      render(<LoginPage />);
      
      expect(screen.getByTestId('slide-image-0')).toHaveTextContent('mocked-slider-1.png');
      expect(screen.getByTestId('slide-image-1')).toHaveTextContent('mocked-slider-2.png');
      expect(screen.getByTestId('slide-image-2')).toHaveTextContent('mocked-slider-3.png');
    });

    it('should import and use main logo correctly', () => {
      render(<LoginPage />);
      
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-logo.png');
    });
  });

  describe('Component Exports', () => {
    it('should export LoginPage as default', () => {
      expect(LoginPage).toBeDefined();
      expect(typeof LoginPage).toBe('function');
    });

    it('should be a React functional component', () => {
      expect(LoginPage).toBeInstanceOf(Function);
      const { container } = render(<LoginPage />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle re-renders correctly', () => {
      const { rerender } = render(<LoginPage />);
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      
      rerender(<LoginPage />);
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });

    it('should render with all slides data', () => {
      render(<LoginPage />);
      
      // Verify all slides are present
      expect(screen.getByTestId('slide-0')).toBeInTheDocument();
      expect(screen.getByTestId('slide-1')).toBeInTheDocument();
      expect(screen.getByTestId('slide-2')).toBeInTheDocument();
      
      // Verify slides array structure
      const allSlides = screen.getAllByTestId(/^slide-\d+$/);
      expect(allSlides.length).toBe(3);
    });

    it('should pass hideSliderImagesForMobile as boolean true', () => {
      render(<LoginPage />);
      
      const hideSlider = screen.getByTestId('auth-hide-slider');
      expect(hideSlider).toHaveTextContent('true');
      expect(hideSlider.textContent).toBe('true');
    });

    it('should render LoginComponent inside AuthComponent children', () => {
      render(<LoginPage />);
      
      const authComponent = screen.getByTestId('auth-component');
      const loginComponent = screen.getByTestId('login-component');
      const authChildren = screen.getByTestId('auth-children');
      
      expect(authComponent).toContainElement(authChildren);
      expect(authChildren).toContainElement(loginComponent);
    });
  });

  describe('Component Props Completeness', () => {
    it('should pass all required props to AuthComponent', () => {
      render(<LoginPage />);
      
      // Verify title prop
      expect(screen.getByTestId('auth-title')).toHaveTextContent('Welcome back!');
      
      // Verify description prop
      expect(screen.getByTestId('auth-description')).toHaveTextContent('Please login to continue with your work');
      
      // Verify mobileImage prop
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-logo.png');
      
      // Verify hideSliderImagesForMobile prop
      expect(screen.getByTestId('auth-hide-slider')).toHaveTextContent('true');
      
      // Verify slides prop (all 3 slides)
      expect(screen.getAllByTestId(/^slide-\d+$/)).toHaveLength(3);
    });

    it('should render all slide images correctly', () => {
      render(<LoginPage />);
      
      expect(screen.getByTestId('slide-image-0')).toHaveTextContent('mocked-slider-1.png');
      expect(screen.getByTestId('slide-image-1')).toHaveTextContent('mocked-slider-2.png');
      expect(screen.getByTestId('slide-image-2')).toHaveTextContent('mocked-slider-3.png');
    });
  });
});
