import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ImageSlider from '../../../../modules/auth/common/image-slider.component';

// Mock slides data
const mockSlides = [
  {
    image: 'slide1.jpg',
    title: 'Slide 1 Title',
    description: 'Slide 1 Description',
  },
  {
    image: 'slide2.jpg',
    title: 'Slide 2 Title',
    description: 'Slide 2 Description',
  },
  {
    image: 'slide3.jpg',
    title: 'Slide 3 Title',
    description: 'Slide 3 Description',
  },
];

const mockSlidesWithHeartbeat = [
  {
    image: 'slide1.jpg',
    title: 'Slide 1 Title',
    description: 'Slide 1 Description',
    heartbeat1: 'heartbeat-red.png',
    heartbeat2: 'heartbeat-green.png',
  },
  {
    image: 'slide2.jpg',
    title: 'Slide 2 Title',
    description: 'Slide 2 Description',
    heartbeat1: 'heartbeat-red.png',
    heartbeat2: 'heartbeat-green.png',
  },
];

describe('ImageSlider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      render(<ImageSlider slides={mockSlides} />);
      expect(screen.getByText('Slide 1 Title')).toBeInTheDocument();
    });

    it('should render all slides', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      expect(screen.getByText('Slide 1 Title')).toBeInTheDocument();
      expect(screen.getByText('Slide 2 Title')).toBeInTheDocument();
      expect(screen.getByText('Slide 3 Title')).toBeInTheDocument();
    });

    it('should render with default props', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      expect(screen.getByText('Slide 1 Title')).toBeInTheDocument();
      expect(screen.getByAltText('Slide 1 Title')).toBeInTheDocument();
    });
  });

  describe('Auto-play Functionality', () => {
    it('should auto-play by default', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      // Initially showing first slide
      expect(screen.getByText('Slide 1 Title')).toBeInTheDocument();
      
      // Fast-forward time to trigger auto-play
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      // Should move to second slide
      expect(screen.getByText('Slide 2 Title')).toBeInTheDocument();
    });

    it('should cycle through all slides with auto-play', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      // First slide
      expect(screen.getByText('Slide 1 Title')).toBeInTheDocument();
      
      // Second slide
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText('Slide 2 Title')).toBeInTheDocument();
      
      // Third slide
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText('Slide 3 Title')).toBeInTheDocument();
      
      // Back to first slide
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText('Slide 1 Title')).toBeInTheDocument();
    });

    it('should not auto-play when autoPlay is false', () => {
      render(<ImageSlider slides={mockSlides} autoPlay={false} />);
      
      expect(screen.getByText('Slide 1 Title')).toBeInTheDocument();
      
      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      // Should still be on first slide
      expect(screen.getByText('Slide 1 Title')).toBeInTheDocument();
    });

    it('should use custom interval', () => {
      render(<ImageSlider slides={mockSlides} interval={1000} />);
      
      expect(screen.getByText('Slide 1 Title')).toBeInTheDocument();
      
      // Fast-forward by custom interval
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('Slide 2 Title')).toBeInTheDocument();
    });
  });

  describe('Manual Navigation', () => {
    it('should navigate to specific slide when indicator is clicked', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      const indicators = screen.getAllByRole('button');
      expect(indicators).toHaveLength(3);
      
      // Click second indicator
      fireEvent.click(indicators[1]);
      expect(screen.getByText('Slide 2 Title')).toBeInTheDocument();
    });

    it('should navigate to third slide when third indicator is clicked', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      const indicators = screen.getAllByRole('button');
      fireEvent.click(indicators[2]);
      expect(screen.getByText('Slide 3 Title')).toBeInTheDocument();
    });

    it('should update active indicator when navigating', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      const indicators = screen.getAllByRole('button');
      
      // First indicator should be active initially
      expect(indicators[0]).toHaveClass('bg-white', 'w-8', 'h-2');
      expect(indicators[1]).toHaveClass('bg-gray-400', 'w-3', 'h-2');
      
      // Click second indicator
      fireEvent.click(indicators[1]);
      
      // Second indicator should be active
      expect(indicators[1]).toHaveClass('bg-white', 'w-8', 'h-2');
      expect(indicators[0]).toHaveClass('bg-gray-400', 'w-3', 'h-2');
    });
  });

  describe('Image Display', () => {
    it('should display images when hideImages is false', () => {
      render(<ImageSlider slides={mockSlides} hideImages={false} />);
      
      expect(screen.getByAltText('Slide 1 Title')).toBeInTheDocument();
      expect(screen.getByAltText('Slide 2 Title')).toBeInTheDocument();
      expect(screen.getByAltText('Slide 3 Title')).toBeInTheDocument();
    });

    it('should hide images when hideImages is true', () => {
      render(<ImageSlider slides={mockSlides} hideImages={true} />);
      
      expect(screen.queryByAltText('Slide 1 Title')).not.toBeInTheDocument();
      expect(screen.queryByAltText('Slide 2 Title')).not.toBeInTheDocument();
      expect(screen.queryByAltText('Slide 3 Title')).not.toBeInTheDocument();
    });

    it('should apply correct classes to images', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      const images = screen.getAllByRole('img');
      // Filter to only main slide images (exclude heartbeat images)
      const slideImages = images.filter(img => 
        img.getAttribute('alt') !== 'heartbeat red' && 
        img.getAttribute('alt') !== 'heartbeat green'
      );
      
      slideImages.forEach(img => {
        expect(img).toHaveClass('w-full', 'h-full', 'object-contain', 'rounded-lg');
      });
    });

    it('should display heartbeat1 images when provided', () => {
      render(<ImageSlider slides={mockSlidesWithHeartbeat} hideImages={false} />);
      
      const heartbeat1Images = screen.getAllByAltText('heartbeat red');
      expect(heartbeat1Images).toHaveLength(2);
      heartbeat1Images.forEach(img => {
        expect(img).toHaveAttribute('src', 'heartbeat-red.png');
        expect(img).toHaveClass('absolute', '-top-8', '-right-5', 'lg:-top-12', 'lg:-right-5', 'w-34', 'h-34', 'lg:w-32', 'lg:h-32', 'object-contain', 'z-10');
      });
    });

    it('should display heartbeat2 images when provided', () => {
      render(<ImageSlider slides={mockSlidesWithHeartbeat} hideImages={false} />);

      const heartbeat2Images = screen.getAllByAltText('heartbeat green');
      expect(heartbeat2Images).toHaveLength(2);
      heartbeat2Images.forEach(img => {
        expect(img).toHaveAttribute('src', 'heartbeat-green.png');
        expect(img).toHaveClass('absolute', 'top-4', '-left-5', 'lg:top-80', 'lg:-left-1', 'w-34', 'h-34', 'lg:w-30', 'lg:h-30', 'object-contain', 'z-10');
      });
    });

    it('should hide heartbeat images when hideImages is true', () => {
      render(<ImageSlider slides={mockSlidesWithHeartbeat} hideImages={true} />);
      
      expect(screen.queryByAltText('heartbeat red')).not.toBeInTheDocument();
      expect(screen.queryByAltText('heartbeat green')).not.toBeInTheDocument();
    });

    it('should render heartbeat1 when only heartbeat1 is provided', () => {
      const slidesWithOnlyHeartbeat1 = [
        {
          image: 'slide1.jpg',
          title: 'Slide 1 Title',
          description: 'Slide 1 Description',
          heartbeat1: 'heartbeat-red.png',
        },
      ];
      
      render(<ImageSlider slides={slidesWithOnlyHeartbeat1} hideImages={false} />);
      
      expect(screen.getByAltText('heartbeat red')).toBeInTheDocument();
      expect(screen.queryByAltText('heartbeat green')).not.toBeInTheDocument();
    });

    it('should render heartbeat2 when only heartbeat2 is provided', () => {
      const slidesWithOnlyHeartbeat2 = [
        {
          image: 'slide1.jpg',
          title: 'Slide 1 Title',
          description: 'Slide 1 Description',
          heartbeat2: 'heartbeat-green.png',
        },
      ];
      
      render(<ImageSlider slides={slidesWithOnlyHeartbeat2} hideImages={false} />);
      
      expect(screen.queryByAltText('heartbeat red')).not.toBeInTheDocument();
      expect(screen.getByAltText('heartbeat green')).toBeInTheDocument();
    });

    it('should not render heartbeat images when they are not provided', () => {
      render(<ImageSlider slides={mockSlides} hideImages={false} />);
      
      expect(screen.queryByAltText('heartbeat red')).not.toBeInTheDocument();
      expect(screen.queryByAltText('heartbeat green')).not.toBeInTheDocument();
    });
  });

  describe('Content Layout', () => {
    it('should apply correct text alignment when hideImages is false', () => {
      render(<ImageSlider slides={mockSlides} hideImages={false} />);
      
      const textContainers = screen.getAllByText(/Slide \d+ Title/);
      textContainers.forEach(container => {
        expect(container.closest('div')).toHaveClass('text-left');
      });
    });

    it('should apply center text alignment when hideImages is true', () => {
      render(<ImageSlider slides={mockSlides} hideImages={true} />);
      
      const textContainers = screen.getAllByText(/Slide \d+ Title/);
      textContainers.forEach(container => {
        expect(container.closest('div')).toHaveClass('text-center');
      });
    });
  });

  describe('Indicators', () => {
    it('should show indicators for multiple slides', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      const indicators = screen.getAllByRole('button');
      expect(indicators).toHaveLength(3);
    });

    it('should not show indicators for single slide', () => {
      render(<ImageSlider slides={[mockSlides[0]]} />);
      
      const indicators = screen.queryAllByRole('button');
      expect(indicators).toHaveLength(0);
    });

    it('should have correct indicator classes', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      const indicators = screen.getAllByRole('button');
      
      // First indicator should be active
      expect(indicators[0]).toHaveClass('rounded-full', 'transition-all', 'duration-300', 'bg-white', 'w-8', 'h-2');
      
      // Other indicators should be inactive
      expect(indicators[1]).toHaveClass('rounded-full', 'transition-all', 'duration-300', 'bg-gray-400', 'w-3', 'h-2');
      expect(indicators[2]).toHaveClass('rounded-full', 'transition-all', 'duration-300', 'bg-gray-400', 'w-3', 'h-2');
    });
  });

  describe('Transform Animation', () => {
    it('should have slide container with transform style', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      // Find the main slide container (the one with transform classes)
      const slideContainer = screen.getByText('Slide 1 Title').closest('div[class*="flex transition-transform"]');
      expect(slideContainer).toBeInTheDocument();
      expect(slideContainer).toHaveClass('transition-transform', 'duration-700');
    });

    it('should update slide content when navigating', () => {
      render(<ImageSlider slides={mockSlides} />);
      
      const indicators = screen.getAllByRole('button');
      fireEvent.click(indicators[1]);
      
      expect(screen.getByText('Slide 2 Title')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty slides array', () => {
      render(<ImageSlider slides={[]} />);
      
      const indicators = screen.queryAllByRole('button');
      expect(indicators).toHaveLength(0);
    });

    it('should handle single slide', () => {
      render(<ImageSlider slides={[mockSlides[0]]} />);
      
      expect(screen.getByText('Slide 1 Title')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle very long slide content', () => {
      const longSlides = [
        {
          image: 'slide1.jpg',
          title: 'This is a very long title that might cause layout issues',
          description: 'This is a very long description that might cause layout issues and should still be displayed correctly',
        },
      ];
      
      render(<ImageSlider slides={longSlides} />);
      
      expect(screen.getByText('This is a very long title that might cause layout issues')).toBeInTheDocument();
      expect(screen.getByText('This is a very long description that might cause layout issues and should still be displayed correctly')).toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export ImageSlider as default', () => {
      expect(ImageSlider).toBeDefined();
      expect(typeof ImageSlider).toBe('function');
    });
  });
});
