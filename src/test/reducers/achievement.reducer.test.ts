import { describe, expect, it } from 'vitest';
import {
  achievementReducer,
  fetchAchievementStart,
  fetchAchievementSuccess,
  fetchAchievementFailure,
  addLocalPatient,
  resetAchievement,
} from '../../reducers/achievement.reducer';
import type { PullRawData, LocalPatient } from '../../types/achievement.types';

const initialState = {
  rawData: null,
  loading: false,
  error: null,
  localPatients: [],
};

const mockRawData: PullRawData = {
  patientAttributesList: [
    { patientuuid: 'p1', person_attribute_type_uuid: 'attr-type-1', value: 'val1' },
    { patientuuid: 'p2', person_attribute_type_uuid: 'attr-type-2', value: 'val2' },
  ],
  encounterlist: [],
  obslist: [],
};

describe('achievementReducer', () => {
  describe('initial state', () => {
    it('should return the initial state for unknown action', () => {
      const state = achievementReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('fetchAchievementStart', () => {
    it('should set loading to true and clear error', () => {
      const prevState = { ...initialState, error: 'Previous error' };
      const state = achievementReducer(prevState, fetchAchievementStart());
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should preserve rawData and localPatients', () => {
      const prevState = {
        ...initialState,
        rawData: mockRawData,
        localPatients: [{ patientuuid: 'lp1', providerUuid: 'prov1', createdDate: '2026-01-01' }],
      };
      const state = achievementReducer(prevState, fetchAchievementStart());
      expect(state.rawData).toEqual(mockRawData);
      expect(state.localPatients).toHaveLength(1);
    });
  });

  describe('fetchAchievementSuccess', () => {
    it('should set rawData, clear loading and error', () => {
      const prevState = { ...initialState, loading: true, error: 'some error' };
      const state = achievementReducer(prevState, fetchAchievementSuccess(mockRawData));
      expect(state.rawData).toEqual(mockRawData);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should remove local patients that now exist in pulldata', () => {
      const prevState = {
        ...initialState,
        loading: true,
        localPatients: [
          { patientuuid: 'p1', providerUuid: 'prov1', createdDate: '2026-01-01' },
          { patientuuid: 'p-new', providerUuid: 'prov1', createdDate: '2026-01-02' },
        ],
      };
      const state = achievementReducer(prevState, fetchAchievementSuccess(mockRawData));
      // p1 is in pulldata so should be removed; p-new should remain
      expect(state.localPatients).toEqual([
        { patientuuid: 'p-new', providerUuid: 'prov1', createdDate: '2026-01-02' },
      ]);
    });

    it('should keep all local patients when none exist in pulldata', () => {
      const emptyRawData: PullRawData = {
        patientAttributesList: [],
        encounterlist: [],
        obslist: [],
      };
      const prevState = {
        ...initialState,
        loading: true,
        localPatients: [
          { patientuuid: 'lp1', providerUuid: 'prov1', createdDate: '2026-01-01' },
        ],
      };
      const state = achievementReducer(prevState, fetchAchievementSuccess(emptyRawData));
      expect(state.localPatients).toHaveLength(1);
    });
  });

  describe('fetchAchievementFailure', () => {
    it('should set error and clear loading', () => {
      const prevState = { ...initialState, loading: true };
      const state = achievementReducer(prevState, fetchAchievementFailure('Network error'));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });

    it('should preserve rawData', () => {
      const prevState = { ...initialState, loading: true, rawData: mockRawData };
      const state = achievementReducer(prevState, fetchAchievementFailure('error'));
      expect(state.rawData).toEqual(mockRawData);
    });
  });

  describe('addLocalPatient', () => {
    it('should add a local patient', () => {
      const patient: LocalPatient = {
        patientuuid: 'lp1',
        providerUuid: 'prov1',
        createdDate: '2026-05-15',
      };
      const state = achievementReducer(initialState, addLocalPatient(patient));
      expect(state.localPatients).toEqual([patient]);
    });

    it('should not add duplicate local patients', () => {
      const patient: LocalPatient = {
        patientuuid: 'lp1',
        providerUuid: 'prov1',
        createdDate: '2026-05-15',
      };
      const prevState = { ...initialState, localPatients: [patient] };
      const state = achievementReducer(prevState, addLocalPatient(patient));
      expect(state.localPatients).toHaveLength(1);
    });

    it('should add multiple different patients', () => {
      const p1: LocalPatient = { patientuuid: 'lp1', providerUuid: 'prov1', createdDate: '2026-05-15' };
      const p2: LocalPatient = { patientuuid: 'lp2', providerUuid: 'prov1', createdDate: '2026-05-15' };
      let state = achievementReducer(initialState, addLocalPatient(p1));
      state = achievementReducer(state, addLocalPatient(p2));
      expect(state.localPatients).toHaveLength(2);
    });
  });

  describe('resetAchievement', () => {
    it('should reset to initial state', () => {
      const prevState = {
        rawData: mockRawData,
        loading: true,
        error: 'some error',
        localPatients: [{ patientuuid: 'lp1', providerUuid: 'prov1', createdDate: '2026-01-01' }],
      };
      const state = achievementReducer(prevState, resetAchievement());
      expect(state).toEqual(initialState);
    });
  });

  describe('state transitions', () => {
    it('should handle complete fetch flow: start -> success', () => {
      let state = achievementReducer(initialState, fetchAchievementStart());
      expect(state.loading).toBe(true);

      state = achievementReducer(state, fetchAchievementSuccess(mockRawData));
      expect(state.loading).toBe(false);
      expect(state.rawData).toEqual(mockRawData);
      expect(state.error).toBeNull();
    });

    it('should handle fetch flow: start -> failure', () => {
      let state = achievementReducer(initialState, fetchAchievementStart());
      expect(state.loading).toBe(true);

      state = achievementReducer(state, fetchAchievementFailure('Failed'));
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed');
      expect(state.rawData).toBeNull();
    });

    it('should handle add local patient then fetch success clears it', () => {
      const patient: LocalPatient = { patientuuid: 'p1', providerUuid: 'prov1', createdDate: '2026-01-01' };
      let state = achievementReducer(initialState, addLocalPatient(patient));
      expect(state.localPatients).toHaveLength(1);

      state = achievementReducer(state, fetchAchievementStart());
      state = achievementReducer(state, fetchAchievementSuccess(mockRawData));
      // p1 exists in mockRawData.patientAttributesList, so local patient should be removed
      expect(state.localPatients).toHaveLength(0);
    });
  });
});
