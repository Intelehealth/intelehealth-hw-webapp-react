import { legacy_createStore as createStore } from 'redux';
import { rootReducer } from '../reducers';

export const store = createStore(rootReducer);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof rootReducer>;
