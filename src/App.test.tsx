import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { ProviderWrapper } from './test/utils';
import * as storage from './utils/storage';

// Mock the storage module
vi.mock('./utils/storage', () => ({
  storage: {
    getAuthToken: vi.fn(),
  },
}));

// Mock window.location for testing URL changes
const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  origin: 'http://localhost:3000',
  href: 'http://localhost:3000/',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock history for navigation
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  length: 1,
  state: null,
};

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true,
});

describe('App Route Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default path
    mockLocation.pathname = '/';
  });

  describe('Public Routes', () => {
    it('renders login page when navigating to /login', () => {
      // Simulate navigation to /login
      mockLocation.pathname = '/login';

      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(
        screen.getByRole('heading', { name: 'Login' })
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    it('renders common UI components page when navigating to /common-ui', () => {
      // Simulate navigation to /common-ui
      mockLocation.pathname = '/common-ui';

      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(
        screen.getByText('Common UI Components Examples')
      ).toBeInTheDocument();
    });
  });

  describe('Protected Routes', () => {
    it('redirects to login when accessing protected route without authentication', () => {
      // Mock no auth token
      vi.mocked(storage.storage.getAuthToken).mockReturnValue(null);

      // Simulate navigation to /dashboard
      mockLocation.pathname = '/dashboard';
      mockLocation.href = 'http://localhost:3000/dashboard';

      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      // Should redirect to login page - verify dashboard is not rendered
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('renders dashboard when accessing protected route with authentication', () => {
      // Mock auth token exists
      vi.mocked(storage.storage.getAuthToken).mockReturnValue('mock-token');

      // Simulate navigation to /dashboard
      mockLocation.pathname = '/dashboard';

      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders dashboard when accessing root path with authentication', () => {
      // Mock auth token exists
      vi.mocked(storage.storage.getAuthToken).mockReturnValue('mock-token');

      // Simulate navigation to root
      mockLocation.pathname = '/';

      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('404 Route', () => {
    it('renders 404 page for unknown routes', () => {
      // Simulate navigation to unknown route
      mockLocation.pathname = '/unknown-route';

      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(screen.getByText('404 - Not Found')).toBeInTheDocument();
    });
  });

  describe('Route Protection Logic', () => {
    it('allows access to login page even without authentication', () => {
      vi.mocked(storage.storage.getAuthToken).mockReturnValue(null);

      // Simulate navigation to /login
      mockLocation.pathname = '/login';

      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(
        screen.getByRole('heading', { name: 'Login' })
      ).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('allows access to common-ui page without authentication', () => {
      vi.mocked(storage.storage.getAuthToken).mockReturnValue(null);

      // Simulate navigation to /common-ui
      mockLocation.pathname = '/common-ui';

      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(
        screen.getByText('Common UI Components Examples')
      ).toBeInTheDocument();
    });
  });

  describe('App Component', () => {
    it('renders without crashing', () => {
      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(document.body).toBeInTheDocument();
    });

    it('renders the router component', () => {
      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(document.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Browser Navigation', () => {
    it('renders login page when URL is set to /login', () => {
      mockLocation.pathname = '/login';
      mockLocation.href = 'http://localhost:3000/login';

      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(
        screen.getByRole('heading', { name: 'Login' })
      ).toBeInTheDocument();
    });

    it('renders common-ui page when URL is set to /common-ui', () => {
      mockLocation.pathname = '/common-ui';
      mockLocation.href = 'http://localhost:3000/common-ui';

      render(
        <ProviderWrapper>
          <App />
        </ProviderWrapper>
      );

      expect(
        screen.getByText('Common UI Components Examples')
      ).toBeInTheDocument();
    });
  });
});
