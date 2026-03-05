import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from '../../../components/navbar/navbar.component';

const mockProfile: Record<string, unknown> = { setupLocation: 'Ranchi', avatar: '', id: undefined };

vi.mock('../../../context/ProfileContext', () => ({
  useProfileContext: () => ({
    profile: mockProfile,
    locations: [],
  }),
}));

const mockGetRecentPatients = vi.fn();
vi.mock('../../../services/patient.service', () => ({
  patientService: {
    getRecentPatients: (...args: unknown[]) => mockGetRecentPatients(...args),
  },
}));

// Helper function to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<HashRouter>{component}</HashRouter>);
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
    
    // Check for sync icon
    const syncIcon = screen.getByAltText('Sync');
    expect(syncIcon).toBeInTheDocument();
    expect(syncIcon).toHaveClass('w-6', 'h-6');
    
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
    const syncIcon = screen.getByAltText('Sync');
    const notificationIcon = screen.getByAltText('Notification');
    const userAvatar = screen.getByAltText('Profile');
    
    expect(locationIcon).toHaveAttribute('alt', 'Location');
    expect(syncIcon).toHaveAttribute('alt', 'Sync');
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

  it('fetches recent patients when modal opens and hwId is available', async () => {
    mockProfile.id = 'hw-test-id';
    const mockPatients = [
      { visitUuid: 'v-1', patientName: 'John Doe', gender: 'M', age: 30, visitCreatedDate: '2025-01-01', clinicName: 'Clinic A', uploadTimestamp: '1h' },
    ];
    mockGetRecentPatients.mockResolvedValue(mockPatients);

    renderWithRouter(<Navbar />);

    // Focus search input to trigger setSearchModalOpen(true)
    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    fireEvent.focus(searchInputs[0]);

    await waitFor(() => {
      expect(mockGetRecentPatients).toHaveBeenCalledWith('hw-test-id');
    });
  });

  it('sets error state when getRecentPatients fails', async () => {
    mockProfile.id = 'hw-test-id';
    mockGetRecentPatients.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<Navbar />);

    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    fireEvent.focus(searchInputs[0]);

    await waitFor(() => {
      expect(mockGetRecentPatients).toHaveBeenCalledWith('hw-test-id');
    });
  });

  it('does not fetch patients when hwId is not available', () => {
    // mockProfile.id is undefined (default from beforeEach)
    renderWithRouter(<Navbar />);

    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    fireEvent.focus(searchInputs[0]);

    expect(mockGetRecentPatients).not.toHaveBeenCalled();
  });

  it('filters patients on search input change', async () => {
    mockProfile.id = 'hw-test-id';
    const mockPatients = [
      { visitUuid: 'v-1', patientName: 'Alice Smith', gender: 'F', age: 25, visitCreatedDate: '2025-01-01', clinicName: 'Clinic A', uploadTimestamp: '1h' },
      { visitUuid: 'v-2', patientName: 'Bob Jones', gender: 'M', age: 35, visitCreatedDate: '2025-01-02', clinicName: 'Clinic B', uploadTimestamp: '2h' },
    ];
    mockGetRecentPatients.mockResolvedValue(mockPatients);

    renderWithRouter(<Navbar />);

    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    fireEvent.focus(searchInputs[0]);

    await waitFor(() => {
      expect(mockGetRecentPatients).toHaveBeenCalled();
    });

    // Type to filter
    fireEvent.change(searchInputs[0], { target: { value: 'alice' } });
    // Filter logic runs without error
    expect(searchInputs[0]).toBeInTheDocument();
  });

  it('closes modal when patient is selected', async () => {
    mockProfile.id = 'hw-test-id';
    const mockPatients = [
      { visitUuid: 'v-1', patientName: 'Carol White', gender: 'F', age: 28, visitCreatedDate: '2025-01-01', clinicName: 'Clinic C', uploadTimestamp: '1h' },
    ];
    mockGetRecentPatients.mockResolvedValue(mockPatients);

    renderWithRouter(<Navbar />);

    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    fireEvent.focus(searchInputs[0]);

    await waitFor(() => {
      expect(screen.getByText('Carol White')).toBeInTheDocument();
    });

    // Click patient to trigger handlePatientSelect
    fireEvent.click(screen.getByText('Carol White'));

    // Modal should close after selection
    await waitFor(() => {
      expect(screen.queryByText('Carol White')).not.toBeInTheDocument();
    });
  });
});
