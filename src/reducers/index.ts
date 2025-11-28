import { combineReducers } from 'redux';
import { authReducer } from './auth.reducer';
import loaderReducer from './loader.reducer';
import { configReducer } from './config.reducer';

export const rootReducer = combineReducers({
  auth: authReducer,
  loader: loaderReducer,
  config: configReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
