import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { helpCategories } from '../../../assets/data/help.data';

vi.mock('../../../assets/icons/icon-help-and-support.svg', () => ({
  default: 'mocked-help-icon.svg',
}));

vi.mock('../../../assets/icons/icon-sync.svg', () => ({
  default: 'mocked-sync-icon.svg',
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import HelpAndSupportComponent from '../../../modules/help-and-support/help-and-support';

const renderWithRouter = (
  ui: React.ReactElement,
  { route = '/help' }: { route?: string } = {}
) => {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
  );
};

describe('HelpAndSupportComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Title rendering', () => {
    it('should display "Help & Support" on /help route', () => {
      renderWithRouter(<HelpAndSupportComponent />);
      const titles = screen.getAllByText('Help & Support');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('should display "Videos" on /help/videos route', () => {
      renderWithRouter(<HelpAndSupportComponent />, { route: '/help/videos' });
      const titles = screen.getAllByText('Videos');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('should display "FAQs" on /help/faq route', () => {
      renderWithRouter(<HelpAndSupportComponent />, { route: '/help/faq' });
      const titles = screen.getAllByText('FAQs');
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  describe('Back button', () => {
    it('should not show back button on main /help page', () => {
      renderWithRouter(<HelpAndSupportComponent />);
      const backButtons = screen.queryAllByRole('button');
      const arrowButtons = backButtons.filter(btn =>
        btn.querySelector('.fa-arrow-left')
      );
      expect(arrowButtons.length).toBe(0);
    });

    it('should show back button on sub-pages', () => {
      renderWithRouter(<HelpAndSupportComponent />, { route: '/help/videos' });
      const backButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('.fa-arrow-left')
      );
      expect(backButtons.length).toBeGreaterThan(0);
    });

    it('should navigate to /help when mobile back button is clicked', () => {
      renderWithRouter(<HelpAndSupportComponent />, { route: '/help/videos' });
      const backButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('.fa-arrow-left')
      );
      fireEvent.click(backButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/help');
    });

    it('should navigate to /help when desktop back button is clicked', () => {
      renderWithRouter(<HelpAndSupportComponent />, { route: '/help/faq' });
      const backButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('.fa-arrow-left')
      );
      fireEvent.click(backButtons[1]);
      expect(mockNavigate).toHaveBeenCalledWith('/help');
    });

    it('should show help icon on main /help page (desktop)', () => {
      renderWithRouter(<HelpAndSupportComponent />);
      const helpIcon = screen.getByAltText('help');
      expect(helpIcon).toBeInTheDocument();
      expect(helpIcon).toHaveAttribute('src', 'mocked-help-icon.svg');
    });

    it('should show sync icon on mobile header', () => {
      renderWithRouter(<HelpAndSupportComponent />);
      const syncIcon = screen.getByAltText('sync');
      expect(syncIcon).toBeInTheDocument();
      expect(syncIcon).toHaveAttribute('src', 'mocked-sync-icon.svg');
    });
  });

  describe('Category buttons', () => {
    it('should render all category buttons', () => {
      renderWithRouter(<HelpAndSupportComponent />);
      helpCategories.forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });
    });

    it('should have "All" category active by default', () => {
      renderWithRouter(<HelpAndSupportComponent />);
      const allButton = screen.getByText('All');
      expect(allButton.className).toContain('bg-[#2E1E91]');
      expect(allButton.className).toContain('text-white');
    });

    it('should change active category on click', () => {
      renderWithRouter(<HelpAndSupportComponent />);
      const checkupButton = screen.getByText('Check-up');
      fireEvent.click(checkupButton);
      expect(checkupButton.className).toContain('bg-[#2E1E91]');
      expect(checkupButton.className).toContain('text-white');

      const allButton = screen.getByText('All');
      expect(allButton.className).toContain('bg-[#EFE8FF]');
    });

    it('should apply inactive styles to non-active categories', () => {
      renderWithRouter(<HelpAndSupportComponent />);
      const appointmentButton = screen.getByText('Appointment');
      expect(appointmentButton.className).toContain('bg-[#EFE8FF]');
      expect(appointmentButton.className).toContain('text-[#2E1E91]');
    });
  });

  describe('Children rendering', () => {
    it('should render children content', () => {
      renderWithRouter(
        <HelpAndSupportComponent>
          <div data-testid="child-content">Child Content</div>
        </HelpAndSupportComponent>
      );
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('should render without children', () => {
      const { container } = renderWithRouter(<HelpAndSupportComponent />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('headerRight prop', () => {
    it('should render headerRight content', () => {
      renderWithRouter(
        <HelpAndSupportComponent
          headerRight={<div data-testid="header-right">Search</div>}
        />
      );
      expect(screen.getByTestId('header-right')).toBeInTheDocument();
    });

    it('should render without headerRight', () => {
      const { container } = renderWithRouter(<HelpAndSupportComponent />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Layout structure', () => {
    it('should render mobile header with md:hidden class', () => {
      const { container } = renderWithRouter(<HelpAndSupportComponent />);
      const mobileHeader = container.querySelector('.md\\:hidden.flex');
      expect(mobileHeader).toBeInTheDocument();
    });

    it('should render desktop header with hidden md:flex class', () => {
      const { container } = renderWithRouter(<HelpAndSupportComponent />);
      const desktopHeader = container.querySelector('.hidden.md\\:flex');
      expect(desktopHeader).toBeInTheDocument();
    });

    it('should render the horizontal rule for desktop', () => {
      const { container } = renderWithRouter(<HelpAndSupportComponent />);
      const hr = container.querySelector('hr');
      expect(hr).toBeInTheDocument();
      expect(hr?.className).toContain('hidden');
      expect(hr?.className).toContain('md:block');
    });
  });

  describe('Component export', () => {
    it('should export HelpAndSupportComponent as default', () => {
      expect(HelpAndSupportComponent).toBeDefined();
      expect(typeof HelpAndSupportComponent).toBe('function');
    });
  });
});
