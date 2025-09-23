import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RootState } from '../../../reducers';
import { rootReducer } from '../../../reducers';
import LoginComponent from './login.component';

// Mock the login hooks
const mockHandleLogin = vi.fn();
vi.mock('./login.hooks', () => ({
  useLogin: () => ({
    handleLogin: mockHandleLogin,
  }),
}));

const createTestStore = (initialState?: Partial<RootState>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createStore(rootReducer, initialState as any);
};

describe('LoginComponent', () => {
  beforeEach(() => {
    mockHandleLogin.mockClear();
  });

  it('renders login form elements', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <LoginComponent />
      </Provider>
    );

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('updates email input value', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <LoginComponent />
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('updates password input value', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <LoginComponent />
      </Provider>
    );

    const passwordInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput).toHaveValue('password123');
  });

  it('calls handleLogin when form is submitted', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <LoginComponent />
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandleLogin).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });

  it('shows loading state when loading is true', () => {
    const store = createTestStore({
      auth: {
        loading: true,
        error: null,
        isAuthenticated: false,
        user: null,
        token: null,
      },
    });

    render(
      <Provider store={store}>
        <LoginComponent />
      </Provider>
    );

    expect(
      screen.getByRole('button', { name: /logging in/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows error message when error exists', () => {
    const store = createTestStore({
      auth: {
        loading: false,
        error: 'Invalid credentials',
        isAuthenticated: false,
        user: null,
        token: null,
      },
    });

    render(
      <Provider store={store}>
        <LoginComponent />
      </Provider>
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.getByText('Invalid credentials')).toHaveStyle({
      color: 'rgb(255, 0, 0)',
    });
  });

  it('shows success message when authenticated', () => {
    const store = createTestStore({
      auth: {
        loading: false,
        error: null,
        isAuthenticated: true,
        user: {
          id: 'user-uuid-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'health_worker',
          username: 'testuser',
          uuid: 'user-uuid-123',
          person: {
            uuid: 'person-uuid-123',
            display: 'Test User',
          },
        },
        token: 'mock-token',
      },
    });

    render(
      <Provider store={store}>
        <LoginComponent />
      </Provider>
    );

    expect(screen.getByText('✅ Logged in')).toBeInTheDocument();
    expect(screen.getByText('✅ Logged in')).toHaveStyle({
      color: 'rgb(0, 128, 0)',
    });
  });

  it('prevents form submission when loading', () => {
    const store = createTestStore({
      auth: {
        loading: true,
        error: null,
        isAuthenticated: false,
        user: null,
        token: null,
      },
    });

    render(
      <Provider store={store}>
        <LoginComponent />
      </Provider>
    );

    const submitButton = screen.getByRole('button', { name: /logging in/i });
    expect(submitButton).toBeDisabled();
  });
});
