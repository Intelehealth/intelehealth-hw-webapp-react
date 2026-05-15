import type { Dispatch } from 'redux';
import { achievementService } from '../modules/achievement-ui/achievement.service';
import {
  fetchAchievementStart,
  fetchAchievementSuccess,
  fetchAchievementFailure,
} from '../reducers/achievement.reducer';
import { startLoading, stopLoading } from '../reducers/loader.reducer';
import type { RootState } from '../reducers';

/**
 * Fetch raw achievement data once.
 * Skips fetch if data is already in the store.
 */
export const fetchAchievementData = (locationUuid: string) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const { achievement } = getState();
    if (achievement.rawData || achievement.loading) return;

    dispatch(fetchAchievementStart());
    dispatch(startLoading());
    try {
      const result = await achievementService.fetchRawData(locationUuid);
      dispatch(fetchAchievementSuccess(result));
    } catch {
      dispatch(fetchAchievementFailure('Failed to fetch achievements'));
    } finally {
      dispatch(stopLoading());
    }
  };
};

/**
 * Force re-fetch achievement data (e.g. after adding a patient).
 * Clears the cache and fetches fresh data from the API.
 */
export const refreshAchievementData = (locationUuid: string) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const { achievement } = getState();
    if (achievement.loading) return;

    dispatch(fetchAchievementStart());
    dispatch(startLoading());
    try {
      const result = await achievementService.fetchRawData(locationUuid);
      dispatch(fetchAchievementSuccess(result));
    } catch {
      dispatch(fetchAchievementFailure('Failed to fetch achievements'));
    } finally {
      dispatch(stopLoading());
    }
  };
};

export { resetAchievement } from '../reducers/achievement.reducer';
