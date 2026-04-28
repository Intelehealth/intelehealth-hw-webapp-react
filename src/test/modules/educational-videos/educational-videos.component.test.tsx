import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EducationalVideos from '../../../modules/educational-videos/educational-videos.component';

vi.mock('../../../assets/data/help.data', () => ({
  videoList: [
    {
      title: 'What is Anemia?',
      duration: '3:45',
      thumbnail: 'https://example.com/thumb1.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=ABC123',
      category: 'Check-up',
    },
    {
      title: 'Benefits of walking',
      duration: '4:10',
      thumbnail: 'https://example.com/thumb2.jpg',
      videoUrl: 'https://youtu.be/XYZ789',
      category: 'Visit',
    },
    {
      title: 'Treat mild fever at home',
      duration: '2:30',
      thumbnail: 'https://example.com/thumb3.jpg',
      videoUrl: 'https://www.youtube.com/embed/EMB456',
      category: 'Check-up',
    },
    {
      title: 'Treat cough at home',
      duration: '1:15',
      thumbnail: 'https://example.com/thumb4.jpg',
      videoUrl: 'https://invalid-url-no-video-id',
      category: 'Check-up',
    },
  ],
}));

describe('EducationalVideos', () => {
  it('renders the page heading and search input', () => {
    render(<EducationalVideos />);
    expect(screen.getByText('Educational Videos')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for videos')).toBeInTheDocument();
  });

  it('renders all 3 tabs', () => {
    render(<EducationalVideos />);
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText('About App')).toBeInTheDocument();
  });

  it('shows Health tab content (Most Searched + More Videos sections) by default', () => {
    render(<EducationalVideos />);
    expect(screen.getByText('Most Searched')).toBeInTheDocument();
    expect(screen.getByText('More Videos')).toBeInTheDocument();
  });

  it('places Anemia and Walking under Most Searched, fever and cough under More Videos', () => {
    render(<EducationalVideos />);
    const mostSearched = screen
      .getByText('Most Searched')
      .closest('section') as HTMLElement;
    const moreVideos = screen
      .getByText('More Videos')
      .closest('section') as HTMLElement;

    expect(within(mostSearched).getByText('What is Anemia?')).toBeInTheDocument();
    expect(within(mostSearched).getByText('Benefits of walking')).toBeInTheDocument();
    expect(
      within(moreVideos).getByText('Treat mild fever at home')
    ).toBeInTheDocument();
    expect(within(moreVideos).getByText('Treat cough at home')).toBeInTheDocument();
  });

  it('filters videos by search query', () => {
    render(<EducationalVideos />);
    fireEvent.change(screen.getByPlaceholderText('Search for videos'), {
      target: { value: 'anemia' },
    });
    expect(screen.getByText('What is Anemia?')).toBeInTheDocument();
    expect(screen.queryByText('Benefits of walking')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Treat mild fever at home')
    ).not.toBeInTheDocument();
  });

  it('switches to Training tab and shows empty state', () => {
    render(<EducationalVideos />);
    fireEvent.click(screen.getByText('Training'));
    expect(screen.getByText('No training videos yet.')).toBeInTheDocument();
    expect(screen.queryByText('Most Searched')).not.toBeInTheDocument();
  });

  it('switches to About App tab and shows empty state', () => {
    render(<EducationalVideos />);
    fireEvent.click(screen.getByText('About App'));
    expect(screen.getByText('No About-App videos yet.')).toBeInTheDocument();
  });

  it('opens video modal when a Most-Searched card is clicked', () => {
    render(<EducationalVideos />);
    fireEvent.click(screen.getByText('What is Anemia?'));
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('https://www.youtube.com/embed/ABC123');
    expect(iframe.src).toContain('autoplay=1');
  });

  it('opens video modal when a More-Videos card is clicked', () => {
    render(<EducationalVideos />);
    fireEvent.click(screen.getByText('Treat mild fever at home'));
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('embed/EMB456');
  });

  it('converts youtu.be short URL to embed URL', () => {
    render(<EducationalVideos />);
    fireEvent.click(screen.getByText('Benefits of walking'));
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.src).toContain('embed/XYZ789');
  });

  it('falls back to original URL when no YouTube id can be extracted', () => {
    render(<EducationalVideos />);
    fireEvent.click(screen.getByText('Treat cough at home'));
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.src).toContain('invalid-url-no-video-id');
  });

  it('closes modal when the X button is clicked', () => {
    render(<EducationalVideos />);
    fireEvent.click(screen.getByText('What is Anemia?'));
    expect(document.querySelector('iframe')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close video'));
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('closes modal when the backdrop is clicked', () => {
    render(<EducationalVideos />);
    fireEvent.click(screen.getByText('What is Anemia?'));
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.click(backdrop);
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('does not close modal when clicking the inner video frame (stopPropagation)', () => {
    render(<EducationalVideos />);
    fireEvent.click(screen.getByText('What is Anemia?'));
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    const inner = iframe.parentElement!;
    fireEvent.click(inner);
    expect(document.querySelector('iframe')).toBeInTheDocument();
  });

  it('marks the active tab with bold/dark styling', () => {
    render(<EducationalVideos />);
    const healthBtn = screen.getByText('Health').closest('button')!;
    expect(healthBtn).toHaveClass('font-semibold');

    fireEvent.click(screen.getByText('Training'));
    const trainingBtn = screen.getByText('Training').closest('button')!;
    expect(trainingBtn).toHaveClass('font-semibold');
  });
});
