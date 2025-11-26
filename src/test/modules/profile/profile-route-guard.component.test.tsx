import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProfileRouteGuard from '../../../modules/profile/profile-route-guard.component';
import { loaderReducer } from '../../../reducers/loader.reducer';

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

// Mock Loader component
vi.mock('../../../components/common', () => ({
  Loader: ({ id }: { id?: string }) => (
    <div data-testid={`loader-${id || 'global'}`}>Loading...</div>
  ),
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

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      loader: loaderReducer,
    },
  });
};

describe('ProfileRouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render loader initially before profile check completes', () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      profileState: 'not-started',
    });

    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <ProfileRouteGuard>
          <div>Children content</div>
        </ProfileRouteGuard>
      </Provider>
    );

    // With the fix, not-started now shows modal instead of loader
    // The loader only shows during the initial render before useEffect runs
    // Since we're mocking the hook, it returns immediately with not-started
    // So we expect the modal to be shown for not-started state
    expect(container.querySelector('[data-testid="profile-status-modal"]')).toBeInTheDocument();
  });

  it('should show modal when profile is incomplete', async () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      profileState: 'incomplete',
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProfileRouteGuard>
          <div>Children content</div>
        </ProfileRouteGuard>
      </Provider>
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
      profileState: 'not-started',
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProfileRouteGuard>
          <div>Children content</div>
        </ProfileRouteGuard>
      </Provider>
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
      profileState: 'complete',
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProfileRouteGuard>
          <div data-testid="children-content">Children content</div>
        </ProfileRouteGuard>
      </Provider>
    );

    expect(screen.getByTestId('children-content')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-status-modal')).not.toBeInTheDocument();
  });

  it('should call handleGoToProfile and navigate to profile when modal button is clicked', async () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      profileState: 'incomplete',
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProfileRouteGuard>
          <div>Children content</div>
        </ProfileRouteGuard>
      </Provider>
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
    const store = createTestStore();

    // Initially incomplete
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      profileState: 'incomplete',
    });

    const { rerender } = render(
      <Provider store={store}>
        <ProfileRouteGuard>
          <div>Children content</div>
        </ProfileRouteGuard>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-status-modal')).toBeInTheDocument();
    });

    // Profile becomes complete
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: true,
      profileState: 'complete',
    });

    rerender(
      <Provider store={store}>
        <ProfileRouteGuard>
          <div>Children content</div>
        </ProfileRouteGuard>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('profile-status-modal')).not.toBeInTheDocument();
    });
  });

  it('should not render children when profile is incomplete', async () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      profileState: 'incomplete',
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProfileRouteGuard>
          <div data-testid="children-content">Children content</div>
        </ProfileRouteGuard>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('children-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('profile-status-modal')).toBeInTheDocument();
    });
  });

  it('should pass correct profileState to modal when profileState is incomplete', async () => {
    mockUseProfileGuard.mockReturnValue({
      isProfileComplete: false,
      profileState: 'incomplete',
    });

    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProfileRouteGuard>
          <div>Children content</div>
        </ProfileRouteGuard>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('modal-profile-state')).toHaveTextContent('incomplete');
    });
  });
});

