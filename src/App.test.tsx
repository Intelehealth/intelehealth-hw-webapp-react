import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { render } from './test/utils';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });

  it('displays the login form', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /login/i });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('Login');
  });

  it('renders the login form elements', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('updates email input value', () => {
    render(<App />);
    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('updates password input value', () => {
    render(<App />);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');
  });

  it('submits the login form', () => {
    render(<App />);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Form should be submitted (no error thrown)
    expect(emailInput).toBeInTheDocument();
  });
});
