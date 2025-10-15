import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotUsernamePage from '../../../../pages/auth/forgot-username/forgot-username.page';

// Mock the assets
vi.mock('../../../../assets/icons/icon-rounded-lock.svg', () => ({
  default: 'mocked-lock-icon.svg',
}));

vi.mock('../../../../assets/images/slider/slider-image-4.png', () => ({
  default: 'mocked-slider-4.png',
}));

// Mock the AuthComponent
vi.mock('../../../../modules/auth/auth.component', () => ({
  default: vi.fn(({ children, title, description, slides, mobileImage, showLanguages }) => (
    <div data-testid="auth-component">
      <div data-testid="auth-title">{title}</div>
      <div data-testid="auth-description">{description}</div>
      <div data-testid="auth-mobile-image">{mobileImage}</div>
      <div data-testid="auth-show-languages">{String(showLanguages)}</div>
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

// Mock the ForgotUsernameComponent
vi.mock('../../../../modules/auth/forgot-username/forgot-username.component', () => ({
  default: vi.fn(() => <div data-testid="forgot-username-component">Forgot Username Component</div>),
}));

describe('ForgotUsernamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<ForgotUsernamePage />);
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });

    it('should render AuthComponent with correct props', () => {
      render(<ForgotUsernamePage />);
      
      expect(screen.getByTestId('auth-title')).toHaveTextContent('Forgot User Id !');
      expect(screen.getByTestId('auth-description')).toHaveTextContent('');
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-lock-icon.svg');
      expect(screen.getByTestId('auth-show-languages')).toHaveTextContent('false');
    });

    it('should render ForgotUsernameComponent as children', () => {
      render(<ForgotUsernamePage />);
      
      expect(screen.getByTestId('auth-children')).toBeInTheDocument();
      expect(screen.getByTestId('forgot-username-component')).toBeInTheDocument();
    });
  });

  describe('Slides Configuration', () => {
    it('should render slide with correct content', () => {
      render(<ForgotUsernamePage />);
      
      expect(screen.getByTestId('slide-title-0')).toHaveTextContent('Data security, assured.');
      expect(screen.getByTestId('slide-description-0')).toHaveTextContent(
        'Intelehealth ensures data security by implementing strong encryption, multi-layered authentication and adhering to compliance standards like HIPAA, protecting patient data.'
      );
      expect(screen.getByTestId('slide-image-0')).toHaveTextContent('mocked-slider-4.png');
    });

    it('should have exactly 1 slide', () => {
      render(<ForgotUsernamePage />);
      
      const slides = screen.getAllByTestId(/^slide-\d+$/);
      expect(slides).toHaveLength(1);
    });
  });

  describe('Component Integration', () => {
    it('should integrate AuthComponent and ForgotUsernameComponent correctly', () => {
      render(<ForgotUsernamePage />);
      
      // Verify AuthComponent is rendered
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      
      // Verify ForgotUsernameComponent is rendered as children
      expect(screen.getByTestId('forgot-username-component')).toBeInTheDocument();
      
      // Verify they are properly nested
      const authChildren = screen.getByTestId('auth-children');
      expect(authChildren).toContainElement(screen.getByTestId('forgot-username-component'));
    });
  });

  describe('Props Validation', () => {
    it('should pass correct props to AuthComponent', () => {
      render(<ForgotUsernamePage />);
      
      // Verify all props are passed correctly
      expect(screen.getByTestId('auth-title')).toHaveTextContent('Forgot User Id !');
      expect(screen.getByTestId('auth-description')).toHaveTextContent('');
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-lock-icon.svg');
      expect(screen.getByTestId('auth-show-languages')).toHaveTextContent('false');
    });

    it('should have slides array with correct structure', () => {
      render(<ForgotUsernamePage />);
      
      // Verify slide is rendered with proper structure
      expect(screen.getByTestId('slide-title-0')).toBeInTheDocument();
      expect(screen.getByTestId('slide-description-0')).toBeInTheDocument();
      expect(screen.getByTestId('slide-image-0')).toBeInTheDocument();
    });
  });

  describe('Asset Imports', () => {
    it('should import and use slider image correctly', () => {
      render(<ForgotUsernamePage />);
      
      expect(screen.getByTestId('slide-image-0')).toHaveTextContent('mocked-slider-4.png');
    });

    it('should import and use lock icon correctly', () => {
      render(<ForgotUsernamePage />);
      
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-lock-icon.svg');
    });
  });

  describe('Component Exports', () => {
    it('should export ForgotUsernamePage as default', () => {
      expect(ForgotUsernamePage).toBeDefined();
      expect(typeof ForgotUsernamePage).toBe('function');
    });
  });
});
