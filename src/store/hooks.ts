import { useDispatch } from 'react-redux';
import type { AppDispatch } from './store';

// Typed dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();
