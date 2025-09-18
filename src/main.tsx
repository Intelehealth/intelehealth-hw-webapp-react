import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.tsx';
import SentryWrapper from './config/sentry-wrapper.tsx';
import './index.css';
import { store } from './store/store.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      {import.meta.env.PROD && <SentryWrapper />}
      <App />
    </Provider>
  </StrictMode>
);
