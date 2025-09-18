import { lazy, Suspense } from 'react';

const SentryInitializer = lazy(() =>
  import('./sentry').then(module => ({
    default: () => {
      module.initSentry();
      return null;
    },
  }))
);

const SentryWrapper = () => (
  <Suspense fallback={null}>
    <SentryInitializer />
  </Suspense>
);

export default SentryWrapper;
