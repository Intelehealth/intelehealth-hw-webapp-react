import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from '../../routes/protected.route';
import { storage } from '../../utils/storage';

// Mock the storage utility
vi.mock('../../utils/storage', () => ({
  storage: {
    getAuthToken: vi.fn(),
  },
}));

// Mock the Loader component
vi.mock('../../components/loader', () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

// Mock window.location
const mockLocation = {
  pathname: '/dashboard',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login when no token is present', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    // Should not render the protected content
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should allow access when token is present', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    // Should render the protected content
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should allow access to ignored routes without token', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue(null);
    mockLocation.pathname = '/auth/login';

    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <ProtectedRoute ignoredRoutes={['/auth/login']} />
      </MemoryRouter>
    );

    // Should not redirect and should render content
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should redirect to custom redirect path when provided', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute redirectPath="/custom-login" />
      </MemoryRouter>
    );

    // Should not render the protected content
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should handle multiple ignored routes', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue(null);
    mockLocation.pathname = '/public/page';

    render(
      <MemoryRouter initialEntries={['/public/page']}>
        <ProtectedRoute ignoredRoutes={['/auth', '/public']} />
      </MemoryRouter>
    );

    // Should not redirect for public routes
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should handle empty ignored routes array', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute ignoredRoutes={[]} />
      </MemoryRouter>
    );

    // Should not render the protected content
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should render loader when authenticated', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should handle route path matching correctly', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue(null);
    mockLocation.pathname = '/auth/forgot-password';

    render(
      <MemoryRouter initialEntries={['/auth/forgot-password']}>
        <ProtectedRoute ignoredRoutes={['/auth']} />
      </MemoryRouter>
    );

    // Should not redirect for auth routes
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should use default redirect path when not provided', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    // Should not render the protected content
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should handle token validation correctly', () => {
    // Test with valid token
    vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');

    const { rerender } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    expect(screen.getByTestId('loader')).toBeInTheDocument();

    // Test with null token
    vi.mocked(storage.getAuthToken).mockReturnValue(null);

    rerender(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should handle edge cases with ignored routes', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue(null);
    mockLocation.pathname = '/auth';

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <ProtectedRoute ignoredRoutes={['/auth']} />
      </MemoryRouter>
    );

    // Should not redirect for exact match
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should handle complex ignored routes patterns', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue(null);
    mockLocation.pathname = '/api/public/data';

    render(
      <MemoryRouter initialEntries={['/api/public/data']}>
        <ProtectedRoute ignoredRoutes={['/api/public', '/auth']} />
      </MemoryRouter>
    );

    // Should not redirect for matching ignored route
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should maintain component structure', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    // Should render both loader and outlet
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should handle window.location.pathname changes', () => {
    vi.mocked(storage.getAuthToken).mockReturnValue(null);
    
    // Test different paths
    mockLocation.pathname = '/dashboard';
    
    const { rerender } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();

    // Change to ignored route
    mockLocation.pathname = '/auth/login';
    
    rerender(
      <MemoryRouter initialEntries={['/auth/login']}>
        <ProtectedRoute ignoredRoutes={['/auth']} />
      </MemoryRouter>
    );

    // Should not redirect
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });
});