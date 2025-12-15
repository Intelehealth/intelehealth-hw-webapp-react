import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks to avoid Vitest hoisting issues
const h = vi.hoisted(() => ({
  mockOpenMRSLogin: vi.fn(),
  mockBackendLogin: vi.fn(),
  mockShowToast: vi.fn(),
  mockSetCookie: vi.fn(),
  mockRemoveJSessionId: vi.fn(),
  mockSetAuthToken: vi.fn(),
  mockSetUser: vi.fn(),
  mockClearAuthToken: vi.fn(),
  mockClearUser: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../../../modules/auth/login/login.service', () => {
  return {
    loginService: {
      login: h.mockBackendLogin,
      openMRSLogin: h.mockOpenMRSLogin,
    },
    default: {
      login: h.mockBackendLogin,
      openMRSLogin: h.mockOpenMRSLogin,
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

describe('useLogin hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('success flow: sets cookie, saves token and user, shows success toast, and navigates', async () => {
    const openmrsUser = {
      uuid: 'u-1',
      display: 'Test User',
      roles: [{ display: 'Organizational: Nurse' }],
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
    roles: [{ display: 'Organizational: Doctor' }, { display: 'Organizational: System Administrator' }],
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
    const openmrsUser = { uuid: 'u-2',  roles: [{ display: 'Organizational: Nurse' }], } as unknown as Record<string, unknown>;
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
