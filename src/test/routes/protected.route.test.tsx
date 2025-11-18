import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from '../../routes/protected.route';

// Mock the storage utility
vi.mock('../../utils/storage', () => ({
  storage: {
    getAuthToken: vi.fn(),
  },
}));

// Mock the Loader component
vi.mock('../../components/common', () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

import { storage } from '../../utils/storage';

// Test components
const PublicPage = () => <div data-testid="public-page">Public Page</div>;
const ProtectedPage = () => <div data-testid="protected-page">Protected Page</div>;
const LoginPage = () => <div data-testid="login-page">Login Page</div>;

// Helper to set window.location.hash for testing
const setLocationHash = (path: string) => {
  Object.defineProperty(window, 'location', {
    value: {
      hash: `#${path}`,
      pathname: '/',
      href: `http://localhost:3000/#${path}`,
      origin: 'http://localhost:3000',
    },
    writable: true,
    configurable: true,
  });
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default hash
    setLocationHash('/dashboard');
  });

  describe('Authentication Checks', () => {
    it('should redirect to default login path when no token is present', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/dashboard');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect to login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('should allow access when token is present', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');
      setLocationHash('/dashboard');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should render protected content
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    });

    it('should handle empty string token as falsy', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue('');
      setLocationHash('/dashboard');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect to login page because empty string is falsy
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
    });

    it('should handle undefined token', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect to login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
    });
  });

  describe('Custom Redirect Path', () => {
    it('should redirect to custom path when provided', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute redirectPath="/custom-login" />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/custom-login" element={<div data-testid="custom-login">Custom Login</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect to custom login page
      expect(screen.getByTestId('custom-login')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
    });

    it('should use default redirect path when not provided', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect to default /auth/login
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('Ignored Routes', () => {
    it('should allow access to ignored routes without token', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/auth/login');

      render(
        <MemoryRouter initialEntries={['/auth/login']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/auth']} />}>
              <Route path="/auth/login" element={<PublicPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should render content without redirect
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('public-page')).toBeInTheDocument();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('should handle multiple ignored routes', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/public/page');

      render(
        <MemoryRouter initialEntries={['/public/page']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/auth', '/public']} />}>
              <Route path="/public/page" element={<PublicPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should render content without redirect
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('public-page')).toBeInTheDocument();
    });

    it('should handle empty ignored routes array', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/dashboard');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={[]} />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect to login
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
    });

    it('should handle route matching with startsWith', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/auth/forgot-password');

      render(
        <MemoryRouter initialEntries={['/auth/forgot-password']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/auth']} />}>
              <Route path="/auth/forgot-password" element={<PublicPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should render content because /auth/forgot-password starts with /auth
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('public-page')).toBeInTheDocument();
    });

    it('should match exact route when path equals ignored route', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/auth');

      render(
        <MemoryRouter initialEntries={['/auth']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/auth']} />}>
              <Route path="/auth" element={<PublicPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should render content for exact match
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('public-page')).toBeInTheDocument();
    });

    it('should not match routes that do not start with ignored routes', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/dashboard/settings');

      render(
        <MemoryRouter initialEntries={['/dashboard/settings']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/auth', '/public']} />}>
              <Route path="/dashboard/settings" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect to login because /dashboard/settings doesn't start with /auth or /public
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
    });

    it('should handle complex nested route patterns', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/api/public/data/users');

      render(
        <MemoryRouter initialEntries={['/api/public/data/users']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/api/public']} />}>
              <Route path="/api/public/data/users" element={<PublicPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should render content for nested route that starts with ignored route
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('public-page')).toBeInTheDocument();
    });

    it('should handle special characters in route paths', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/auth/reset-password');

      render(
        <MemoryRouter initialEntries={['/auth/reset-password']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/auth']} />}>
              <Route path="/auth/reset-password" element={<PublicPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should render content for routes with hyphens
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('public-page')).toBeInTheDocument();
    });
  });

  describe('Component Rendering', () => {
    it('should render Loader component when authenticated', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render Outlet component when authenticated', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    });

    it('should render protected-route wrapper with data-testid', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('should render Outlet without Loader for ignored routes', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/auth/login');

      render(
        <MemoryRouter initialEntries={['/auth/login']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/auth']} />}>
              <Route path="/auth/login" element={<PublicPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('public-page')).toBeInTheDocument();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('should maintain component structure with both Loader and Outlet', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');

      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      const protectedRoute = container.querySelector('[data-testid="protected-route"]');
      expect(protectedRoute).toBeInTheDocument();
      expect(protectedRoute?.querySelector('[data-testid="loader"]')).toBeInTheDocument();
      expect(protectedRoute?.querySelector('[data-testid="protected-page"]')).toBeInTheDocument();
    });
  });

  describe('Navigate Component Behavior', () => {
    it('should render Navigate component with replace prop when redirecting', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect and replace history
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('should not render Navigate when token exists', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should not redirect
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    });

    it('should not render Navigate for ignored routes', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/public');

      render(
        <MemoryRouter initialEntries={['/public']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/public']} />}>
              <Route path="/public" element={<PublicPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should not redirect for ignored route
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('public-page')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle token change from null to valid', () => {
      // Test with null token first
      vi.mocked(storage.getAuthToken).mockReturnValue(null);

      const { unmount } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      unmount();

      // Test with valid token
      vi.mocked(storage.getAuthToken).mockReturnValue('new-valid-token');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    });

    it('should handle pathname change while token remains null', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/dashboard');

      // Test protected route without token
      const { unmount } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/auth']} />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      unmount();

      // Change to ignored route
      setLocationHash('/auth/register');

      render(
        <MemoryRouter initialEntries={['/auth/register']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/auth']} />}>
              <Route path="/auth/register" element={<PublicPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('public-page')).toBeInTheDocument();
    });

    it('should handle multiple nested routes with authentication', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');

      render(
        <MemoryRouter initialEntries={['/dashboard/settings/profile']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard/settings/profile" element={<ProtectedPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    });

    it('should prioritize ignored routes over authentication check', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue(null);
      setLocationHash('/auth/login');

      render(
        <MemoryRouter initialEntries={['/auth/login']}>
          <Routes>
            <Route element={<ProtectedRoute ignoredRoutes={['/auth']} />}>
              <Route path="/auth/login" element={<PublicPage />} />
            </Route>
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should render public page, not redirect
      expect(screen.getByTestId('public-page')).toBeInTheDocument();
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('should handle root path', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');
      setLocationHash('/');

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<ProtectedPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    });

    it('should handle query parameters in pathname', () => {
      vi.mocked(storage.getAuthToken).mockReturnValue('valid-token');
      setLocationHash('/dashboard');

      render(
        <MemoryRouter initialEntries={['/dashboard?tab=settings']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProtectedPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    });
  });
});
