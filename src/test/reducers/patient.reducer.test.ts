import { describe, expect, it } from 'vitest';
import { patientReducer, type PatientAction } from '../../reducers/patient.reducer';
import type { Patient, PatientState } from '../../types/patient.types';

describe('patientReducer', () => {
  const mockPatient: Patient = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    gender: 'male',
    phone: '1234567890',
    address: '123 Main St',
  };

  const mockPatient2: Patient = {
    id: '2',
    name: 'Jane Doe',
    email: 'jane@example.com',
    age: 25,
    gender: 'female',
    phone: '0987654321',
    address: '456 Oak Ave',
  };

  const initialState: PatientState = {
    patients: [],
    currentPatient: null,
    loading: false,
    error: null,
    totalCount: 0,
  };

  it('should return initial state for unknown action', () => {
    const action = { type: 'UNKNOWN_ACTION' } as any;
    const result = patientReducer(initialState, action);
    expect(result).toEqual(initialState);
  });

  it('should handle ADD_PATIENT action', () => {
    const action: PatientAction = {
      type: 'ADD_PATIENT',
      payload: mockPatient,
    };
    const result = patientReducer(initialState, action);
    
    expect(result.patients).toHaveLength(1);
    expect(result.patients[0]).toEqual(mockPatient);
    expect(result.totalCount).toBe(1);
    expect(result.currentPatient).toBeNull();
  });

  it('should handle UPDATE_PATIENT action', () => {
    const stateWithPatient: PatientState = {
      ...initialState,
      patients: [mockPatient],
      currentPatient: mockPatient,
    };

    const action: PatientAction = {
      type: 'UPDATE_PATIENT',
      payload: {
        id: '1',
        updates: { name: 'John Updated', age: 31 },
      },
    };
    const result = patientReducer(stateWithPatient, action);
    
    expect(result.patients[0].name).toBe('John Updated');
    expect(result.patients[0].age).toBe(31);
    expect(result.patients[0].email).toBe('john@example.com'); // unchanged
    expect(result.currentPatient?.name).toBe('John Updated');
    expect(result.currentPatient?.age).toBe(31);
  });

  it('should handle UPDATE_PATIENT action when current patient is different', () => {
    const stateWithPatient: PatientState = {
      ...initialState,
      patients: [mockPatient, mockPatient2],
      currentPatient: mockPatient2,
    };

    const action: PatientAction = {
      type: 'UPDATE_PATIENT',
      payload: {
        id: '1',
        updates: { name: 'John Updated' },
      },
    };
    const result = patientReducer(stateWithPatient, action);
    
    expect(result.patients[0].name).toBe('John Updated');
    expect(result.currentPatient).toEqual(mockPatient2); // unchanged
  });

  it('should handle DELETE_PATIENT action', () => {
    const stateWithPatients: PatientState = {
      ...initialState,
      patients: [mockPatient, mockPatient2],
      currentPatient: mockPatient,
      totalCount: 2,
    };

    const action: PatientAction = {
      type: 'DELETE_PATIENT',
      payload: '1',
    };
    const result = patientReducer(stateWithPatients, action);
    
    expect(result.patients).toHaveLength(1);
    expect(result.patients[0]).toEqual(mockPatient2);
    expect(result.currentPatient).toBeNull();
    expect(result.totalCount).toBe(1);
  });

  it('should handle DELETE_PATIENT action when current patient is different', () => {
    const stateWithPatients: PatientState = {
      ...initialState,
      patients: [mockPatient, mockPatient2],
      currentPatient: mockPatient2,
      totalCount: 2,
    };

    const action: PatientAction = {
      type: 'DELETE_PATIENT',
      payload: '1',
    };
    const result = patientReducer(stateWithPatients, action);
    
    expect(result.patients).toHaveLength(1);
    expect(result.patients[0]).toEqual(mockPatient2);
    expect(result.currentPatient).toEqual(mockPatient2); // unchanged
    expect(result.totalCount).toBe(1);
  });

  it('should handle DELETE_PATIENT action and not go below 0 totalCount', () => {
    const stateWithPatient: PatientState = {
      ...initialState,
      patients: [mockPatient],
      totalCount: 1,
    };

    const action: PatientAction = {
      type: 'DELETE_PATIENT',
      payload: '1',
    };
    const result = patientReducer(stateWithPatient, action);
    
    expect(result.patients).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it('should handle SET_CURRENT_PATIENT action', () => {
    const action: PatientAction = {
      type: 'SET_CURRENT_PATIENT',
      payload: mockPatient,
    };
    const result = patientReducer(initialState, action);
    
    expect(result.currentPatient).toEqual(mockPatient);
  });

  it('should handle SET_CURRENT_PATIENT action with null', () => {
    const stateWithPatient: PatientState = {
      ...initialState,
      currentPatient: mockPatient,
    };

    const action: PatientAction = {
      type: 'SET_CURRENT_PATIENT',
      payload: null,
    };
    const result = patientReducer(stateWithPatient, action);
    
    expect(result.currentPatient).toBeNull();
  });

  it('should handle SET_PATIENTS action', () => {
    const patients = [mockPatient, mockPatient2];
    const action: PatientAction = {
      type: 'SET_PATIENTS',
      payload: patients,
    };
    const result = patientReducer(initialState, action);
    
    expect(result.patients).toEqual(patients);
  });

  it('should handle SET_LOADING action', () => {
    const action: PatientAction = {
      type: 'SET_LOADING',
      payload: true,
    };
    const result = patientReducer(initialState, action);
    
    expect(result.loading).toBe(true);
  });

  it('should handle SET_ERROR action', () => {
    const errorMessage = 'Something went wrong';
    const action: PatientAction = {
      type: 'SET_ERROR',
      payload: errorMessage,
    };
    const result = patientReducer(initialState, action);
    
    expect(result.error).toBe(errorMessage);
  });

  it('should handle SET_ERROR action with null', () => {
    const stateWithError: PatientState = {
      ...initialState,
      error: 'Previous error',
    };

    const action: PatientAction = {
      type: 'SET_ERROR',
      payload: null,
    };
    const result = patientReducer(stateWithError, action);
    
    expect(result.error).toBeNull();
  });

  it('should handle SET_TOTAL_COUNT action', () => {
    const action: PatientAction = {
      type: 'SET_TOTAL_COUNT',
      payload: 42,
    };
    const result = patientReducer(initialState, action);
    
    expect(result.totalCount).toBe(42);
  });

  it('should handle multiple actions in sequence', () => {
    let state = patientReducer(initialState, {
      type: 'ADD_PATIENT',
      payload: mockPatient,
    });

    state = patientReducer(state, {
      type: 'SET_CURRENT_PATIENT',
      payload: mockPatient,
    });

    state = patientReducer(state, {
      type: 'SET_LOADING',
      payload: true,
    });

    expect(state.patients).toHaveLength(1);
    expect(state.currentPatient).toEqual(mockPatient);
    expect(state.loading).toBe(true);
    expect(state.totalCount).toBe(1);
  });
});
