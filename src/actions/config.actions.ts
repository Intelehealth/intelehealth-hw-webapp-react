import type { Dispatch } from 'redux';
import { configService } from '../services/config.service';
import {
  fetchConfigSuccess,
  fetchConfigFailure,
} from '../reducers/config.reducer';

/**
 * Async thunk action to fetch configuration from API
 * Called on every page refresh in App.tsx
 */
export const fetchConfig = () => {
  return async (dispatch: Dispatch) => {
    try {
      const config = await configService.getPublishedConfig();
      dispatch(fetchConfigSuccess(config));
      return config;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch configuration';
      dispatch(fetchConfigFailure(errorMessage));
      throw error;
    }
  };
};

export { clearConfigError, resetConfig } from '../reducers/config.reducer';
