import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import loaderReducer from '../reducers/loader.reducer';
import { Loader } from './loader';
import loaderInitialState from '../reducers/loader.reducer';

const makeStore = (
  preloaded?: Partial<{ loader: ReturnType<typeof loaderReducer> }>
) =>
  configureStore({
    reducer: {
      loader: (state = loaderInitialState, action) =>
        loaderReducer(state, action),
    },
    preloadedState: preloaded,
  });

describe('Loader component', () => {
  it('renders nothing for inline mode when no id or inactive section', () => {
    const store = makeStore({
      loader: { globalLoading: false, globalCount: 0, sections: {} },
    });

    const { container, rerender } = render(
      <Provider store={store}>
        <Loader mode="inline" />
      </Provider>
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <Provider store={store}>
        <Loader mode="inline" id="sec1" />
      </Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders inline spinner when the corresponding section is active', () => {
    const store = makeStore({
      loader: { globalLoading: false, globalCount: 0, sections: { btn: 1 } },
    });

    render(
      <Provider store={store}>
        <Loader mode="inline" id="btn" />
      </Provider>
    );

    expect(screen.getByTestId('loader-inline-btn')).toBeInTheDocument();
  });

  it('renders section overlay loader only when that section has count > 0', () => {
    const store = makeStore({
      loader: { globalLoading: false, globalCount: 0, sections: { area: 2 } },
    });

    render(
      <Provider store={store}>
        <Loader id="area" />
      </Provider>
    );

    expect(screen.getByTestId('loader-area')).toBeInTheDocument();
  });

  it('does not render section overlay when count is 0 or missing', () => {
    const store = makeStore({
      loader: { globalLoading: false, globalCount: 0, sections: {} },
    });

    const { container } = render(
      <Provider store={store}>
        <Loader id="x" />
      </Provider>
    );

    expect(container.querySelector('[data-test-id="loader-x"]')).toBeNull();
  });

  it('renders global loader only when globalCount > 0 and no sections are loading', () => {
    const storeGlobalOnly = makeStore({
      loader: { globalLoading: true, globalCount: 1, sections: {} },
    });

    const { rerender } = render(
      <Provider store={storeGlobalOnly}>
        <Loader />
      </Provider>
    );
    expect(document.querySelector('.global-loader')).toBeInTheDocument();

    // If any section is loading, global loader should not render
    const storeWithSection = makeStore({
      loader: { globalLoading: true, globalCount: 1, sections: { s1: 1 } },
    });
    rerender(
      <Provider store={storeWithSection}>
        <Loader />
      </Provider>
    );
    expect(document.querySelector('.global-loader')).toBeNull();

    // If globalCount is 0, global loader should not render
    const storeNone = makeStore({
      loader: { globalLoading: false, globalCount: 0, sections: {} },
    });
    rerender(
      <Provider store={storeNone}>
        <Loader />
      </Provider>
    );
    expect(document.querySelector('.global-loader')).toBeNull();
  });
});
