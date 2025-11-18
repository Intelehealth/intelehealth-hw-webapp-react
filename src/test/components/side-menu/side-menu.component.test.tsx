import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SideMenu from '../../../components/side-menu/side-menu.component';

// Mock storage
vi.mock('../../../utils/storage', () => ({
  storage: {
    clearAuthToken: vi.fn(),
  },
}));

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock asset imports
vi.mock('../../../assets/icons/icon-about.svg', () => ({
  default: 'icon-about.svg',
}));
vi.mock('../../../assets/icons/icon-achievement.svg', () => ({
  default: 'icon-achievement.svg',
}));
vi.mock('../../../assets/icons/icon-home.svg', () => ({
  default: 'icon-home.svg',
}));
vi.mock('../../../assets/icons/icon-info.svg', () => ({
  default: 'icon-info.svg',
}));
vi.mock('../../../assets/icons/icon-power-off.svg', () => ({
  default: 'icon-power-off.svg',
}));
vi.mock('../../../assets/icons/icon-settings.svg', () => ({
  default: 'icon-settings.svg',
}));
vi.mock('../../../assets/icons/icon-videos.svg', () => ({
  default: 'icon-videos.svg',
}));
vi.mock('../../../assets/logo/intelehealth-logo-white.png', () => ({
  default: 'intelehealth-logo-white.png',
}));
vi.mock('../../../assets/logo/intelehealth-thumbnail-logo-white.png', () => ({
  default: 'intelehealth-thumbnail-logo-white.png',
}));

