import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppConfig, ConfigState } from '../types/config.types';

const initialState: ConfigState = {
  data: null,
  error: null,
  lastFetched: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    fetchConfigSuccess: (state, action: PayloadAction<AppConfig>) => {
      state.data = action.payload;
      state.error = null;
      state.lastFetched = Date.now();
    },
    fetchConfigFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearConfigError: state => {
      state.error = null;
    },
    resetConfig: () => initialState,
  },
});

export const configReducer = configSlice.reducer;
export const {
  fetchConfigSuccess,
  fetchConfigFailure,
  clearConfigError,
  resetConfig,
} = configSlice.actions;
export default configSlice.reducer;
