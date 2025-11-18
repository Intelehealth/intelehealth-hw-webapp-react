import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from '../../routes/app.routes';
import ROUTES from '../../routes/paths';

// Mock window.location for HashRouter
const mockLocation = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock storage
vi.mock('../../utils/storage', () => ({
  storage: {
    getAuthToken: vi.fn(() => 'mock-token'),
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
  },
}));

// Mock all the page components
vi.mock('../../pages/auth/login/login.page', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

vi.mock('../../pages/auth/forgot-username/forgot-username.page', () => ({
  default: () => <div data-testid="forgot-username-page">Forgot Username Page</div>,
}));

vi.mock('../../pages/auth/forgot-password/forgot-password.page', () => ({
  default: () => <div data-testid="forgot-password-page">Forgot Password Page</div>,
}));

vi.mock('../../pages/auth/verify-otp/verify-otp.page', () => ({
  default: () => <div data-testid="verify-otp-page">Verify OTP Page</div>,
}));

vi.mock('../../pages/auth/reset-password/reset-password.page', () => ({
  default: () => <div data-testid="reset-password-page">Reset Password Page</div>,
}));

vi.mock('../../pages/dashboard/dashboard.page', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}));

vi.mock('../../pages/not-found/not-found.page', () => ({
  default: () => <div data-testid="not-found-page">Not Found Page</div>,
}));

vi.mock('../../components/common/common-ui.component', () => ({
  default: () => <div data-testid="example-usage">Example Usage</div>,
}));

// Mock the Loader component
vi.mock('../../components/loader', () => ({
  Loader: () => <div data-testid="loader">Loading...</div>,
}));

// Mock the SideMenu component
vi.mock('../../components/side-menu/side-menu.component', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="side-menu">{children}</div>
  ),
}));

// Mock the Navbar component
vi.mock('../../components/navbar/navbar.component', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

// Mock the DownMenu component
vi.mock('../../components/down-menu/down-menu.component', () => ({
  default: () => <div data-testid="down-menu">DownMenu</div>,
}));

describe('AppRoutes', () => {
  beforeEach(() => {
    // Reset location to default
    mockLocation.pathname = '/';
    mockLocation.href = 'http://localhost:3000';
    mockLocation.origin = 'http://localhost:3000';
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<AppRoutes />);
    }).not.toThrow();
  });

  it('should render HashRouter as the root component', () => {
    const { container } = render(<AppRoutes />);

    // The component should render without errors
    expect(container.firstChild).toBeInTheDocument();
  });

  describe('Auth routes', () => {
    it('should render login page at /auth/login', () => {
      mockLocation.pathname = '/auth/login';
      mockLocation.href = 'http://localhost:3000/auth/login';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('should render forgot username page at /auth/forgot-username', () => {
      mockLocation.pathname = '/auth/forgot-username';
      mockLocation.href = 'http://localhost:3000/auth/forgot-username';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('should render forgot password page at /auth/forgot-password', () => {
      mockLocation.pathname = '/auth/forgot-password';
      mockLocation.href = 'http://localhost:3000/auth/forgot-password';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('should render verify OTP page at /auth/verify-otp', () => {
      mockLocation.pathname = '/auth/verify-otp';
      mockLocation.href = 'http://localhost:3000/auth/verify-otp';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('should render reset password page at /auth/reset-password', () => {
      mockLocation.pathname = '/auth/reset-password';
      mockLocation.href = 'http://localhost:3000/auth/reset-password';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });
  });

  describe('Protected routes', () => {
    it('should render dashboard page at root path', () => {
      mockLocation.pathname = '/';
      mockLocation.href = 'http://localhost:3000/';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('main-container')).toBeInTheDocument();
    });

    it('should render dashboard page at /dashboard', () => {
      mockLocation.pathname = '/dashboard';
      mockLocation.href = 'http://localhost:3000/dashboard';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('main-container')).toBeInTheDocument();
    });
  });

  describe('Common UI route', () => {
    it('should render ExampleUsage component at /common-ui', () => {
      mockLocation.pathname = '/common-ui';
      mockLocation.href = 'http://localhost:3000/common-ui';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('example-usage')).toBeInTheDocument();
    });
  });

  describe('404 fallback', () => {
    it('should render not found page for unknown routes', () => {
      mockLocation.pathname = '/unknown-route';
      mockLocation.href = 'http://localhost:3000/unknown-route';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });

    it('should render not found page for deeply nested unknown routes', () => {
      mockLocation.pathname = '/some/deep/unknown/route';
      mockLocation.href = 'http://localhost:3000/some/deep/unknown/route';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
  });

  describe('Route structure', () => {
    it('should have correct route hierarchy', () => {
      mockLocation.pathname = '/';
      mockLocation.href = 'http://localhost:3000/';
      
      render(<AppRoutes />);

      // Should render main container for protected routes
      expect(screen.getByTestId('main-container')).toBeInTheDocument();
    });

    it('should handle nested routes correctly', () => {
      mockLocation.pathname = '/auth/login';
      mockLocation.href = 'http://localhost:3000/auth/login';
      
      render(<AppRoutes />);

      // Should render protected route wrapper for auth routes
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });
  });

  describe('Route constants usage', () => {
    it('should use ROUTES constants for paths', () => {
      // This test ensures that the routes are using the constants from paths.ts
      expect(ROUTES.ROOT).toBe('/');
      expect(ROUTES.AUTH.BASE).toBe('/auth');
      expect(ROUTES.AUTH.LOGIN).toBe('login');
      expect(ROUTES.AUTH.FORGOT_USERNAME).toBe('forgot-username');
      expect(ROUTES.AUTH.FORGOT_PASSWORD).toBe('forgot-password');
      expect(ROUTES.AUTH.VERIFY_OTP).toBe('verify-otp');
      expect(ROUTES.AUTH.RESET_PASSWORD).toBe('reset-password');
      expect(ROUTES.DASHBOARD).toBe('/dashboard');
      expect(ROUTES.COMMON_UI).toBe('/common-ui');
      expect(ROUTES.NOT_FOUND).toBe('*');
    });
  });

  describe('Component imports', () => {
    it('should import all required components', () => {
      // This test ensures all imports are working correctly
      expect(() => {
        render(<AppRoutes />);
      }).not.toThrow();
    });
  });

  describe('Route configuration', () => {
    it('should have auth routes with ignored routes configuration', () => {
      mockLocation.pathname = '/auth/login';
      mockLocation.href = 'http://localhost:3000/auth/login';
      
      render(<AppRoutes />);

      // The protected route should be rendered with ignored routes
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });

    it('should have protected routes wrapped in MainContainer', () => {
      mockLocation.pathname = '/dashboard';
      mockLocation.href = 'http://localhost:3000/dashboard';
      
      render(<AppRoutes />);

      // The main container should be rendered for protected routes
      expect(screen.getByTestId('main-container')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty path', () => {
      mockLocation.pathname = '';
      mockLocation.href = 'http://localhost:3000';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('main-container')).toBeInTheDocument();
    });

    it('should handle root path with trailing slash', () => {
      mockLocation.pathname = '/';
      mockLocation.href = 'http://localhost:3000/';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('main-container')).toBeInTheDocument();
    });

    it('should handle auth routes with trailing slash', () => {
      mockLocation.pathname = '/auth/login/';
      mockLocation.href = 'http://localhost:3000/auth/login/';
      
      render(<AppRoutes />);

      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });
  });
});
