import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

// Hoisted spies to capture render calls from createRoot
const h = vi.hoisted(() => ({
  renderSpy: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: h.renderSpy,
  })),
}));

// Mock App component
const MockedApp: React.FC = () => <div data-testid="app">Mocked App</div>;
vi.mock('./App', () => ({
  default: MockedApp,
}));

// Mock SentryWrapper component
const MockedSentry: React.FC = () => (
  <div data-testid="sentry-wrapper">Mocked Sentry</div>
);
vi.mock('./config/sentry-wrapper', () => ({
  default: MockedSentry,
}));

// Utility to import main fresh each test
const importMain = async () => {
  await vi.resetModules();
  return import('./main');
};

describe('main.tsx', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    h.renderSpy.mockReset();
    // Ensure env defaults to non-PROD unless test overrides
    vi.unstubAllEnvs();
    vi.stubEnv('PROD', false);
  });

  afterEach(() => {
    cleanup();
  });

  it('calls createRoot.render with the React tree and renders App (non-PROD)', async () => {
    await importMain();

    // Ensure render was called exactly once with a React element
    expect(h.renderSpy).toHaveBeenCalledTimes(1);
    const tree = h.renderSpy.mock.calls[0][0] as React.ReactElement;
    expect(tree).toBeTruthy();

    // Render the captured tree and assert App is present
    render(tree);
    expect(screen.getByTestId('app')).toBeInTheDocument();
    // In non-PROD, Sentry should not render
    expect(screen.queryByTestId('sentry-wrapper')).toBeNull();
  });

  it('renders SentryWrapper only when import.meta.env.PROD is true', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('PROD', true);

    await importMain();

    expect(h.renderSpy).toHaveBeenCalledTimes(1);
    const tree = h.renderSpy.mock.calls[0][0] as React.ReactElement;

    // Render the captured tree and assert both App and Sentry exist
    render(tree);
    expect(screen.getByTestId('app')).toBeInTheDocument();
    expect(screen.getByTestId('sentry-wrapper')).toBeInTheDocument();
  });

  it('uses the #root element as the container for createRoot', async () => {
    const rootEl = document.getElementById('root');
    await importMain();

    // The first argument passed to createRoot is the #root element
    const { createRoot } = await import('react-dom/client');
    expect((createRoot as Mock).mock.calls[0][0]).toStrictEqual(rootEl);
  });
});
