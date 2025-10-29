import * as Sentry from '@sentry/react';
import type { ReactNode } from 'react';
import React, { Component, lazy, Suspense } from 'react';

class SentryErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture to Sentry if available
    try {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    } catch {
      // Sentry not initialized, ignore
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Something went wrong.</h2>
            <p>We've been notified of this error and are working to fix it.</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Lazy-loaded Sentry Initializer with better error handling
const SentryInitializer = lazy(() =>
  import('./sentry').then(module => ({
    default: () => {
      try {
        module.initSentry();
      } catch {
        // Don't throw here to prevent breaking the app
      }
      return null;
    },
  }))
);

// Sentry Wrapper with Error Boundary
const SentryWrapper: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <SentryErrorBoundary>
    <Suspense fallback={null}>
      <SentryInitializer />
    </Suspense>
    {children}
  </SentryErrorBoundary>
);

export default SentryWrapper;
export { SentryErrorBoundary };
