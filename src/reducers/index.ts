import { combineReducers } from 'redux';
import { authReducer } from './auth.reducer';
import { patientReducer } from './patient.reducer';
import { loaderReducer } from './loader.reducer';

export const rootReducer = combineReducers({
  auth: authReducer,
  patient: patientReducer,
  loader: loaderReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
