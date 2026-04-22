import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AboutusPage from '../../../pages/about-us/about-us.page';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
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

describe('AboutusPage', () => {
  it('should render without crashing', () => {
    expect(() =>
      render(
        <MemoryRouter>
          <AboutusPage />
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });
});
