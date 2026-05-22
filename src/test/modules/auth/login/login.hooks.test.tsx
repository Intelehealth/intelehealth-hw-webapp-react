import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DOCTOR_ROLE, NURSE_ROLE, SYSTEM_ADMIN_ROLE } from '../../../../modules/auth/login/login.constant';

// Hoisted mocks to avoid Vitest hoisting issues
const h = vi.hoisted(() => ({
  mockOpenMRSLogin: vi.fn(),
  mockOpenMRSLogout: vi.fn(),
  mockBackendLogin: vi.fn(),
  mockShowToast: vi.fn(),
  mockSetCookie: vi.fn(),
  mockRemoveJSessionId: vi.fn(),
  mockSetAuthToken: vi.fn(),
  mockSetUser: vi.fn(),
  mockClearAuthToken: vi.fn(),
  mockClearUser: vi.fn(),
  mockSetBasicAuthHeader: vi.fn(),
  mockClearBasicAuthHeader: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../../../modules/auth/login/login.service', () => {
  return {
    loginService: {
      login: h.mockBackendLogin,
      openMRSLogin: h.mockOpenMRSLogin,
      openMRSLogout: h.mockOpenMRSLogout,
    },
    default: {
      login: h.mockBackendLogin,
      openMRSLogin: h.mockOpenMRSLogin,
      openMRSLogout: h.mockOpenMRSLogout,
    },
  };
});

vi.mock('../../../../services/toast', () => ({
  showToast: (...args: unknown[]) => h.mockShowToast(...args),
}));

vi.mock('../../../../utils/cookie', () => ({
  cookie: {
    setCookie: (...args: unknown[]) => h.mockSetCookie(...args),
    removeJSessionId: (...args: unknown[]) => h.mockRemoveJSessionId(...args),
  },
}));

vi.mock('../../../../utils/storage', () => ({
  storage: {
    setAuthToken: (...args: unknown[]) => h.mockSetAuthToken(...args),
    setUser: (...args: unknown[]) => h.mockSetUser(...args),
    clearAuthToken: (...args: unknown[]) => h.mockClearAuthToken(...args),
    clearUser: (...args: unknown[]) => h.mockClearUser(...args),
    setBasicAuthHeader: (...args: unknown[]) => h.mockSetBasicAuthHeader(...args),
    clearBasicAuthHeader: (...args: unknown[]) => h.mockClearBasicAuthHeader(...args),
  },
}));

vi.mock('react-router-dom', async importActual => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => h.mockNavigate,
  };
});

// Polyfill btoa for Node if missing
if (typeof globalThis.btoa === 'undefined') {
  (globalThis as any).btoa = (str: string) =>
    Buffer.from(str, 'binary').toString('base64');
}

import { useLogin } from '../../../../modules/auth/login/login.hooks';

// Destructure hoisted mocks for convenience
const {
  mockOpenMRSLogin,
  mockOpenMRSLogout,
  mockBackendLogin,
  mockShowToast,
  mockSetCookie,
  mockRemoveJSessionId: _mockRemoveJSessionId,
  mockSetAuthToken,
  mockSetUser,
  mockClearAuthToken: _mockClearAuthToken,
  mockClearUser: _mockClearUser,
  mockNavigate,
} = h;

const TestComponent: React.FC<{ username: string; password: string }> = ({
  username,
  password,
}) => {
  const { handleLogin, loading } = useLogin();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <button
        type="button"
        data-testid="login-btn"
        onClick={() => handleLogin({ username, password })}
      >
        Trigger Login
      </button>
    </div>
  );
};

describe('OpenMRS Logout', () => {
  const axiosConfig = {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call openMRSLogout with axiosConfig', async () => {
    // Arrange
    mockOpenMRSLogout.mockResolvedValueOnce(undefined);

    // Act
    await mockOpenMRSLogout(axiosConfig);

    // Assert
    expect(mockOpenMRSLogout).toHaveBeenCalledTimes(1);
    expect(mockOpenMRSLogout).toHaveBeenCalledWith(axiosConfig);
  });
});

