import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

// Mock NotificationManager to avoid FCM initialization issues
vi.mock('./components/notifications/notification-manager.component', () => ({
  default: () => null,
}));

describe('App component', () => {
  it('renders the app header', () => {
    render(<App />);
    expect(screen.getByText('Vite + React')).toBeInTheDocument();
  });

  it('renders the counter button', () => {
    render(<App />);
    expect(screen.getByText(/count is/i)).toBeInTheDocument();
  });
});
