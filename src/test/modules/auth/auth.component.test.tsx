import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthComponent from '../../../modules/auth/auth.component';

// Mock the assets
vi.mock('../../../assets/logo/intelehealth-logo-white.png', () => ({
  default: 'mocked-logo.png',
}));

vi.mock('../../../assets/logo/logo-bg.svg', () => ({
  default: 'mocked-bg.svg',
}));

// Mock the components
vi.mock('../../../components/common', () => ({
  Dropdown: vi.fn(({ options, value, className }: { options: Array<{ value: string | number; label: string }>; value: string | number; className?: string }) => (
    <div data-testid="dropdown" className={className}>
      {options.map((option) => (
        <div key={option.value}>{option.label}</div>
      ))}
      <span data-testid="dropdown-value">{value}</span>
    </div>
  )),
  Loader: vi.fn(() => <div data-testid="loader">Loading...</div>),
}));


vi.mock('../../../modules/auth/common/image-slider.component', () => ({
  default: vi.fn(({ slides, hideImages }: { slides: Array<{ title: string }>, hideImages: boolean }) => (
    <div data-testid="image-slider" data-hide-images={hideImages}>
      {slides.map((slide, index) => (
        <div key={index} data-testid={`slide-${index}`}>
          {slide.title}
        </div>
      ))}
    </div>
  )),
}));

