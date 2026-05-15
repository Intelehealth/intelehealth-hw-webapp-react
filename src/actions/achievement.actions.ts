import type { Dispatch } from 'redux';
import { achievementService } from '../modules/achievement-ui/achievement.service';
import {
  fetchAchievementStart,
  fetchAchievementSuccess,
  fetchAchievementFailure,
} from '../reducers/achievement.reducer';
import { startLoading, stopLoading } from '../reducers/loader.reducer';
import type { RootState } from '../reducers';

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
