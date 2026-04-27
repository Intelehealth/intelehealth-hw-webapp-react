import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VideoCard from '../../../components/common/video-card.component';

describe('VideoCard', () => {
  const defaultProps = {
    title: 'Test Video Title',
    duration: '3:45',
    thumbnail: 'https://example.com/thumbnail.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=test123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<VideoCard {...defaultProps} />);
      expect(screen.getByText('Test Video Title')).toBeInTheDocument();
    });

    it('should render the video title', () => {
      render(<VideoCard {...defaultProps} />);
      expect(screen.getByText('Test Video Title')).toBeInTheDocument();
    });

    it('should render the duration', () => {
      render(<VideoCard {...defaultProps} />);
      expect(screen.getByText('3:45')).toBeInTheDocument();
    });

    it('should render the thumbnail image', () => {
      render(<VideoCard {...defaultProps} />);
      const img = screen.getByAltText('Test Video Title');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/thumbnail.jpg');
    });
  });

  describe('Link behavior', () => {
    it('should render as a link to the video URL', () => {
      render(<VideoCard {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=test123');
    });

    it('should open link in a new tab', () => {
      render(<VideoCard {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should have noopener noreferrer for security', () => {
      render(<VideoCard {...defaultProps} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Play button overlay', () => {
    it('should render the play button SVG', () => {
      const { container } = render(<VideoCard {...defaultProps} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Component export', () => {
    it('should export VideoCard as default', () => {
      expect(VideoCard).toBeDefined();
      expect(typeof VideoCard).toBe('function');
    });
  });
});
