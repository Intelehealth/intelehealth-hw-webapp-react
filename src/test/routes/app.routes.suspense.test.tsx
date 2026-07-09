import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  window.location.hash = '#/join/magic-token';
});

vi.mock('../../utils/storage', () => ({
  storage: {
    getAuthToken: vi.fn(() => 'mock-token'),
    getUser: vi.fn(() => null),
    getBasicAuthHeader: vi.fn(() => ''),
    getLocationUuid: vi.fn(() => null),
  },
}));

vi.mock('../../pages/join-call/join-call.page', () => ({
  default: () => <div data-testid="join-call-page">Join Call Page</div>,
}));

import AppRoutes from '../../routes/app.routes';
import { authReducer } from '../../reducers/auth.reducer';
import loaderReducer from '../../reducers/loader.reducer';
import patientReducer from '../../reducers/patient.reducer';

describe('AppRoutes suspense fallback', () => {
  it('renders the route loader fallback while a lazy route resolves', async () => {
    const store = configureStore({
      reducer: {
        auth: authReducer as any,
        loader: loaderReducer,
        patient: patientReducer as any,
      },
    });

    const { findByTestId } = render(
      <Provider store={store}>
        <AppRoutes />
      </Provider>
    );

    expect(await findByTestId('join-call-page')).toBeInTheDocument();
  });
});
