import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetchRawData = vi.fn();

vi.mock('../../modules/achievement-ui/achievement.service', () => ({
  achievementService: {
    fetchRawData: (...args: unknown[]) => mockFetchRawData(...args),
  },
}));

vi.mock('../../reducers/loader.reducer', () => ({
  startLoading: () => ({ type: 'loader/startLoading' }),
  stopLoading: () => ({ type: 'loader/stopLoading' }),
}));

import { fetchAchievementData, refreshAchievementData, resetAchievement } from '../../actions/achievement.actions';
import {
  fetchAchievementStart,
  fetchAchievementSuccess,
  fetchAchievementFailure,
} from '../../reducers/achievement.reducer';

const MOCK_LOCATION_UUID = 'location-uuid-123';

const mockRawData = {
  patientAttributesList: [],
  encounterlist: [],
  obslist: [],
};

describe('achievement.actions', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let getState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    dispatch = vi.fn();
    getState = vi.fn();
  });

  describe('fetchAchievementData', () => {
    it('should dispatch start, loading, success, and stopLoading on successful fetch', async () => {
      getState.mockReturnValue({
        achievement: { rawData: null, loading: false, error: null, localPatients: [] },
      });
      mockFetchRawData.mockResolvedValue(mockRawData);

      await fetchAchievementData(MOCK_LOCATION_UUID)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith(fetchAchievementStart());
      expect(dispatch).toHaveBeenCalledWith({ type: 'loader/startLoading' });
      expect(mockFetchRawData).toHaveBeenCalledWith(MOCK_LOCATION_UUID);
      expect(dispatch).toHaveBeenCalledWith(fetchAchievementSuccess(mockRawData));
      expect(dispatch).toHaveBeenCalledWith({ type: 'loader/stopLoading' });
    });

    it('should dispatch failure on fetch error', async () => {
      getState.mockReturnValue({
        achievement: { rawData: null, loading: false, error: null, localPatients: [] },
      });
      mockFetchRawData.mockRejectedValue(new Error('Network error'));

      await fetchAchievementData(MOCK_LOCATION_UUID)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith(fetchAchievementStart());
      expect(dispatch).toHaveBeenCalledWith(
        fetchAchievementFailure('Failed to fetch achievements')
      );
      expect(dispatch).toHaveBeenCalledWith({ type: 'loader/stopLoading' });
    });

    it('should skip fetch if rawData already exists', async () => {
      getState.mockReturnValue({
        achievement: { rawData: mockRawData, loading: false, error: null, localPatients: [] },
      });

      await fetchAchievementData(MOCK_LOCATION_UUID)(dispatch, getState);

      expect(dispatch).not.toHaveBeenCalled();
      expect(mockFetchRawData).not.toHaveBeenCalled();
    });

    it('should skip fetch if already loading', async () => {
      getState.mockReturnValue({
        achievement: { rawData: null, loading: true, error: null, localPatients: [] },
      });

      await fetchAchievementData(MOCK_LOCATION_UUID)(dispatch, getState);

      expect(dispatch).not.toHaveBeenCalled();
      expect(mockFetchRawData).not.toHaveBeenCalled();
    });

    it('should always call stopLoading in finally block', async () => {
      getState.mockReturnValue({
        achievement: { rawData: null, loading: false, error: null, localPatients: [] },
      });
      mockFetchRawData.mockRejectedValue(new Error('fail'));

      await fetchAchievementData(MOCK_LOCATION_UUID)(dispatch, getState);

      const stopLoadingCalls = dispatch.mock.calls.filter(
        (call: unknown[]) => (call[0] as { type: string }).type === 'loader/stopLoading'
      );
      expect(stopLoadingCalls).toHaveLength(1);
    });
  });

  describe('refreshAchievementData', () => {
    it('should dispatch start, loading, success, and stopLoading on successful refresh', async () => {
      getState.mockReturnValue({
        achievement: { rawData: mockRawData, loading: false, error: null, localPatients: [] },
      });
      mockFetchRawData.mockResolvedValue(mockRawData);

      await refreshAchievementData(MOCK_LOCATION_UUID)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith(fetchAchievementStart());
      expect(dispatch).toHaveBeenCalledWith({ type: 'loader/startLoading' });
      expect(mockFetchRawData).toHaveBeenCalledWith(MOCK_LOCATION_UUID);
      expect(dispatch).toHaveBeenCalledWith(fetchAchievementSuccess(mockRawData));
      expect(dispatch).toHaveBeenCalledWith({ type: 'loader/stopLoading' });
    });

    it('should fetch even when rawData already exists (unlike fetchAchievementData)', async () => {
      getState.mockReturnValue({
        achievement: { rawData: mockRawData, loading: false, error: null, localPatients: [] },
      });
      mockFetchRawData.mockResolvedValue(mockRawData);

      await refreshAchievementData(MOCK_LOCATION_UUID)(dispatch, getState);

      expect(mockFetchRawData).toHaveBeenCalledWith(MOCK_LOCATION_UUID);
    });

    it('should skip refresh if already loading', async () => {
      getState.mockReturnValue({
        achievement: { rawData: null, loading: true, error: null, localPatients: [] },
      });

      await refreshAchievementData(MOCK_LOCATION_UUID)(dispatch, getState);

      expect(dispatch).not.toHaveBeenCalled();
      expect(mockFetchRawData).not.toHaveBeenCalled();
    });

    it('should dispatch failure on refresh error', async () => {
      getState.mockReturnValue({
        achievement: { rawData: null, loading: false, error: null, localPatients: [] },
      });
      mockFetchRawData.mockRejectedValue(new Error('Server error'));

      await refreshAchievementData(MOCK_LOCATION_UUID)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith(
        fetchAchievementFailure('Failed to fetch achievements')
      );
      expect(dispatch).toHaveBeenCalledWith({ type: 'loader/stopLoading' });
    });
  });

  describe('resetAchievement', () => {
    it('should be re-exported from the reducer', () => {
      expect(typeof resetAchievement).toBe('function');
      const action = resetAchievement();
      expect(action.type).toBe('achievement/resetAchievement');
    });
  });
});
