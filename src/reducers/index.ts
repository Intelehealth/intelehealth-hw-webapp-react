import { combineReducers } from 'redux';
import { authReducer } from './auth.reducer';
import loaderReducer from './loader.reducer';

export const rootReducer = combineReducers({
  auth: authReducer,
  loader: loaderReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
