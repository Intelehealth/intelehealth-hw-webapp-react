import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PullRawData, LocalPatient } from '../types/achievement.types';

interface AchievementState {
  rawData: PullRawData | null;
  loading: boolean;
  error: string | null;
  /** Patients created locally before middleware syncs. */
  localPatients: LocalPatient[];
}

const initialState: AchievementState = {
  rawData: null,
  loading: false,
  error: null,
  localPatients: [],
};

const achievementSlice = createSlice({
  name: 'achievement',
  initialState,
  reducers: {
    fetchAchievementStart: state => {
      state.loading = true;
      state.error = null;
    },
    fetchAchievementSuccess: (state, action: PayloadAction<PullRawData>) => {
      state.rawData = action.payload;
      state.loading = false;
      state.error = null;
      // Remove local patients that now exist in pulldata
      const pulledUuids = new Set(
        action.payload.patientAttributesList.map(a => a.patientuuid)
      );
      state.localPatients = state.localPatients.filter(
        lp => !pulledUuids.has(lp.patientuuid)
      );
    },
    fetchAchievementFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addLocalPatient: (state, action: PayloadAction<LocalPatient>) => {
      // Avoid duplicates
      if (
        !state.localPatients.some(
          lp => lp.patientuuid === action.payload.patientuuid
        )
      ) {
        state.localPatients.push(action.payload);
      }
    },
    resetAchievement: () => initialState,
  },
});

export const achievementReducer = achievementSlice.reducer;
export const {
  fetchAchievementStart,
  fetchAchievementSuccess,
  fetchAchievementFailure,
  addLocalPatient,
  resetAchievement,
} = achievementSlice.actions;
