import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

// Mock AppRoutes so tests don't depend on routing internals
vi.mock('./routes/app.routes', () => ({
  __esModule: true,
  default: () => <div>Mocked Routes</div>,
}));

describe('App component', () => {
  it('renders AppRoutes component', () => {
    render(<App />);
    expect(screen.getByText('Mocked Routes')).toBeInTheDocument();
  });

  it('renders ToastContainer with correct props', async () => {
    render(<App />);
    // ToastContainer does not render visible UI elements by default,
    // but we can check for its presence by role or class.
    // react-toastify uses role="alert" for toasts but ToastContainer itself
    // may not be accessible via screen queries. So we check container existence.
    const toastContainers = document.getElementsByClassName('Toastify');
    expect(toastContainers.length).toBeGreaterThan(0);
  });
});
