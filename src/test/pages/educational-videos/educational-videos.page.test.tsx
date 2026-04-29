import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EducationalVideosPage from '../../../pages/educational-videos/educational-videos.page';

vi.mock('../../../modules/educational-videos/educational-videos.component', () => ({
  default: () => <div data-testid="educational-videos-module" />,
}));

describe('EducationalVideosPage', () => {
  it('renders the EducationalVideos module inside a scrollable wrapper', () => {
    const { container } = render(<EducationalVideosPage />);
    expect(screen.getByTestId('educational-videos-module')).toBeInTheDocument();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('h-full');
    expect(wrapper).toHaveClass('w-full');
    expect(wrapper).toHaveClass('overflow-y-auto');
  });
});
