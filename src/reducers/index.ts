import { combineReducers } from 'redux';
import { authReducer } from './auth.reducer';
import { patientReducer } from './patient.reducer';

export const rootReducer = combineReducers({
  auth: authReducer,
  patient: patientReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Export individual reducers
export { authReducer, patientReducer };
