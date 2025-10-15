import type { Patient, PatientState } from '../types/patient.types';

// Patient actions
export type PatientAction =
  | { type: 'ADD_PATIENT'; payload: Patient }
  | {
      type: 'UPDATE_PATIENT';
      payload: { id: string; updates: Partial<Patient> };
    }
  | { type: 'DELETE_PATIENT'; payload: string }
  | { type: 'SET_CURRENT_PATIENT'; payload: Patient | null }
  | { type: 'SET_PATIENTS'; payload: Patient[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOTAL_COUNT'; payload: number };

// Initial state
const initialState: PatientState = {
  patients: [],
  currentPatient: null,
  loading: false,
  error: null,
  totalCount: 0,
};

// Patient reducer
export const patientReducer = (
  state: PatientState = initialState,
  action: PatientAction
): PatientState => {
  switch (action.type) {
    case 'ADD_PATIENT':
      return {
        ...state,
        patients: [...state.patients, action.payload],
        totalCount: state.totalCount + 1,
      };

    case 'UPDATE_PATIENT':
      return {
        ...state,
        patients: state.patients.map(patient =>
          patient.id === action.payload.id
            ? { ...patient, ...action.payload.updates }
            : patient
        ),
        currentPatient:
          state.currentPatient?.id === action.payload.id
            ? { ...state.currentPatient, ...action.payload.updates }
            : state.currentPatient,
      };

    case 'DELETE_PATIENT':
      return {
        ...state,
        patients: state.patients.filter(
          patient => patient.id !== action.payload
        ),
        currentPatient:
          state.currentPatient?.id === action.payload
            ? null
            : state.currentPatient,
        totalCount: Math.max(0, state.totalCount - 1),
      };

    case 'SET_CURRENT_PATIENT':
      return {
        ...state,
        currentPatient: action.payload,
      };

    case 'SET_PATIENTS':
      return {
        ...state,
        patients: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_TOTAL_COUNT':
      return {
        ...state,
        totalCount: action.payload,
      };

    default:
      return state;
  }
};

export default patientReducer;
