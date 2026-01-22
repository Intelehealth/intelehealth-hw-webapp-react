import { combineReducers } from 'redux';
import { authReducer } from './auth.reducer';
import { ayuReducer } from './ayu.reducer';
import { configReducer } from './config.reducer';
import loaderReducer from './loader.reducer';

export const rootReducer = combineReducers({
  auth: authReducer,
  loader: loaderReducer,
  config: configReducer,
  ayu: ayuReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
