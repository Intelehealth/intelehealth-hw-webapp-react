import { useSelector } from 'react-redux';
import type { RootState } from '../reducers';
import type { AppConfig } from '../types/config.types';

/**
 * Custom hook to access configuration from Redux store
 * @returns config data, error, and lastFetched timestamp
 */
export const useConfig = () => {
  const { data, error, lastFetched } = useSelector(
    (state: RootState) => state.config
  );

  return {
    config: data as AppConfig | null,
    error,
    lastFetched,
  };
};