describe('useLogin hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('success flow: sets cookie, saves token and user, shows success toast, and navigates', async () => {
    const openmrsUser = {
      uuid: 'u-1',
      display: 'Test User',
      roles: [{ display: NURSE_ROLE }],
    } as unknown as Record<string, unknown>;

    mockOpenMRSLogin.mockResolvedValue({
      user: openmrsUser,
      sessionId: 'sess-123',
      authenticated: true,
    });
    mockBackendLogin.mockResolvedValue({ token: 'jwt-123', user: openmrsUser });

    render(
      <MemoryRouter>
        <TestComponent username="john" password="secret" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(mockOpenMRSLogin).toHaveBeenCalledTimes(1);
      expect(mockBackendLogin).toHaveBeenCalledTimes(1);
      expect(mockSetCookie).toHaveBeenCalledWith('JSESSIONID', 'sess-123');
      expect(mockSetAuthToken).toHaveBeenCalledWith('jwt-123');
      expect(mockSetUser).toHaveBeenCalledWith(JSON.stringify(openmrsUser));
      expect(mockShowToast).toHaveBeenCalledWith(
        'Login Successful',
        'Welcome back',
        'success'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    // Assert the Authorization header was set correctly
    const firstArg = mockOpenMRSLogin.mock.calls[0][0];
    expect(firstArg).toBeDefined();
    expect(firstArg.headers.Authorization).toBe(`Basic ${btoa('john:secret')}`);
  });

  it('fails when OpenMRS is not authenticated and shows default error toast, resets loading', async () => {
    mockOpenMRSLogin.mockResolvedValue({
      authenticated: false,
      sessionId: 'x',
      user: {},
    });

    render(
      <MemoryRouter>
        <TestComponent username="john" password="bad" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Login Failed',
        'Login Failed',
        'error'
      );
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockSetCookie).not.toHaveBeenCalled();
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('fails when user does not have required role and does not call backend login', async () => {
  const openmrsUser = {
    uuid: 'u-3',
    roles: [{ display: DOCTOR_ROLE }, { display: SYSTEM_ADMIN_ROLE }],
  } as unknown as Record<string, unknown>;

  mockOpenMRSLogin.mockResolvedValue({
    user: openmrsUser,
    sessionId: 'sess-role',
    authenticated: true,
  });

  render(
    <MemoryRouter>
      <TestComponent username="john" password="secret" />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByTestId('login-btn'));

  await waitFor(() => {
    expect(mockShowToast).toHaveBeenCalledWith(
      'Login Failed',
      'User does not have required roles to login',
      'error'
    );
    expect(mockBackendLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  expect(screen.getByTestId('loading').textContent).toBe('false');
});

  it('fails on backend login with axios-style error message and shows that message', async () => {
    const openmrsUser = { uuid: 'u-2',  roles: [{ display: NURSE_ROLE }], } as unknown as Record<string, unknown>;
    mockOpenMRSLogin.mockResolvedValue({
      user: openmrsUser,
      sessionId: 'sess-xyz',
      authenticated: true,
    });

    mockBackendLogin.mockRejectedValue({
      response: { data: { message: 'Bad credentials' } },
    });

    render(
      <MemoryRouter>
        <TestComponent username="john" password="wrong" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      // Cookie should be set before backend failure
      expect(mockSetCookie).toHaveBeenCalledWith('JSESSIONID', 'sess-xyz');
      expect(mockShowToast).toHaveBeenCalledWith(
        'Login Failed',
        'Bad credentials',
        'error'
      );
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockSetAuthToken).not.toHaveBeenCalled();
      expect(mockSetUser).not.toHaveBeenCalled();
    });
  });

  it('builds the Basic Authorization header using base64 encoding of username:password', async () => {
    mockOpenMRSLogin.mockResolvedValue({
      user: {},
      sessionId: 'sess-h',
      authenticated: true,
    });
    mockBackendLogin.mockResolvedValue({ token: 'jwt-h', user: {} });

    render(
      <MemoryRouter>
        <TestComponent username="alice" password="pa55" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(mockOpenMRSLogin).toHaveBeenCalled();
    });

    const config = mockOpenMRSLogin.mock.calls[0][0];
    expect(config.headers.Authorization).toBe(`Basic ${btoa('alice:pa55')}`);
  });

  it('throws and shows error toast when backend login returns empty token (!token branch)', async () => {
    const openmrsUser = {
      uuid: 'u-no-token',
      display: 'No Token User',
      roles: [{ display: NURSE_ROLE }],
    } as unknown as Record<string, unknown>;

    mockOpenMRSLogin.mockResolvedValue({
      user: openmrsUser,
      sessionId: 'sess-no-token',
      authenticated: true,
    });
    // Backend login returns falsy token (empty string)
    mockBackendLogin.mockResolvedValue({ token: '', user: openmrsUser });

    render(
      <MemoryRouter>
        <TestComponent username="john" password="secret" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      // The !token branch throws, which lands in the catch block
      expect(mockShowToast).toHaveBeenCalledWith(
        'Login Failed',
        'Login Failed',
        'error'
      );
      // Should NOT have stored token or navigated
      expect(mockSetAuthToken).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('toggles loading true on start and false on error', async () => {
    // Reject early to enter catch
    mockOpenMRSLogin.mockRejectedValue(new Error('network'));

    render(
      <MemoryRouter>
        <TestComponent username="sarah" password="oops" />
      </MemoryRouter>
    );

    // Start login
    fireEvent.click(screen.getByTestId('login-btn'));

    // Eventually shows error toast and loading becomes false
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Login Failed',
        'Login Failed',
        'error'
      );
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });
});
