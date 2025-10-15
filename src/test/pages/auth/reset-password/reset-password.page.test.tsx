import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordPage from '../../../../pages/auth/reset-password/reset-password.page';

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

// Mock the ResetPasswordComponent
vi.mock('../../../../modules/auth/reset-password/reset-password.component', () => ({
  default: vi.fn(({ changeTitle, changeDescription }) => (
    <div data-testid="reset-password-component">
      <button 
        data-testid="change-title-btn" 
        onClick={() => changeTitle('New Title')}
      >
        Change Title
      </button>
      <button 
        data-testid="change-description-btn" 
        onClick={() => changeDescription('New Description')}
      >
        Change Description
      </button>
      Reset Password Component
    </div>
  )),
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<ResetPasswordPage />);
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });

    it('should render AuthComponent with initial props', () => {
      render(<ResetPasswordPage />);
      
      expect(screen.getByTestId('auth-title')).toHaveTextContent('Reset Password !');
      expect(screen.getByTestId('auth-description')).toHaveTextContent('Follow the instructions below to use your account again.');
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-lock-icon.svg');
      expect(screen.getByTestId('auth-show-languages')).toHaveTextContent('false');
    });

    it('should render ResetPasswordComponent as children', () => {
      render(<ResetPasswordPage />);
      
      expect(screen.getByTestId('auth-children')).toBeInTheDocument();
      expect(screen.getByTestId('reset-password-component')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      render(<ResetPasswordPage />);
      
      expect(screen.getByTestId('auth-title')).toHaveTextContent('Reset Password !');
      expect(screen.getByTestId('auth-description')).toHaveTextContent('Follow the instructions below to use your account again.');
    });

    it('should update title when changeTitle is called', () => {
      render(<ResetPasswordPage />);
      
      const changeTitleBtn = screen.getByTestId('change-title-btn');
      
      act(() => {
        changeTitleBtn.click();
      });
      
      expect(screen.getByTestId('auth-title')).toHaveTextContent('New Title');
    });

    it('should update description when changeDescription is called', () => {
      render(<ResetPasswordPage />);
      
      const changeDescriptionBtn = screen.getByTestId('change-description-btn');
      
      act(() => {
        changeDescriptionBtn.click();
      });
      
      expect(screen.getByTestId('auth-description')).toHaveTextContent('New Description');
    });

    it('should maintain other props when state changes', () => {
      render(<ResetPasswordPage />);
      
      const changeTitleBtn = screen.getByTestId('change-title-btn');
      
      act(() => {
        changeTitleBtn.click();
      });
      
      // Other props should remain unchanged
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-lock-icon.svg');
      expect(screen.getByTestId('auth-show-languages')).toHaveTextContent('false');
    });
  });

  describe('Slides Configuration', () => {
    it('should render slide with correct content', () => {
      render(<ResetPasswordPage />);
      
      expect(screen.getByTestId('slide-title-0')).toHaveTextContent('Data security, assured.');
      expect(screen.getByTestId('slide-description-0')).toHaveTextContent(
        'Intelehealth ensures data security by implementing strong encryption, multi-layered authentication and adhering to compliance standards like HIPAA, protecting patient data.'
      );
      expect(screen.getByTestId('slide-image-0')).toHaveTextContent('mocked-slider-4.png');
    });

    it('should have exactly 1 slide', () => {
      render(<ResetPasswordPage />);
      
      const slides = screen.getAllByTestId(/^slide-\d+$/);
      expect(slides).toHaveLength(1);
    });
  });

  describe('Component Integration', () => {
    it('should integrate AuthComponent and ResetPasswordComponent correctly', () => {
      render(<ResetPasswordPage />);
      
      // Verify AuthComponent is rendered
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
      
      // Verify ResetPasswordComponent is rendered as children
      expect(screen.getByTestId('reset-password-component')).toBeInTheDocument();
      
      // Verify they are properly nested
      const authChildren = screen.getByTestId('auth-children');
      expect(authChildren).toContainElement(screen.getByTestId('reset-password-component'));
    });

    it('should pass changeTitle and changeDescription functions to ResetPasswordComponent', () => {
      render(<ResetPasswordPage />);
      
      // Verify the component has the buttons that use these functions
      expect(screen.getByTestId('change-title-btn')).toBeInTheDocument();
      expect(screen.getByTestId('change-description-btn')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('should pass correct props to AuthComponent', () => {
      render(<ResetPasswordPage />);
      
      // Verify all props are passed correctly
      expect(screen.getByTestId('auth-title')).toHaveTextContent('Reset Password !');
      expect(screen.getByTestId('auth-description')).toHaveTextContent('Follow the instructions below to use your account again.');
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-lock-icon.svg');
      expect(screen.getByTestId('auth-show-languages')).toHaveTextContent('false');
    });

    it('should have slides array with correct structure', () => {
      render(<ResetPasswordPage />);
      
      // Verify slide is rendered with proper structure
      expect(screen.getByTestId('slide-title-0')).toBeInTheDocument();
      expect(screen.getByTestId('slide-description-0')).toBeInTheDocument();
      expect(screen.getByTestId('slide-image-0')).toBeInTheDocument();
    });
  });

  describe('Asset Imports', () => {
    it('should import and use slider image correctly', () => {
      render(<ResetPasswordPage />);
      
      expect(screen.getByTestId('slide-image-0')).toHaveTextContent('mocked-slider-4.png');
    });

    it('should import and use lock icon correctly', () => {
      render(<ResetPasswordPage />);
      
      expect(screen.getByTestId('auth-mobile-image')).toHaveTextContent('mocked-lock-icon.svg');
    });
  });

  describe('Component Exports', () => {
    it('should export ResetPasswordPage as default', () => {
      expect(ResetPasswordPage).toBeDefined();
      expect(typeof ResetPasswordPage).toBe('function');
    });
  });
});
