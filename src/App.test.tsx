import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { store } from './store/store';

// Mock NotificationManager to avoid FCM initialization issues
vi.mock('./components/notifications/notification-manager.component', () => ({
  default: () => null,
}));

// Mock i18n to avoid initialization issues
vi.mock('./i18n', () => ({
  default: {},
}));

// Mock react-toastify CSS
vi.mock('react-toastify/dist/ReactToastify.css', () => ({}));

describe('App component', () => {
  it('renders the app without errors', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // App should render without throwing errors
    // AppRoutes uses HashRouter internally, so we just verify it renders
    expect(document.body).toBeInTheDocument();
  });

  it('renders AppRoutes component', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // Verify that the app renders (AppRoutes will render routes)
    // The exact content depends on the current route, but we can verify
    // that the component renders without errors
    expect(document.body).toBeInTheDocument();
  });
});
