import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ABOUT_US_CONTENT } from '../../../assets/data/about-us.data';
import AboutusComponent from '../../../modules/about-us/about-us.component';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../assets/icons/icon-about-us.svg', () => ({
  default: 'icon-about-us.svg',
}));
vi.mock('../../../assets/images/about-us-main-img.png', () => ({
  default: 'about-us-main-img.png',
}));
vi.mock('../../../assets/images/about-us-main-mobile-img.png.png', () => ({
  default: 'about-us-mobile-img.png',
}));
vi.mock('../../../assets/icons/icon-ache-info-dashboard.svg', () => ({
  default: 'icon-info.svg',
}));
vi.mock('../../../assets/icons/icon-globe.svg', () => ({
  default: 'icon-globe.svg',
}));
vi.mock('../../../assets/icons/icon-sync.svg', () => ({
  default: 'icon-sync.svg',
}));

const renderComponent = () =>
  render(
    <MemoryRouter>
      <AboutusComponent />
    </MemoryRouter>,
  );

describe('AboutusComponent', () => {
  it('should render without crashing', () => {
    expect(() => renderComponent()).not.toThrow();
  });

  it('should render the title in mobile header', () => {
    renderComponent();
    const titles = screen.getAllByText(ABOUT_US_CONTENT.title);
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('should render the title in desktop header', () => {
    renderComponent();
    const titles = screen.getAllByText(ABOUT_US_CONTENT.title);
    expect(titles.length).toBe(2);
  });

  it('should render both paragraphs', () => {
    renderComponent();
    ABOUT_US_CONTENT.paragraphs.forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  it('should render the mobile image', () => {
    renderComponent();
    const images = screen.getAllByAltText('about-us');
    const mobileImg = images.find(
      (img) => (img as HTMLImageElement).src.includes('about-us-mobile-img'),
    );
    expect(mobileImg).toBeDefined();
  });

  it('should render the desktop image', () => {
    renderComponent();
    const images = screen.getAllByAltText('about-us');
    const desktopImg = images.find(
      (img) => (img as HTMLImageElement).src.includes('about-us-main-img'),
    );
    expect(desktopImg).toBeDefined();
  });

  it('should render check out label', () => {
    renderComponent();
    expect(
      screen.getByText(ABOUT_US_CONTENT.checkOutLabel),
    ).toBeInTheDocument();
  });

  it('should render Terms & Conditions link', () => {
    renderComponent();
    const link = screen.getByText(ABOUT_US_CONTENT.termsLink.text);
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute(
      'href',
      ABOUT_US_CONTENT.termsLink.path,
    );
  });

  it('should render Visit Website buttons with correct href', () => {
    renderComponent();
    const links = screen.getAllByText(ABOUT_US_CONTENT.visitWebsite.text);
    expect(links.length).toBe(2);
    links.forEach((link) => {
      const anchor = link.closest('a');
      expect(anchor).toHaveAttribute(
        'href',
        ABOUT_US_CONTENT.visitWebsite.url,
      );
      expect(anchor).toHaveAttribute('target', '_blank');
      expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('should render globe icons', () => {
    renderComponent();
    const globeIcons = screen.getAllByAltText('');
    expect(globeIcons.length).toBeGreaterThanOrEqual(2);
  });

  it('should render sync icon in mobile header', () => {
    renderComponent();
    expect(screen.getByAltText('sync')).toBeInTheDocument();
  });

  it('should navigate back on back button click', () => {
    renderComponent();
    const backButton = screen
      .getByRole('button', { name: '' })
    // The first button without a name is the back button with the arrow icon
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should render about-us icon in desktop header', () => {
    renderComponent();
    const icons = screen.getAllByAltText('about-us');
    const aboutUsIcon = icons.find(
      (img) => (img as HTMLImageElement).src.includes('icon-about-us'),
    );
    expect(aboutUsIcon).toBeDefined();
  });
});
