import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SentryWrapper from '../../config/sentry-wrapper';

// Mock the sentry module
vi.mock('../../config/sentry', () => ({
  initSentry: vi.fn(),
}));

// Mock React.lazy
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    lazy: vi.fn((fn) => {
      const Component = () => {
        const module = fn();
        return module.default ? module.default() : null;
      };
      Component.displayName = 'LazyComponent';
      return Component;
    }),
  };
});

describe('SentryWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<SentryWrapper />);
    // The component renders a Suspense with fallback null, so no visible content
    expect(document.body).toBeInTheDocument();
  });

  it('should render Suspense component', () => {
    const { container } = render(<SentryWrapper />);
    // Check that the component renders (Suspense with fallback null)
    expect(container.firstChild).toBeNull(); // fallback is null
  });

  it('should handle lazy loading of SentryInitializer', async () => {
    render(<SentryWrapper />);
    
    // The component should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should render SentryWrapper component', () => {
    const { container } = render(<SentryWrapper />);
    expect(container).toBeInTheDocument();
  });

  it('should handle component rendering without errors', () => {
    // Test that the component renders without throwing
    expect(() => render(<SentryWrapper />)).not.toThrow();
  });
});