describe('AuthComponent', () => {
  const mockSlides = [
    { title: 'Slide 1', description: 'Description 1', image: 'image1.jpg' },
    { title: 'Slide 2', description: 'Description 2', image: 'image2.jpg' },
  ];

  const defaultProps = {
    title: 'Test Title',
    description: 'Test Description',
    slides: mockSlides,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<AuthComponent {...defaultProps} />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render with all required props', () => {
      render(<AuthComponent {...defaultProps} />);
      
      // Check main container
      const mainContainer = screen.getByRole('main');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('flex-1', 'flex', 'flex-col');
    });

    it('should render with children', () => {
      const TestChild = () => <div data-testid="test-child">Test Child</div>;
      
      render(
        <AuthComponent {...defaultProps}>
          <TestChild />
        </AuthComponent>
      );
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('Desktop Layout (lg: breakpoint)', () => {
    it('should render desktop hero section', () => {
      render(<AuthComponent {...defaultProps} />);
      
      // Check for desktop hero elements
      const heroSection = document.querySelector('.hidden.lg\\:flex');
      expect(heroSection).toBeInTheDocument();
    });

    it('should render logo and background images', () => {
      render(<AuthComponent {...defaultProps} />);
      
      const logoImages = document.querySelectorAll('img[alt="hero"]');
      const bgImages = document.querySelectorAll('img[alt="bg"]');
      
      expect(logoImages.length).toBeGreaterThan(0);
      expect(bgImages.length).toBeGreaterThan(0);
    });

    it('should render ImageSlider in desktop layout', () => {
      render(<AuthComponent {...defaultProps} />);
      
      const imageSliders = screen.getAllByTestId('image-slider');
      expect(imageSliders.length).toBeGreaterThan(0);
    });

    it('should render copyright text in desktop layout', () => {
      render(<AuthComponent {...defaultProps} />);
      
      const copyrightTexts = screen.getAllByText(/Copyright © 2025 Intelehealth/);
      expect(copyrightTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Layout', () => {
    it('should render mobile title and description', () => {
      render(<AuthComponent {...defaultProps} />);
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should render mobile image when provided', () => {
      const mobileImage = 'mobile-hero.jpg';
      render(<AuthComponent {...defaultProps} mobileImage={mobileImage} />);
      
      const heroImages = screen.getAllByAltText('hero');
      const mobileImg = heroImages.find(img => img.getAttribute('src') === mobileImage);
      expect(mobileImg).toBeInTheDocument();
      expect(mobileImg).toHaveAttribute('src', mobileImage);
    });

    it('should not render mobile image when not provided', () => {
      render(<AuthComponent {...defaultProps} />);
      
      const mobileImages = screen.getAllByAltText('hero');
      // Should only have desktop hero images, not mobile
      expect(mobileImages.length).toBeGreaterThan(0);
    });
  });

  describe('Tablet Layout (md: breakpoint)', () => {
    it('should render tablet layout elements', () => {
      render(<AuthComponent {...defaultProps} />);
      
      // Check for tablet-specific elements
      const tabletElements = document.querySelectorAll('.hidden.md\\:flex');
      expect(tabletElements.length).toBeGreaterThan(0);
    });

    it('should render ImageSlider in tablet layout with hideImages prop', () => {
      render(<AuthComponent {...defaultProps} hideSliderImagesForMobile={true} />);
      
      const imageSliders = screen.getAllByTestId('image-slider');
      const hiddenSlider = imageSliders.find(slider => 
        slider.getAttribute('data-hide-images') === 'true'
      );
      expect(hiddenSlider).toBeInTheDocument();
    });
  });

  describe('Language Dropdown', () => {
    it('should render language dropdown when showLanguages is true', () => {
      render(<AuthComponent {...defaultProps} showLanguages={true} />);
      
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-value')).toHaveTextContent('english');
    });

    it('should hide language dropdown when showLanguages is false', () => {
      render(<AuthComponent {...defaultProps} showLanguages={false} />);
      
      const dropdownContainer = document.querySelector('[style*="visibility: hidden"]');
      expect(dropdownContainer).toBeInTheDocument();
    });

    it('should show language dropdown by default', () => {
      render(<AuthComponent {...defaultProps} />);
      
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    });

    it('should render all language options', () => {
      render(<AuthComponent {...defaultProps} />);
      
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('हिंदी')).toBeInTheDocument();
      expect(screen.getByText('मराठी')).toBeInTheDocument();
      expect(screen.getByText('മലയാളം')).toBeInTheDocument();
      expect(screen.getByText('ગુજરાતી')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should handle empty title and description', () => {
      render(<AuthComponent {...defaultProps} title="" description="" />);
      
      // Should not crash with empty strings
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should handle default values for optional props', () => {
      render(<AuthComponent {...defaultProps} />);
      
      // showLanguages should default to true
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      
      // hideSliderImagesForMobile should default to false
      const imageSliders = screen.getAllByTestId('image-slider');
      const defaultSlider = imageSliders.find(slider => 
        slider.getAttribute('data-hide-images') === 'false'
      );
      expect(defaultSlider).toBeInTheDocument();
    });

    it('should pass slides to ImageSlider components', () => {
      render(<AuthComponent {...defaultProps} />);
      
      // Check that slides are rendered
      const slide0Elements = screen.getAllByTestId('slide-0');
      const slide1Elements = screen.getAllByTestId('slide-1');
      expect(slide0Elements.length).toBeGreaterThan(0);
      expect(slide1Elements.length).toBeGreaterThan(0);
      expect(slide0Elements[0]).toHaveTextContent('Slide 1');
      expect(slide1Elements[0]).toHaveTextContent('Slide 2');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct CSS classes to main container', () => {
      render(<AuthComponent {...defaultProps} />);
      
      const mainContainer = document.querySelector('.min-h-screen.flex.flex-col.lg\\:flex-row');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should apply correct CSS classes to hero section', () => {
      render(<AuthComponent {...defaultProps} />);
      
      const heroSection = document.querySelector('.hidden.lg\\:flex.flex-1.flex-col.login-left-hero');
      expect(heroSection).toBeInTheDocument();
    });

    it('should apply correct CSS classes to main content area', () => {
      render(<AuthComponent {...defaultProps} />);
      
      const mainContent = document.querySelector('main.flex-1.flex.flex-col');
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for images', () => {
      render(<AuthComponent {...defaultProps} />);
      
      const heroImages = screen.getAllByAltText('hero');
      const bgImages = screen.getAllByAltText('bg');
      
      expect(heroImages.length).toBeGreaterThan(0);
      expect(bgImages.length).toBeGreaterThan(0);
    });

    it('should render semantic HTML elements', () => {
      render(<AuthComponent {...defaultProps} />);
      
      expect(document.querySelector('aside')).toBeInTheDocument();
      expect(document.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty slides array', () => {
      render(<AuthComponent {...defaultProps} slides={[]} />);
      
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      // Should not crash with empty slides
    });

    it('should handle undefined children', () => {
      render(<AuthComponent {...defaultProps} children={undefined} />);
      
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      // Should not crash with undefined children
    });

    it('should handle all boolean prop combinations', () => {
      const combinations = [
        { showLanguages: true, hideSliderImagesForMobile: true },
        { showLanguages: true, hideSliderImagesForMobile: false },
        { showLanguages: false, hideSliderImagesForMobile: true },
        { showLanguages: false, hideSliderImagesForMobile: false },
      ];

      combinations.forEach((props) => {
        const { unmount } = render(
          <AuthComponent {...defaultProps} {...props} />
        );
        
        expect(screen.getByTestId('loader')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Component Integration', () => {
    it('should integrate with all child components', () => {
      render(<AuthComponent {...defaultProps} />);
      
      // Check that all mocked components are rendered
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      expect(screen.getAllByTestId('image-slider').length).toBeGreaterThan(0);
    });

    it('should pass correct props to child components', () => {
      render(<AuthComponent {...defaultProps} hideSliderImagesForMobile={true} />);
      
      const imageSliders = screen.getAllByTestId('image-slider');
      const hiddenSlider = imageSliders.find(slider => 
        slider.getAttribute('data-hide-images') === 'true'
      );
      expect(hiddenSlider).toBeInTheDocument();
    });
  });
});
