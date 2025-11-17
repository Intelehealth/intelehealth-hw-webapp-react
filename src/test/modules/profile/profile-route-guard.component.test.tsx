import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileRouteGuard from '../../../modules/profile/profile-route-guard.component';

// Mock useProfileGuard hook
const mockUseProfileGuard = vi.fn();

vi.mock('../../../context/ProfileGuardContext', () => ({
  useProfileGuard: (...args: any[]) => mockUseProfileGuard(...args),
}));

// Mock useNavigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock ProfileStatusModal
vi.mock('../../../modules/profile/profile-status-modal.component', () => ({
  default: ({
    isOpen,
    onGoToProfile,
    profileState,
  }: {
    isOpen: boolean;
    onGoToProfile: () => void;
    profileState: 'not-started' | 'incomplete';
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="profile-status-modal">
        <div data-testid="modal-profile-state">{profileState}</div>
        <button data-testid="modal-go-to-profile" onClick={onGoToProfile}>
          Go to Profile
        </button>
      </div>
    );
  },
}));

describe('ProfileRouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should show loading spinner when loading is true', () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: true,
      profileState: 'not-started',
    });

    const { container } = render(
      <ProfileRouteGuard>
        <div>Children content</div>
      </ProfileRouteGuard>
    );

    // Check for spinner element
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText('Children content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-status-modal')).not.toBeInTheDocument();
  });

  it('should show modal when profile is incomplete and not loading', async () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: false,
      profileState: 'incomplete',
    });

    render(
      <ProfileRouteGuard>
        <div>Children content</div>
      </ProfileRouteGuard>
    );

    await waitFor(() => {
      const modal = screen.getByTestId('profile-status-modal');
      expect(modal).toBeInTheDocument();
      expect(screen.getByTestId('modal-profile-state')).toHaveTextContent('incomplete');
      expect(screen.queryByText('Children content')).not.toBeInTheDocument();
    });
  });

  it('should show modal with not-started state when profileState is not-started', async () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: false,
      profileState: 'not-started',
    });

    render(
      <ProfileRouteGuard>
        <div>Children content</div>
      </ProfileRouteGuard>
    );

    await waitFor(() => {
      const modal = screen.getByTestId('profile-status-modal');
      expect(modal).toBeInTheDocument();
      expect(screen.getByTestId('modal-profile-state')).toHaveTextContent('not-started');
    });
  });

  it('should render children when profile is complete', () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: true,
      loading: false,
      profileState: 'complete',
    });

    render(
      <ProfileRouteGuard>
        <div data-testid="children-content">Children content</div>
      </ProfileRouteGuard>
    );

    expect(screen.getByTestId('children-content')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-status-modal')).not.toBeInTheDocument();
  });

  it('should call handleGoToProfile and navigate to profile when modal button is clicked', async () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: false,
      profileState: 'incomplete',
    });

    render(
      <ProfileRouteGuard>
        <div>Children content</div>
      </ProfileRouteGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-status-modal')).toBeInTheDocument();
    });

    const goToProfileButton = screen.getByTestId('modal-go-to-profile');
    goToProfileButton.click();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  it('should close modal when profile becomes complete', async () => {
    const { rerender } = render(
      <ProfileRouteGuard>
        <div>Children content</div>
      </ProfileRouteGuard>
    );

    // Initially incomplete
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: false,
      profileState: 'incomplete',
    });

    rerender(
      <ProfileRouteGuard>
        <div>Children content</div>
      </ProfileRouteGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-status-modal')).toBeInTheDocument();
    });

    // Profile becomes complete
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: true,
      loading: false,
      profileState: 'complete',
    });

    rerender(
      <ProfileRouteGuard>
        <div>Children content</div>
      </ProfileRouteGuard>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('profile-status-modal')).not.toBeInTheDocument();
    });
  });

  it('should open modal when loading changes from true to false and profile is incomplete', async () => {
    // Initially loading
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: true,
      profileState: 'incomplete',
    });

    const { rerender } = render(
      <ProfileRouteGuard>
        <div>Children content</div>
      </ProfileRouteGuard>
    );

    // Should show loading spinner
    expect(screen.queryByTestId('profile-status-modal')).not.toBeInTheDocument();

    // Loading completes, profile still incomplete
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: false,
      profileState: 'incomplete',
    });

    rerender(
      <ProfileRouteGuard>
        <div>Children content</div>
      </ProfileRouteGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-status-modal')).toBeInTheDocument();
    });
  });

  it('should not render children when profile is incomplete', async () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: false,
      profileState: 'incomplete',
    });

    render(
      <ProfileRouteGuard>
        <div data-testid="children-content">Children content</div>
      </ProfileRouteGuard>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('children-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('profile-status-modal')).toBeInTheDocument();
    });
  });

  it('should pass correct profileState to modal when profileState is incomplete', async () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      loading: false,
      profileState: 'incomplete',
    });

    render(
      <ProfileRouteGuard>
        <div>Children content</div>
      </ProfileRouteGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('modal-profile-state')).toHaveTextContent('incomplete');
    });
  });
});

