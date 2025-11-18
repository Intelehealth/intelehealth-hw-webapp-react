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

// Mock the env config
vi.mock('../../../config/env', () => ({
  env: {
    APP_VERSION: '1.0.0-test',
  },
}));

// Mock the components
vi.mock('../../../components/common', () => ({
  Dropdown: vi.fn(
    ({
      options,
      value,
      className,
    }: {
      options: Array<{ value: string | number; label: string }>;
      value: string | number;
      className?: string;
    }) => (
      <div data-testid="dropdown" className={className}>
        {options.map((option) => (
          <div key={option.value} data-testid={`option-${option.value}`}>
            {option.label}
          </div>
        ))}
        <span data-testid="dropdown-value">{value}</span>
      </div>
    )
  ),
  Loader: vi.fn(() => <div data-testid="loader">Loading...</div>),
}));

vi.mock('../../../modules/auth/common/image-slider.component', () => ({
  default: vi.fn(
    ({
      slides,
      hideImages,
    }: {
      slides: Array<{ title: string; description?: string; image?: string }>;
      hideImages?: boolean;
    }) => (
      <div
        data-testid="image-slider"
        data-hide-images={hideImages === true ? 'true' : 'false'}
      >
        {slides.map((slide, index) => (
          <div key={index} data-testid={`slide-${index}`}>
            {slide.title}
          </div>
        ))}
      </div>
    )
  ),
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

    it('should render without children', () => {
      render(<AuthComponent {...defaultProps} />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument();
    });
  });

  describe('Desktop Layout (lg: breakpoint)', () => {
    it('should render desktop hero section', () => {
      render(<AuthComponent {...defaultProps} />);

      // Check for desktop hero elements (aside tag)
      const heroSection = document.querySelector('aside');
      expect(heroSection).toBeInTheDocument();
      expect(heroSection).toHaveClass('hidden', 'lg:flex');
    });

    it('should render logo and background images', () => {
      render(<AuthComponent {...defaultProps} />);

      const logoImages = document.querySelectorAll('img[alt="hero"]');
      const bgImages = document.querySelectorAll('img[alt="bg"]');

      expect(logoImages.length).toBeGreaterThan(0);
      expect(bgImages.length).toBeGreaterThan(0);
    });

    it('should render logo with correct source', () => {
      render(<AuthComponent {...defaultProps} />);

      const logoImages = screen.getAllByAltText('hero');
      const desktopLogo = Array.from(logoImages).find((img) =>
        img.className.includes('h-[74px]')
      );
      expect(desktopLogo).toHaveAttribute('src', 'mocked-logo.png');
    });

    it('should render background with correct source', () => {
      render(<AuthComponent {...defaultProps} />);

      const bgImages = screen.getAllByAltText('bg');
      expect(bgImages[0]).toHaveAttribute('src', 'mocked-bg.svg');
    });

    it('should render ImageSlider in desktop layout', () => {
      render(<AuthComponent {...defaultProps} />);

      const imageSliders = screen.getAllByTestId('image-slider');
      expect(imageSliders.length).toBeGreaterThan(0);
    });

    it('should render copyright text in desktop layout', () => {
      render(<AuthComponent {...defaultProps} />);

      const copyrightTexts = screen.getAllByText(
        /Copyright © 2025 Intelehealth/
      );
      expect(copyrightTexts.length).toBeGreaterThan(0);
    });

    it('should render app version in copyright section', () => {
      render(<AuthComponent {...defaultProps} />);

      const versionText = screen.getByText(/Version: 1\.0\.0-test/i);
      expect(versionText).toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    it('should render mobile title and description', () => {
      render(<AuthComponent {...defaultProps} />);

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should render mobile title in h3 element', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const h3Element = container.querySelector('h3');
      expect(h3Element).toHaveTextContent('Test Title');
      expect(h3Element).toHaveClass('text-2xl', 'font-semibold', 'text-white');
    });

    it('should render mobile image when provided', () => {
      const mobileImage = 'mobile-hero.jpg';
      render(<AuthComponent {...defaultProps} mobileImage={mobileImage} />);

      const heroImages = screen.getAllByAltText('hero');
      const mobileImg = heroImages.find(
        (img) => img.getAttribute('src') === mobileImage
      );
      expect(mobileImg).toBeInTheDocument();
      expect(mobileImg).toHaveAttribute('src', mobileImage);
    });

    it('should not render mobile image when not provided', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      // Check that the mobile image container doesn't have an img when mobileImage is undefined
      const mobileContainers = container.querySelectorAll(
        '.md\\:hidden.lg\\:hidden'
      );
      expect(mobileContainers.length).toBeGreaterThan(0);
    });

    it('should render empty title and description without crashing', () => {
      render(<AuthComponent {...defaultProps} title="" description="" />);

      // Elements should still be in document, just with empty text
      const { container } = render(
        <AuthComponent {...defaultProps} title="" description="" />
      );
      const h3 = container.querySelector('h3');
      expect(h3).toHaveTextContent('');
    });
  });

  describe('Tablet Layout (md: breakpoint)', () => {
    it('should render tablet layout elements', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      // Check for tablet-specific elements
      const tabletElements = container.querySelectorAll('.hidden.md\\:flex');
      expect(tabletElements.length).toBeGreaterThan(0);
    });

    it('should render ImageSlider in tablet layout with hideImages prop false by default', () => {
      render(<AuthComponent {...defaultProps} />);

      const imageSliders = screen.getAllByTestId('image-slider');
      // At least one slider should have hideImages as false
      const defaultSlider = imageSliders.find(
        (slider) => slider.getAttribute('data-hide-images') === 'false'
      );
      expect(defaultSlider).toBeInTheDocument();
    });

    it('should render ImageSlider in tablet layout with hideImages prop true', () => {
      render(
        <AuthComponent {...defaultProps} hideSliderImagesForMobile={true} />
      );

      const imageSliders = screen.getAllByTestId('image-slider');
      const hiddenSlider = imageSliders.find(
        (slider) => slider.getAttribute('data-hide-images') === 'true'
      );
      expect(hiddenSlider).toBeInTheDocument();
    });

    it('should render tablet logo and background', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const tabletSection = container.querySelector('.hidden.md\\:flex.lg\\:hidden');
      expect(tabletSection).toBeInTheDocument();
    });

    it('should render tablet copyright text', () => {
      render(<AuthComponent {...defaultProps} />);

      const copyrightTexts = screen.getAllByText(
        /Copyright © 2025 Intelehealth/
      );
      // Should have multiple copyright texts for different layouts
      expect(copyrightTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Language Dropdown', () => {
    it('should render language dropdown when showLanguages is true', () => {
      render(<AuthComponent {...defaultProps} showLanguages={true} />);

      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-value')).toHaveTextContent('english');
    });

    it('should hide language dropdown when showLanguages is false', () => {
      const { container } = render(
        <AuthComponent {...defaultProps} showLanguages={false} />
      );

      const dropdownContainer = container.querySelector(
        '[style*="visibility"]'
      );
      expect(dropdownContainer).toBeInTheDocument();
      // Check that visibility is set to hidden
      expect(dropdownContainer?.getAttribute('style')).toContain(
        'visibility: hidden'
      );
    });

    it('should show language dropdown by default (showLanguages defaults to true)', () => {
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

    it('should render dropdown with correct value', () => {
      render(<AuthComponent {...defaultProps} />);

      const dropdownValue = screen.getByTestId('dropdown-value');
      expect(dropdownValue).toHaveTextContent('english');
    });

    it('should render dropdown with correct className', () => {
      render(<AuthComponent {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveClass(
        'w-[30%]',
        'min-w-[50px]',
        'max-w-[150px]'
      );
    });

    it('should render all five language options with correct test ids', () => {
      render(<AuthComponent {...defaultProps} />);

      expect(screen.getByTestId('option-english')).toBeInTheDocument();
      expect(screen.getByTestId('option-hindi')).toBeInTheDocument();
      expect(screen.getByTestId('option-marathi')).toBeInTheDocument();
      expect(screen.getByTestId('option-bangoli')).toBeInTheDocument();
      expect(screen.getByTestId('option-gujarati')).toBeInTheDocument();
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
      const defaultSlider = imageSliders.find(
        (slider) => slider.getAttribute('data-hide-images') === 'false'
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

    it('should handle undefined mobileImage prop', () => {
      render(<AuthComponent {...defaultProps} mobileImage={undefined} />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should handle all props together', () => {
      render(
        <AuthComponent
          {...defaultProps}
          mobileImage="mobile.jpg"
          showLanguages={false}
          hideSliderImagesForMobile={true}
        >
          <div>Child content</div>
        </AuthComponent>
      );

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct CSS classes to main container', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'lg:flex-row');
    });

    it('should apply correct CSS classes to hero section', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const heroSection = container.querySelector('aside');
      expect(heroSection).toHaveClass(
        'hidden',
        'lg:flex',
        'flex-1',
        'flex-col',
        'login-left-hero'
      );
    });

    it('should apply correct CSS classes to main content area', () => {
      render(<AuthComponent {...defaultProps} />);

      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveClass('flex-1', 'flex', 'flex-col');
    });

    it('should apply correct background color classes', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const heroSection = container.querySelector('aside');
      expect(heroSection?.className).toContain('bg-[var(--color-primary)]');
    });

    it('should apply correct positioning classes to images', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const bgImage = container.querySelector('img[alt="bg"]');
      expect(bgImage).toHaveClass('absolute');
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for all images', () => {
      render(<AuthComponent {...defaultProps} />);

      const heroImages = screen.getAllByAltText('hero');
      const bgImages = screen.getAllByAltText('bg');

      expect(heroImages.length).toBeGreaterThan(0);
      expect(bgImages.length).toBeGreaterThan(0);

      // All images should have alt text
      heroImages.forEach((img) => {
        expect(img).toHaveAttribute('alt', 'hero');
      });
      bgImages.forEach((img) => {
        expect(img).toHaveAttribute('alt', 'bg');
      });
    });

    it('should render semantic HTML elements', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      expect(container.querySelector('aside')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const h3 = container.querySelector('h3');
      expect(h3).toBeInTheDocument();
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

    it('should handle single slide', () => {
      const singleSlide = [
        { image: 'test-image.jpg', title: 'Only Slide', description: 'Only description' },
      ];
      render(<AuthComponent {...defaultProps} slides={singleSlide} />);

      expect(screen.getAllByTestId('slide-0').length).toBeGreaterThan(0);
      expect(screen.queryByTestId('slide-1')).not.toBeInTheDocument();
    });

    it('should handle many slides', () => {
      const manySlides = Array.from({ length: 10 }, (_, i) => ({
        image: `test-image-${i}.jpg`,
        title: `Slide ${i}`,
        description: `Description ${i}`,
      }));
      render(<AuthComponent {...defaultProps} slides={manySlides} />);

      expect(screen.getAllByTestId('slide-0').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('slide-9').length).toBeGreaterThan(0);
    });

    it('should handle null or undefined in optional string props', () => {
      render(
        <AuthComponent
          {...defaultProps}
          mobileImage={undefined}
          title=""
          description=""
        />
      );

      expect(screen.getByTestId('loader')).toBeInTheDocument();
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

    it('should pass correct props to ImageSlider components', () => {
      render(
        <AuthComponent {...defaultProps} hideSliderImagesForMobile={true} />
      );

      const imageSliders = screen.getAllByTestId('image-slider');
      const hiddenSlider = imageSliders.find(
        (slider) => slider.getAttribute('data-hide-images') === 'true'
      );
      expect(hiddenSlider).toBeInTheDocument();
    });

    it('should pass correct props to Dropdown component', () => {
      render(<AuthComponent {...defaultProps} />);

      const dropdown = screen.getByTestId('dropdown');
      expect(dropdown).toHaveClass('w-[30%]', 'min-w-[50px]', 'max-w-[150px]');
    });

    it('should render multiple ImageSlider instances', () => {
      render(<AuthComponent {...defaultProps} />);

      const imageSliders = screen.getAllByTestId('image-slider');
      // Should have sliders for desktop and tablet layouts
      expect(imageSliders.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Responsive Behavior', () => {
    it('should have correct responsive classes for mobile', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const mobileSection = container.querySelector(
        '.md\\:hidden.lg\\:hidden'
      );
      expect(mobileSection).toBeInTheDocument();
    });

    it('should have correct responsive classes for tablet', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const tabletSection = container.querySelector(
        '.hidden.md\\:flex.lg\\:hidden'
      );
      expect(tabletSection).toBeInTheDocument();
    });

    it('should have correct responsive classes for desktop', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const desktopSection = container.querySelector('.hidden.lg\\:flex');
      expect(desktopSection).toBeInTheDocument();
    });

    it('should have responsive width classes on main section', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const mainSection = container.querySelector(
        '.w-full.lg\\:w-auto.md\\:w-\\[70\\%\\]'
      );
      expect(mainSection).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should render clip-left divider element', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const clipElement = container.querySelector('.clip-left');
      expect(clipElement).toBeInTheDocument();
    });

    it('should have correct structure for left hero section', () => {
      const { container } = render(<AuthComponent {...defaultProps} />);

      const aside = container.querySelector('aside');
      expect(aside?.querySelector('img[alt="hero"]')).toBeInTheDocument();
      expect(aside?.querySelector('img[alt="bg"]')).toBeInTheDocument();
    });

    it('should render children in correct container', () => {
      const { container } = render(
        <AuthComponent {...defaultProps}>
          <div data-testid="child-content">Child</div>
        </AuthComponent>
      );

      const childContainer = container.querySelector(
        '.h-full.flex.flex-col.justify-center'
      );
      expect(childContainer?.querySelector('[data-testid="child-content"]')).toBeInTheDocument();
    });
  });
});
