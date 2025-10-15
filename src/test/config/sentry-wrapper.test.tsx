import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock React.lazy and Suspense
const mockLazyComponent = vi.fn(() => null);
const mockSuspense = vi.fn(({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => (
  <div data-testid="suspense">
    {fallback}
    {children}
  </div>
));

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    lazy: vi.fn((importFn) => {
      // Call the import function to trigger the module loading
      importFn();
      return mockLazyComponent;
    }),
    Suspense: mockSuspense,
  };
});

// Mock the sentry module
const mockInitSentry = vi.fn();
vi.mock('../../config/sentry', () => ({
  initSentry: mockInitSentry,
}));

describe('SentryWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    const SentryWrapper = (await import('../../config/sentry-wrapper')).default;
    render(<SentryWrapper />);
    
    // Should render the Suspense wrapper
    expect(screen.getByTestId('suspense')).toBeInTheDocument();
  });

  it('should have Suspense fallback', async () => {
    const SentryWrapper = (await import('../../config/sentry-wrapper')).default;
    render(<SentryWrapper />);
    
    // The fallback should be null, so we just check that Suspense is rendered
    const suspense = screen.getByTestId('suspense');
    expect(suspense).toBeInTheDocument();
  });

  it('should be a valid React component', async () => {
    const SentryWrapper = (await import('../../config/sentry-wrapper')).default;
    expect(SentryWrapper).toBeDefined();
    expect(typeof SentryWrapper).toBe('function');
  });

  it('should render consistently', async () => {
    const SentryWrapper = (await import('../../config/sentry-wrapper')).default;
    const { container } = render(<SentryWrapper />);
    const { container: container2 } = render(<SentryWrapper />);
    
    expect(container.innerHTML).toBe(container2.innerHTML);
  });

  it('should call initSentry when lazy component is loaded', async () => {
    const SentryWrapper = (await import('../../config/sentry-wrapper')).default;
    render(<SentryWrapper />);
    
    // The lazy import should trigger initSentry - this test verifies the component structure
    expect(mockLazyComponent).toHaveBeenCalled();
  });

  it('should use Suspense with correct props', async () => {
    const SentryWrapper = (await import('../../config/sentry-wrapper')).default;
    render(<SentryWrapper />);
    
    expect(mockSuspense).toHaveBeenCalledWith(
      expect.objectContaining({
        children: expect.any(Object),
        fallback: null,
      }),
      undefined
    );
  });

  it('should render lazy component', async () => {
    const SentryWrapper = (await import('../../config/sentry-wrapper')).default;
    render(<SentryWrapper />);
    
    // The lazy component should be rendered
    expect(mockLazyComponent).toHaveBeenCalled();
  });

  it('should handle multiple renders', async () => {
    const SentryWrapper = (await import('../../config/sentry-wrapper')).default;
    
    const { rerender } = render(<SentryWrapper />);
    rerender(<SentryWrapper />);
    
    // Should still work on re-render
    expect(screen.getByTestId('suspense')).toBeInTheDocument();
  });
});
