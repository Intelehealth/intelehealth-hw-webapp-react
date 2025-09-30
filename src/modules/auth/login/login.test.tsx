import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginComponent from './login.component';

// Mock the useLogin hook
vi.mock('./login.hooks', () => ({
  useLogin: () => ({
    handleLogin: vi.fn(() => Promise.resolve()),
  }),
}));

// Mock useNavigate from react-router-dom
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('LoginComponent', () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
  });

  it('renders login form inputs and button', () => {
    render(
      <BrowserRouter>
        <LoginComponent />
      </BrowserRouter>
    );

    expect(
      screen.getByPlaceholderText(/Enter your username/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your password/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    render(
      <BrowserRouter>
        <LoginComponent />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for any errors to appear
    await waitFor(() => {
      // Get all <p> elements (your errors are inside <p> tags)
      const errorMessages = screen.getAllByText((_content, element) => {
        return element?.tagName.toLowerCase() === 'p';
      });
      console.log(
        'Validation errors:',
        errorMessages.map(e => e.textContent)
      );
    });
  });

  it('toggles password visibility when eye button is clicked', () => {
    render(
      <BrowserRouter>
        <LoginComponent />
      </BrowserRouter>
    );

    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const toggleButton = screen.getByLabelText(/Show password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/Hide password/i)).toBeInTheDocument();
  });
});
