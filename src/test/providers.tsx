import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';

// Add any providers here if needed
export const AllTheProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <Provider store={store}>{children}</Provider>;
};
