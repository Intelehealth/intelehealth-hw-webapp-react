import { fireEvent, render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from '../../../components/navbar/navbar.component';
import { NotificationProvider } from '../../../context/NotificationContext';

const mockProfile: Record<string, unknown> = { setupLocation: 'Ranchi', avatar: '', id: undefined };

vi.mock('../../../context/ProfileContext', () => ({
  useProfileContext: () => ({
    profile: mockProfile,
    locations: [],
  }),
}));

vi.mock('../../../services/fcm.service', () => ({
  fcmService: {
    initialize: vi.fn().mockResolvedValue(false),
    requestPermission: vi.fn().mockResolvedValue(null),
  },
}));

// Helper function to render with router and notification provider
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <HashRouter>
      <NotificationProvider>{component}</NotificationProvider>
    </HashRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile.id = undefined;
  });
  it('should render without crashing', () => {
    expect(() => {
      renderWithRouter(<Navbar />);
    }).not.toThrow();
  });

  it('should render the navbar header with correct classes', () => {
    const { container } = renderWithRouter(<Navbar />);
    
    const header = container.querySelector('header');
    expect(header).toHaveClass('bg-white', 'shadow-md', 'flex', 'flex-col', 'justify-between', 'gap-4', 'items-center', 'p-4', 'rounded-lg');
  });

  it('should display the location information', () => {
    renderWithRouter(<Navbar />);
    
    expect(screen.getByText('Ranchi')).toBeInTheDocument();
  });



  it('should render all required icons', () => {
    renderWithRouter(<Navbar />);
    
    // Check for location icon
    const locationIcon = screen.getByAltText('Location');
    expect(locationIcon).toBeInTheDocument();
    expect(locationIcon).toHaveClass('w-6', 'h-6');

    // Check for notification icon
    const notificationIcon = screen.getByAltText('Notification');
    expect(notificationIcon).toBeInTheDocument();
    expect(notificationIcon).toHaveClass('w-6', 'h-6');

    // Check for user avatar
    const userAvatar = screen.getByAltText('Profile');
    expect(userAvatar).toBeInTheDocument();
    expect(userAvatar).toHaveClass('w-10', 'h-10');
  });

  it('should render patient search input on desktop', () => {
    renderWithRouter(<Navbar />);
    
    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    expect(searchInputs).toHaveLength(2); // Desktop and mobile versions
    expect(searchInputs[0]).toBeInTheDocument();
  });

  it('should render patient search input on mobile', () => {
    renderWithRouter(<Navbar />);
    
    // The mobile search input should also be present
    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    expect(searchInputs).toHaveLength(2); // Desktop and mobile versions
  });

  it('should have correct structure for desktop layout', () => {
    const { container } = renderWithRouter(<Navbar />);
    
    const desktopSection = container.querySelector('.hidden.md\\:flex');
    expect(desktopSection).toBeInTheDocument();
    expect(desktopSection).toHaveClass('items-center', 'space-x-2', 'w-4/12', 'hidden', 'md:flex');
  });

  it('should have correct structure for mobile layout', () => {
    const { container } = renderWithRouter(<Navbar />);
    
    const mobileSection = container.querySelector('.w-full.md\\:hidden');
    expect(mobileSection).toBeInTheDocument();
    expect(mobileSection).toHaveClass('w-full', 'md:hidden');
  });

  it('should display location with correct styling', () => {
    renderWithRouter(<Navbar />);
    
    const locationText = screen.getByText('Ranchi');
    expect(locationText).toHaveClass('text-(--color-muted)');
  });



  it('should have proper layout structure with flex justify-between', () => {
    const { container } = renderWithRouter(<Navbar />);
    
    const mainSection = container.querySelector('.flex.justify-between.items-center.w-full.gap-4');
    expect(mainSection).toBeInTheDocument();
  });

  it('should render location section with correct classes', () => {
    const { container } = renderWithRouter(<Navbar />);
    
    const locationSection = container.querySelector('.flex.flex-col.w-8\\/12.md\\:w-6\\/12.pl-12.md\\:pl-4');
    expect(locationSection).toBeInTheDocument();
  });

  it('should render actions section with correct classes', () => {
    const { container } = renderWithRouter(<Navbar />);
    
    const actionsSection = container.querySelector('.flex.items-center.space-x-2.ml-auto.gap-4');
    expect(actionsSection).toBeInTheDocument();
  });

  it('should have proper accessibility attributes for images', () => {
    renderWithRouter(<Navbar />);
    
    const locationIcon = screen.getByAltText('Location');
    const notificationIcon = screen.getByAltText('Notification');
    const userAvatar = screen.getByAltText('Profile');

    expect(locationIcon).toHaveAttribute('alt', 'Location');
    expect(notificationIcon).toHaveAttribute('alt', 'Notification');
    expect(userAvatar).toHaveAttribute('alt', 'Profile');
  });

  it('should render search icon in input', () => {
    renderWithRouter(<Navbar />);
    
    const searchIcons = screen.getAllByAltText('search');
    expect(searchIcons).toHaveLength(2); // Desktop and mobile versions
    expect(searchIcons[0]).toBeInTheDocument();
    expect(searchIcons[0]).toHaveClass('w-6', 'h-6');
    expect(searchIcons[1]).toBeInTheDocument();
    expect(searchIcons[1]).toHaveClass('w-6', 'h-6');
  });

  it('should maintain proper responsive layout structure', () => {
    const { container } = renderWithRouter(<Navbar />);
    
    const header = container.querySelector('header');
    const children = header?.children;
    
    expect(children).toHaveLength(2); // Desktop section and mobile section
  });

  it('should have correct gap spacing between elements', () => {
    const { container } = renderWithRouter(<Navbar />);

    const mainSection = container.querySelector('.flex.justify-between.items-center.w-full.gap-4');
    expect(mainSection).toHaveClass('gap-4');

    const actionsSection = container.querySelector('.flex.items-center.space-x-2.ml-auto.gap-4');
    expect(actionsSection).toHaveClass('gap-4');
  });

  it('should handle image error by setting default user image (covers lines 46-47)', () => {
    renderWithRouter(<Navbar />);

    const userAvatar = screen.getByAltText('Profile') as HTMLImageElement;
    expect(userAvatar).toBeInTheDocument();

    // Store the original (default) src
    const originalSrc = userAvatar.src;

    // Change the src to simulate a broken profile image
    userAvatar.src = 'https://example.com/broken-profile.jpg';

    // Verify it changed
    expect(userAvatar.src).toBe('https://example.com/broken-profile.jpg');

    // Trigger error event using fireEvent from testing-library
    fireEvent.error(userAvatar);

    // After error, src should be set back to the default image
    // The default image should be the same as the original src
    expect(userAvatar.src).toBe(originalSrc);
  });

  it('sets aria-expanded true on search input focus', () => {
    renderWithRouter(<Navbar />);

    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    fireEvent.focus(searchInputs[0]);

    expect(searchInputs[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not show dropdown when search term is empty', () => {
    renderWithRouter(<Navbar />);

    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    fireEvent.focus(searchInputs[0]);

    // No dropdown (listbox) should appear without a search term
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('allows typing in the search input', () => {
    renderWithRouter(<Navbar />);

    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    fireEvent.change(searchInputs[0], { target: { value: 'alice' } });

    expect(searchInputs[0]).toHaveValue('alice');
  });

  it('renders search input with combobox role and ARIA attributes', () => {
    renderWithRouter(<Navbar />);

    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    expect(comboboxes[0]).toHaveAttribute('aria-autocomplete', 'list');
    expect(comboboxes[0]).toHaveAttribute('aria-controls', 'patient-search-list');
  });

  it('should show unread notification badge when unreadCount > 0 (covers lines 18-20)', async () => {
    vi.doMock('../../../context/NotificationContext', () => ({
      useNotificationContext: () => ({
        notifications: [],
        unreadCount: 5,
        token: 'test-token',
        isEnabled: true,
        requestPermission: vi.fn(),
        toggleNotifications: vi.fn(),
      }),
      NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));

    vi.resetModules();

    vi.doMock('../../../context/ProfileContext', () => ({
      useProfileContext: () => ({
        profile: mockProfile,
        locations: [],
      }),
    }));

    vi.doMock('../../../services/fcm.service', () => ({
      fcmService: {
        initialize: vi.fn().mockResolvedValue(false),
        requestPermission: vi.fn().mockResolvedValue(null),
      },
    }));

    const { default: NavbarWithBadge } = await import('../../../components/navbar/navbar.component');

    render(
      <HashRouter>
        <NavbarWithBadge />
      </HashRouter>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show 99+ when unreadCount exceeds 99', async () => {
    vi.doMock('../../../context/NotificationContext', () => ({
      useNotificationContext: () => ({
        notifications: [],
        unreadCount: 150,
        token: 'test-token',
        isEnabled: true,
        requestPermission: vi.fn(),
        toggleNotifications: vi.fn(),
      }),
      NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));

    vi.resetModules();

    vi.doMock('../../../context/ProfileContext', () => ({
      useProfileContext: () => ({
        profile: mockProfile,
        locations: [],
      }),
    }));

    vi.doMock('../../../services/fcm.service', () => ({
      fcmService: {
        initialize: vi.fn().mockResolvedValue(false),
        requestPermission: vi.fn().mockResolvedValue(null),
      },
    }));

    const { default: NavbarWith99Plus } = await import('../../../components/navbar/navbar.component');

    render(
      <HashRouter>
        <NavbarWith99Plus />
      </HashRouter>
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should fall back to empty string when no location is available', () => {
    const originalSetupLocation = mockProfile.setupLocation;
    mockProfile.setupLocation = '';

    renderWithRouter(<Navbar />);

    // Location text should be empty
    const locationSection = document.querySelector('.text-\\(--color-muted\\)');
    expect(locationSection?.textContent).toBe('');

    mockProfile.setupLocation = originalSetupLocation;
  });

  it('should show opacity-40 on notification icon when disabled', async () => {
    vi.doMock('../../../context/NotificationContext', () => ({
      useNotificationContext: () => ({
        notifications: [],
        unreadCount: 0,
        token: '',
        isEnabled: false,
        requestPermission: vi.fn(),
        toggleNotifications: vi.fn(),
      }),
      NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));

    vi.resetModules();

    vi.doMock('../../../context/ProfileContext', () => ({
      useProfileContext: () => ({
        profile: mockProfile,
        locations: [],
      }),
    }));

    vi.doMock('../../../services/fcm.service', () => ({
      fcmService: {
        initialize: vi.fn().mockResolvedValue(false),
        requestPermission: vi.fn().mockResolvedValue(null),
      },
    }));

    const { default: NavbarDisabled } = await import('../../../components/navbar/navbar.component');

    render(
      <HashRouter>
        <NavbarDisabled />
      </HashRouter>
    );

    const notifIcon = screen.getByAltText('Notification');
    expect(notifIcon).toHaveClass('opacity-40');
  });
});
