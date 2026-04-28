import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HelpVideo from '../../../modules/help-and-support/help-video';
import HelpCategoryContext from '../../../modules/help-and-support/context/help-category.context';
import { videoList } from '../../../assets/data/help.data';

vi.mock('../../../assets/icons/icon-search.svg', () => ({
  default: 'mocked-search-icon.svg',
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = (
  ui: React.ReactElement,
  { category = 'All' }: { category?: string } = {}
) => {
  return render(
    <MemoryRouter>
      <HelpCategoryContext.Provider value={category}>
        {ui}
      </HelpCategoryContext.Provider>
    </MemoryRouter>
  );
};

describe('HelpVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<HelpVideo />);
      expect(screen.getByText('Most searched')).toBeInTheDocument();
    });

    it('should render "Most searched" heading', () => {
      renderWithProviders(<HelpVideo />);
      expect(screen.getByText('Most searched')).toBeInTheDocument();
    });

    it('should render "More" button when showAll is false', () => {
      renderWithProviders(<HelpVideo />);
      expect(screen.getByText('More')).toBeInTheDocument();
    });

    it('should not render "More" button when showAll is true', () => {
      renderWithProviders(<HelpVideo showAll />);
      expect(screen.queryByText('More')).not.toBeInTheDocument();
    });

    it('should display only first 3 videos by default', () => {
      renderWithProviders(<HelpVideo />);
      const displayedVideos = videoList.slice(0, 3);
      displayedVideos.forEach(video => {
        expect(screen.getByText(video.title)).toBeInTheDocument();
      });
    });

    it('should display all videos when showAll is true', () => {
      renderWithProviders(<HelpVideo showAll />);
      videoList.forEach(video => {
        expect(screen.getByText(video.title)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to /help/videos when "More" button is clicked', () => {
      renderWithProviders(<HelpVideo />);
      fireEvent.click(screen.getByText('More'));
      expect(mockNavigate).toHaveBeenCalledWith('/help/videos');
    });
  });

  describe('Category filtering', () => {
    it('should show all videos when category is "All"', () => {
      renderWithProviders(<HelpVideo showAll />, { category: 'All' });
      videoList.forEach(video => {
        expect(screen.getByText(video.title)).toBeInTheDocument();
      });
    });

    it('should filter videos by category', () => {
      renderWithProviders(<HelpVideo showAll />, { category: 'Visit' });
      const visitVideos = videoList.filter(v => v.category === 'Visit');
      const otherVideos = videoList.filter(v => v.category !== 'Visit');
      visitVideos.forEach(video => {
        expect(screen.getByText(video.title)).toBeInTheDocument();
      });
      otherVideos.forEach(video => {
        expect(screen.queryByText(video.title)).not.toBeInTheDocument();
      });
    });

    it('should show no videos when category has no matches', () => {
      renderWithProviders(<HelpVideo showAll />, { category: 'Nonexistent' });
      videoList.forEach(video => {
        expect(screen.queryByText(video.title)).not.toBeInTheDocument();
      });
    });

    it('should display "No videos found" message when category has no matches', () => {
      renderWithProviders(<HelpVideo showAll />, { category: 'Nonexistent' });
      expect(screen.getByText('No videos found')).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('should render mobile search input', () => {
      renderWithProviders(<HelpVideo />);
      expect(screen.getByPlaceholderText('Search for videos')).toBeInTheDocument();
    });

    it('should filter videos by search query (external)', () => {
      renderWithProviders(
        <HelpVideo searchQuery="Anemia" onSearchChange={vi.fn()} showAll />
      );
      expect(screen.getByText('What is Anemia?')).toBeInTheDocument();
      expect(screen.queryByText('Treat mild fever at home')).not.toBeInTheDocument();
    });

    it('should filter videos case-insensitively', () => {
      renderWithProviders(
        <HelpVideo searchQuery="anemia" onSearchChange={vi.fn()} showAll />
      );
      expect(screen.getByText('What is Anemia?')).toBeInTheDocument();
    });

    it('should use internal search state when no external props provided', () => {
      renderWithProviders(<HelpVideo />);
      const searchInput = screen.getByPlaceholderText('Search for videos');
      fireEvent.change(searchInput, { target: { value: 'fever' } });
      expect(screen.getByText('Treat mild fever at home')).toBeInTheDocument();
    });

    it('should display "No videos found" message when search has no matches', () => {
      renderWithProviders(
        <HelpVideo searchQuery="xyznonexistent" onSearchChange={vi.fn()} showAll />
      );
      expect(screen.getByText('No videos found')).toBeInTheDocument();
    });

    it('should call external onSearchChange when provided', () => {
      const onSearchChange = vi.fn();
      renderWithProviders(
        <HelpVideo searchQuery="" onSearchChange={onSearchChange} />
      );
      const searchInput = screen.getByPlaceholderText('Search for videos');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      expect(onSearchChange).toHaveBeenCalledWith('test');
    });
  });

  describe('Component export', () => {
    it('should export HelpVideo as default', () => {
      expect(HelpVideo).toBeDefined();
      expect(typeof HelpVideo).toBe('function');
    });
  });
});