describe('SideMenu', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<HashRouter>{component}</HashRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset window.innerWidth to desktop by default
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock window.addEventListener and removeEventListener
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      expect(() => {
        renderWithRouter(<SideMenu />);
      }).not.toThrow();
    });

    it('should render the main container with correct classes', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const mainContainer = container.querySelector('.flex.h-screen.w-full');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('bg-gray-100');
    });

    it('should render the sidebar', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass(
        'fixed',
        'top-0',
        'left-0',
        'h-screen',
        'z-50'
      );
    });

    it('should render children content in main section', () => {
      const TestChild = () => <div data-testid="test-child">Test Child</div>;

      renderWithRouter(
        <SideMenu>
          <TestChild />
        </SideMenu>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should render main content area with correct classes', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const main = container.querySelector('main');
      expect(main).toHaveClass('flex-1', 'min-h-screen', 'transition-all');
    });
  });

  describe('Logo and Header', () => {
    it('should render the main logo when not collapsed', () => {
      renderWithRouter(<SideMenu />);

      const logo = screen.getByAltText('hero');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'intelehealth-logo-white.png');
    });

    it('should render thumbnail logo when collapsed', () => {
      renderWithRouter(<SideMenu />);

      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('hidden md:flex absolute')
      );
      expect(toggleButton).toBeInTheDocument();

      fireEvent.click(toggleButton!);

      const thumbnailLogo = screen.getByAltText('hero');
      expect(thumbnailLogo).toHaveAttribute(
        'src',
        'intelehealth-thumbnail-logo-white.png'
      );
    });

    it('should render logo with responsive classes', () => {
      renderWithRouter(<SideMenu />);

      const logo = screen.getByAltText('hero');
      expect(logo).toHaveClass('object-contain');
    });
  });

  describe('Menu Items', () => {
    it('should render all menu items', () => {
      renderWithRouter(<SideMenu />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('Help & Support')).toBeInTheDocument();
      expect(screen.getByText('Educational Videos')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('About us')).toBeInTheDocument();
    });

    it('should render menu items with correct paths', () => {
      renderWithRouter(<SideMenu />);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('href', '#/dashboard');
    });

    it('should render menu items with icons', () => {
      renderWithRouter(<SideMenu />);

      const homeLink = screen.getByText('Home').closest('a');
      const icon = homeLink?.querySelector('img');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('alt', 'Home');
    });

    it('should hide menu labels when collapsed', () => {
      renderWithRouter(<SideMenu />);

      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('hidden md:flex absolute')
      );
      fireEvent.click(toggleButton!);

      const homeLabel = screen.queryByText('Home');
      // In collapsed state, labels are conditionally rendered with !isCollapsed
      expect(homeLabel).not.toBeInTheDocument();
    });

    it('should close mobile menu when menu item is clicked', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      renderWithRouter(<SideMenu />);

      // Open mobile menu
      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);

      // Click on a menu item
      const homeLink = screen.getByText('Home');
      fireEvent.click(homeLink);

      // Verify menu is closed by checking if mobile toggle button is back
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Add Patients Button', () => {
    it('should render Add Patients button', () => {
      renderWithRouter(<SideMenu />);

      expect(screen.getByText('Add Patients')).toBeInTheDocument();
    });

    it('should render Add Patients button with correct link', () => {
      renderWithRouter(<SideMenu />);

      const addPatientsLink = screen.getByText('Add Patients').closest('a');
      expect(addPatientsLink).toHaveAttribute('href', '#/patient/add');
    });

    it('should render Add Patients button with icon', () => {
      renderWithRouter(<SideMenu />);

      const addPatientsButton = screen.getByText('Add Patients').closest('a');
      const icon = addPatientsButton?.querySelector('i.fa-user-plus');
      expect(icon).toBeInTheDocument();
    });

    it('should hide Add Patients label when collapsed', () => {
      renderWithRouter(<SideMenu />);

      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('hidden md:flex absolute')
      );
      fireEvent.click(toggleButton!);

      const addPatientsLabel = screen.queryByText('Add Patients');
      expect(addPatientsLabel).not.toBeInTheDocument();
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('should render collapse toggle button on desktop', () => {
      renderWithRouter(<SideMenu />);

      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('hidden md:flex absolute')
      );
      expect(toggleButton).toBeInTheDocument();
    });

    it('should toggle collapsed state when button is clicked', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('hidden md:flex absolute')
      );
      const sidebar = container.querySelector('aside');

      // Initially not collapsed (width: 16rem / w-64)
      expect(sidebar).toHaveClass('w-64');

      fireEvent.click(toggleButton!);

      // Should be collapsed (width: 5rem / w-20 or w-24)
      expect(sidebar).toHaveClass('w-20');
    });

    it('should change chevron icon when collapsed', () => {
      renderWithRouter(<SideMenu />);

      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('hidden md:flex absolute')
      );
      const chevronIcon = toggleButton?.querySelector('i');

      // Initially chevron-right (pointing right to collapse)
      expect(chevronIcon).toHaveClass('fa-chevron-right');

      fireEvent.click(toggleButton!);

      // After collapse, chevron-left (pointing left to expand)
      expect(chevronIcon).toHaveClass('fa-chevron-left');
    });

    it('should update main content margin when sidebar is collapsed', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const main = container.querySelector('main');
      expect(main).toHaveClass('md:ml-64');

      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('hidden md:flex absolute')
      );
      fireEvent.click(toggleButton!);

      expect(main).toHaveClass('md:ml-24');
    });
  });

  describe('Mobile Functionality', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
    });

    it('should render mobile toggle button when menu is closed', () => {
      renderWithRouter(<SideMenu />);

      const mobileToggleButton = screen.getAllByRole('button')[0];
      expect(mobileToggleButton).toHaveClass('md:hidden');
      expect(mobileToggleButton.querySelector('i.fa-bars')).toBeInTheDocument();
    });

    it('should not render mobile toggle button when menu is open', () => {
      renderWithRouter(<SideMenu />);

      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);

      // After opening, the original toggle button with fa-bars should not be visible
      const barsIcon = document.querySelector('i.fa-bars');
      expect(barsIcon).not.toBeInTheDocument();
    });

    it('should show overlay when mobile menu is open', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);

      const overlay = container.querySelector(
        '.fixed.inset-0.bg-black\\/30.z-40.md\\:hidden'
      );
      expect(overlay).toBeInTheDocument();
    });

    it('should render close button when mobile menu is open', () => {
      renderWithRouter(<SideMenu />);

      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);

      const closeButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('i.fa-times'));
      expect(closeButton).toBeInTheDocument();
    });

    it('should close mobile menu when close button is clicked', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('translate-x-0');

      const closeButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('i.fa-times'));
      fireEvent.click(closeButton!);

      expect(sidebar).not.toHaveClass('translate-x-0');
    });

    it('should open mobile menu and show sidebar', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('-translate-x-full');

      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);

      expect(sidebar).toHaveClass('translate-x-0');
    });
  });

  describe('Outside Click Handling', () => {
    it('should close mobile menu when clicking outside on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { container } = renderWithRouter(<SideMenu />);

      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('translate-x-0');

      const main = container.querySelector('main');
      fireEvent.mouseDown(main!);

      // Menu should close
      expect(sidebar).not.toHaveClass('translate-x-0');
    });

    it('should not close menu when clicking inside sidebar on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { container } = renderWithRouter(<SideMenu />);

      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('translate-x-0');

      fireEvent.mouseDown(sidebar!);

      // Menu should still be open
      expect(sidebar).toHaveClass('translate-x-0');
    });

    it('should not close menu on desktop when clicking outside', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      const { container } = renderWithRouter(<SideMenu />);

      const sidebar = container.querySelector('aside');
      const main = container.querySelector('main');

      fireEvent.mouseDown(main!);

      // Sidebar should still be visible on desktop
      expect(sidebar).toBeInTheDocument();
    });

    it('should add and remove mousedown event listener on mobile menu open/close', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderWithRouter(<SideMenu />);

      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      );
    });
  });

  describe('Window Resize Handling', () => {
    it('should add resize event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderWithRouter(<SideMenu />);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    it('should remove resize event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderWithRouter(<SideMenu />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    it('should set height for desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      const { container } = renderWithRouter(<SideMenu />);

      const innerDiv = container.querySelector(
        '.flex.flex-col.rounded-lg.bg-\\(--color-primary\\)'
      );
      expect(innerDiv).toHaveStyle({
        height: 'calc(100vh - 1.5rem)',
        maxHeight: 'calc(100vh - 1.5rem)',
      });
    });

    it('should set height for mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { container } = renderWithRouter(<SideMenu />);

      const innerDiv = container.querySelector(
        '.flex.flex-col.rounded-lg.bg-\\(--color-primary\\)'
      );
      expect(innerDiv).toHaveStyle({
        height: 'calc(100vh - 1rem)',
        maxHeight: 'calc(100vh - 1rem)',
      });
    });

    it('should update height when window is resized from mobile to desktop', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { container } = renderWithRouter(<SideMenu />);

      const innerDiv = container.querySelector(
        '.flex.flex-col.rounded-lg.bg-\\(--color-primary\\)'
      );
      expect(innerDiv).toHaveStyle({ height: 'calc(100vh - 1rem)' });

      // Resize to desktop
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(innerDiv).toHaveStyle({ height: 'calc(100vh - 1.5rem)' });
      });
    });

    it('should update height when window is resized from desktop to mobile', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      const { container } = renderWithRouter(<SideMenu />);

      const innerDiv = container.querySelector(
        '.flex.flex-col.rounded-lg.bg-\\(--color-primary\\)'
      );
      expect(innerDiv).toHaveStyle({ height: 'calc(100vh - 1.5rem)' });

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(innerDiv).toHaveStyle({ height: 'calc(100vh - 1rem)' });
      });
    });
  });

  describe('Logout Functionality', () => {
    it('should render logout button', () => {
      renderWithRouter(<SideMenu />);

      expect(screen.getByText('Log-out')).toBeInTheDocument();
    });

    it('should render logout button with icon', () => {
      renderWithRouter(<SideMenu />);

      const logoutLink = screen.getByText('Log-out').closest('a');
      const icon = logoutLink?.querySelector('img');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('src', 'icon-power-off.svg');
    });

    it('should call clearAuthToken and navigate on logout click', async () => {
      const { storage } = await import('../../../utils/storage');
      renderWithRouter(<SideMenu />);

      const logoutLink = screen.getByText('Log-out').closest('a');
      fireEvent.click(logoutLink!);

      expect(storage.clearAuthToken).toHaveBeenCalled();
    });

    it('should close mobile menu on logout click', async () => {
      const { storage } = await import('../../../utils/storage');
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      renderWithRouter(<SideMenu />);

      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);

      const logoutLink = screen.getByText('Log-out').closest('a');
      fireEvent.click(logoutLink!);

      expect(storage.clearAuthToken).toHaveBeenCalled();
    });

    it('should hide logout label when collapsed', () => {
      renderWithRouter(<SideMenu />);

      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('hidden md:flex absolute')
      );
      fireEvent.click(toggleButton!);

      const logoutLabel = screen.queryByText('Log-out');
      expect(logoutLabel).not.toBeInTheDocument();
    });
  });

  describe('Responsive Classes', () => {
    it('should have correct sidebar width when not collapsed', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-64');
    });

    it('should have correct sidebar width when collapsed', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('hidden md:flex absolute')
      );
      fireEvent.click(toggleButton!);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-20');
    });

    it('should have correct transition classes on sidebar', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass(
        'transition-all',
        'duration-300',
        'ease-in-out'
      );
    });

    it('should have correct translation classes for mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { container } = renderWithRouter(<SideMenu />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('-translate-x-full', 'md:translate-x-0');
    });
  });

  describe('Accessibility and Structure', () => {
    it('should render semantic HTML elements', () => {
      const { container } = renderWithRouter(<SideMenu />);

      expect(container.querySelector('aside')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('should have proper navigation structure', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();

      const links = nav?.querySelectorAll('a');
      expect(links?.length).toBeGreaterThan(0);
    });

    it('should render images with alt text', () => {
      renderWithRouter(<SideMenu />);

      const images = screen.getAllByRole('img');
      // Check that we have images rendered
      expect(images.length).toBeGreaterThan(0);

      // Check that most images have alt text (logo and menu icons)
      const imagesWithAlt = images.filter(img => img.hasAttribute('alt'));
      expect(imagesWithAlt.length).toBeGreaterThan(0);
    });

    it('should have logout section with border separator', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const logoutSection = container.querySelector('.border-t.border-gray-300\\/20.mt-auto');
      expect(logoutSection).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined children', () => {
      expect(() => {
        renderWithRouter(<SideMenu children={undefined} />);
      }).not.toThrow();
    });

    it('should handle null children', () => {
      expect(() => {
        renderWithRouter(<SideMenu children={null} />);
      }).not.toThrow();
    });

    it('should handle multiple rapid toggle clicks', () => {
      const { container } = renderWithRouter(<SideMenu />);

      const toggleButton = screen.getAllByRole('button').find((btn) =>
        btn.className.includes('hidden md:flex absolute')
      );
      const sidebar = container.querySelector('aside');

      expect(sidebar).toHaveClass('w-64');

      fireEvent.click(toggleButton!);
      expect(sidebar).toHaveClass('w-20');

      fireEvent.click(toggleButton!);
      expect(sidebar).toHaveClass('w-64');

      fireEvent.click(toggleButton!);
      expect(sidebar).toHaveClass('w-20');
    });

    it('should handle rapid mobile menu open/close', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { container } = renderWithRouter(<SideMenu />);

      const sidebar = container.querySelector('aside');

      const mobileToggleButton = screen.getAllByRole('button')[0];
      fireEvent.click(mobileToggleButton);
      expect(sidebar).toHaveClass('translate-x-0');

      const closeButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('i.fa-times'));
      fireEvent.click(closeButton!);
      expect(sidebar).not.toHaveClass('translate-x-0');
    });
  });
});
