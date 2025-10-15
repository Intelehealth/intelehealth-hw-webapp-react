import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SideMenu from '../../../components/side-menu copy/side-menu.component';

// Mock window.innerWidth for responsive tests
const mockInnerWidth = vi.fn();
Object.defineProperty(window, 'innerWidth', {
  get: mockInnerWidth,
});

// Mock the logo image
vi.mock('../../../assets/logo/intelehealth-logo-white.png', () => ({
  default: '/src/assets/logo/intelehealth-logo-white.png',
}));

describe('SideMenu Copy Component', () => {
  beforeEach(() => {
    mockInnerWidth.mockReturnValue(1024); // Default to desktop width
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(
        <MemoryRouter>
          <SideMenu />
        </MemoryRouter>
      );
    }).not.toThrow();
  });

  it('should render hamburger menu button on mobile', () => {
    mockInnerWidth.mockReturnValue(500); // Mobile width
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const hamburgerButton = screen.getByRole('button');
    expect(hamburgerButton).toBeInTheDocument();
    expect(hamburgerButton).toHaveClass('md:hidden', 'absolute', 'flex', 'items-center', 'p-4');
  });

  it('should render hamburger icon', () => {
    mockInnerWidth.mockReturnValue(500); // Mobile width
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const hamburgerIcon = screen.getByRole('button').querySelector('i');
    expect(hamburgerIcon).toHaveClass('fas', 'fa-bars', 'text-2xl');
  });

  it('should render side menu container', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const navigationElements = screen.getAllByRole('navigation');
    const menuContainer = navigationElements[0].closest('div');
    expect(menuContainer).toBeInTheDocument();
  });

  it('should render logo in header', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const logo = screen.getByAltText('hero');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/src/assets/logo/intelehealth-logo-white.png');
    expect(logo).toHaveClass('h-[74px]', 'bject-contain');
  });

  it('should render navigation links', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should render home link with correct attributes', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveClass('flex', 'items-center', 'space-x-2', 'hover:bg-(--color-primary-dark)', 'p-2', 'rounded-lg', 'min-h-[50px]');
  });

  it('should render logout link with correct attributes', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const logoutLink = screen.getByText('Logout').closest('a');
    expect(logoutLink).toHaveAttribute('href', '/');
    expect(logoutLink).toHaveClass('flex', 'items-center', 'space-x-2', 'hover:bg-purple-600', 'p-2', 'rounded-lg');
  });

  it('should render icons for navigation items', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const homeIcon = screen.getByText('Home').closest('a')?.querySelector('i');
    const logoutIcon = screen.getByText('Logout').closest('a')?.querySelector('i');

    expect(homeIcon).toHaveClass('fas', 'fa-home');
    expect(logoutIcon).toHaveClass('fas', 'fa-power-off');
  });

  it('should toggle menu visibility when hamburger button is clicked', () => {
    mockInnerWidth.mockReturnValue(500); // Mobile width
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const hamburgerButton = screen.getByRole('button');
    const navigationElements = screen.getAllByRole('navigation');
    const menuContainer = navigationElements[0].closest('div');

    // Initially hidden on mobile
    expect(menuContainer).toHaveClass('hidden', 'opacity-0', '-translate-y-4');

    // Click hamburger button
    fireEvent.click(hamburgerButton);

    // Should be visible
    expect(menuContainer).toHaveClass('absolute', 'opacity-100', 'translate-y-0');
  });

  it('should show menu on desktop by default', () => {
    mockInnerWidth.mockReturnValue(1024); // Desktop width
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const navigationElements = screen.getAllByRole('navigation');
    const menuContainer = navigationElements[0].closest('div');
    expect(menuContainer).toHaveClass('md:block');
  });

  it('should have correct CSS classes for menu container', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const navigationElements = screen.getAllByRole('navigation');
    const menuContainer = navigationElements[0].closest('div');
    expect(menuContainer).toHaveClass('md:w-70', 'w-56', 'bg-(--color-primary)', 'text-white', 'p-4', 'h-full', 'border-2', 'border-white', 'rounded-lg', 'shadow-lg', 'z-50', 'flex', 'flex-col');
  });

  it('should have correct navigation structure', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const navigationElements = screen.getAllByRole('navigation');
    expect(navigationElements).toHaveLength(2); // Two nav elements

    // First nav should contain home link
    const firstNav = navigationElements[0];
    expect(firstNav).toHaveClass('flex', 'flex-col', 'space-y-4');
    expect(firstNav).toContainElement(screen.getByText('Home'));

    // Second nav should contain logout link
    const secondNav = navigationElements[1];
    expect(secondNav).toHaveClass('flex', 'flex-col', 'space-y-4', 'mt-auto');
    expect(secondNav).toContainElement(screen.getByText('Logout'));
  });

  it('should handle mobile menu toggle correctly', () => {
    mockInnerWidth.mockReturnValue(500); // Mobile width
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const hamburgerButton = screen.getByRole('button');
    const navigationElements = screen.getAllByRole('navigation');
    const menuContainer = navigationElements[0].closest('div');

    // Initially hidden
    expect(menuContainer).toHaveClass('hidden');

    // Click to open
    fireEvent.click(hamburgerButton);
    expect(menuContainer).toHaveClass('absolute', 'opacity-100', 'translate-y-0');

    // Click again to close
    fireEvent.click(hamburgerButton);
    expect(menuContainer).toHaveClass('hidden', 'opacity-0', '-translate-y-4');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  it('should render with correct layout structure', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    // Should have main container
    const navigationElements = screen.getAllByRole('navigation');
    const mainContainer = navigationElements[0].closest('div')?.parentElement;
    expect(mainContainer).toBeInTheDocument();

    // Should have logo section
    const logoSection = screen.getByAltText('hero').closest('div');
    expect(logoSection).toHaveClass('mb-6');

    // Should have navigation sections
    expect(navigationElements).toHaveLength(2);
  });

  it('should handle window resize events', () => {
    // Start with mobile width
    mockInnerWidth.mockReturnValue(500);
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const navigationElements = screen.getAllByRole('navigation');
    const menuContainer = navigationElements[0].closest('div');
    expect(menuContainer).toHaveClass('md:block'); // Should still have desktop classes
  });

  it('should render all required elements', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    // Check for all required elements
    expect(screen.getByAltText('hero')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should have correct hover states for links', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const homeLink = screen.getByText('Home').closest('a');
    const logoutLink = screen.getByText('Logout').closest('a');

    expect(homeLink).toHaveClass('hover:bg-(--color-primary-dark)');
    expect(logoutLink).toHaveClass('hover:bg-purple-600');
  });

  it('should maintain proper spacing and layout', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    );

    const navigationElements = screen.getAllByRole('navigation');
    const menuContainer = navigationElements[0].closest('div');
    expect(menuContainer).toHaveClass('flex', 'flex-col');

    navigationElements.forEach(nav => {
      expect(nav).toHaveClass('flex', 'flex-col', 'space-y-4');
    });
  });
});
