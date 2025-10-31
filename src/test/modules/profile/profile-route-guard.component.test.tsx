import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfileGuard } from '../../../context/ProfileGuardContext';
import ProfileRouteGuard from '../../../modules/profile/profile-route-guard.component';

// Mock the profile guard context
vi.mock('../../../context/ProfileGuardContext', () => ({
  useProfileGuard: vi.fn(),
}));

// Mock the profile status modal
vi.mock('../../../modules/profile/profile-status-modal.component', () => ({
  default: ({ isOpen, onGoToProfile, profileState }: any) => 
    isOpen ? (
      <div data-testid="profile-modal">
        <div>Profile {profileState} modal</div>
        <button onClick={onGoToProfile}>Go to Profile</button>
      </div>
    ) : null,
}));

const TestComponent = () => <div data-testid="test-content">Test Content</div>;

// COMMENTED OUT: Profile tests
describe.skip('ProfileRouteGuard', () => {
  const mockUseProfileGuard = vi.mocked(useProfileGuard);
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should render loading state when loading', () => {
    // Mock the profile guard context for loading state
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: true,
      profileState: 'incomplete',
      refreshProfileStatus: vi.fn(),
    });

    const { container } = render(
      <BrowserRouter>
        <ProfileRouteGuard>
          <TestComponent />
        </ProfileRouteGuard>
      </BrowserRouter>
    );

    // Check for loading spinner
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
  });

  it('should show modal when profile is incomplete', () => {
    // Mock the profile guard context for incomplete state
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: false,
      profileState: 'incomplete',
      refreshProfileStatus: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProfileRouteGuard>
          <TestComponent />
        </ProfileRouteGuard>
      </BrowserRouter>
    );

    expect(screen.getByTestId('profile-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
  });

  it('should render children when profile is complete', () => {
    // Mock the profile guard context for complete state
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: true,
      loading: false,
      profileState: 'complete',
      refreshProfileStatus: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProfileRouteGuard>
          <TestComponent />
        </ProfileRouteGuard>
      </BrowserRouter>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-modal')).not.toBeInTheDocument();
  });
});