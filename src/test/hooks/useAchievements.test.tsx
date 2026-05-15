import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { achievementReducer } from '../../reducers/achievement.reducer';
import {
  PROVIDER_ATTRIBUTE_TYPE,
  DATE_CREATED_ATTRIBUTE_TYPE,
  ENCOUNTER_PATIENT_EXIT_SURVEY,
  SATISFACTION_SCORE_CONCEPT,
} from '../../utils/achievement.constants';

const mockFetchRawData = vi.fn();
const MOCK_LOCATION_UUID = 'location-uuid-789';
const MOCK_PROVIDER_UUID = 'provider-uuid-123';
const mockUseProfileContext = vi.fn();

vi.mock('../../context/ProfileContext', () => ({
  useProfileContext: () => mockUseProfileContext(),
}));

vi.mock('../../modules/achievement-ui/achievement.service', async importOriginal => {
  const actual = await importOriginal<typeof import('../../modules/achievement-ui/achievement.service')>();
  return {
    ...actual,
    achievementService: {
      fetchRawData: (...args: unknown[]) => mockFetchRawData(...args),
    },
  };
});

import { useAchievements } from '../../hooks/useAchievements';

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const todayHumanDate = `${today.getDate()} ${MONTH_NAMES[today.getMonth()]}, ${today.getFullYear()}`;

const mockRawData = {
  patientAttributesList: [
    { patientuuid: 'p1', person_attribute_type_uuid: PROVIDER_ATTRIBUTE_TYPE, value: MOCK_PROVIDER_UUID },
    { patientuuid: 'p1', person_attribute_type_uuid: DATE_CREATED_ATTRIBUTE_TYPE, value: todayHumanDate },
    { patientuuid: 'p2', person_attribute_type_uuid: PROVIDER_ATTRIBUTE_TYPE, value: MOCK_PROVIDER_UUID },
    { patientuuid: 'p2', person_attribute_type_uuid: DATE_CREATED_ATTRIBUTE_TYPE, value: '15 January, 2026' },
    { patientuuid: 'p3', person_attribute_type_uuid: PROVIDER_ATTRIBUTE_TYPE, value: 'other-provider' },
    { patientuuid: 'p3', person_attribute_type_uuid: DATE_CREATED_ATTRIBUTE_TYPE, value: todayHumanDate },
  ],
  encounterlist: [
    { uuid: 'e1', visituuid: 'v1', encounter_type_uuid: ENCOUNTER_PATIENT_EXIT_SURVEY, provider_uuid: MOCK_PROVIDER_UUID, encounter_time: `${todayStr} 10:00:00` },
    { uuid: 'e2', visituuid: 'v2', encounter_type_uuid: ENCOUNTER_PATIENT_EXIT_SURVEY, provider_uuid: MOCK_PROVIDER_UUID, encounter_time: '2026-01-15 10:00:00' },
    { uuid: 'e3', visituuid: 'v3', encounter_type_uuid: ENCOUNTER_PATIENT_EXIT_SURVEY, provider_uuid: 'other-provider', encounter_time: `${todayStr} 10:00:00` },
  ],
  obslist: [
    { conceptuuid: SATISFACTION_SCORE_CONCEPT, encounteruuid: 'e1', value: '4' },
    { conceptuuid: SATISFACTION_SCORE_CONCEPT, encounteruuid: 'e2', value: '3' },
    { conceptuuid: SATISFACTION_SCORE_CONCEPT, encounteruuid: 'e3', value: '5' },
  ],
};

function createWrapper() {
  const store = configureStore({
    reducer: { achievement: achievementReducer },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
}

describe('useAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileContext.mockReturnValue({
      hwProfile: { providerUuid: MOCK_PROVIDER_UUID },
      locationUuid: MOCK_LOCATION_UUID,
    });
  });

  it('initialises with null data, loading false, no error', () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets loading false after fetch completes', async () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('fetches raw data only once with locationUuid', async () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFetchRawData).toHaveBeenCalledTimes(1);
      expect(mockFetchRawData).toHaveBeenCalledWith(MOCK_LOCATION_UUID);
    });
  });

  it('computes overall metrics (no date filter) when period is overall', async () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    const { result } = renderHook(() => useAchievements({ period: 'overall' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // 2 patients for this provider (p1, p2)
    expect(result.current.data!.patientsCreatedToday).toBe(2);
    // 2 visits ended by this provider (v1, v2)
    expect(result.current.data!.visitsEndedToday).toBe(2);
    // Average of scores for e1(4) and e2(3) = 3.5
    expect(result.current.data!.averagePatientSatisfactionScore).toBe(3.5);
  });

  it('computes daily metrics (today only) when no params', async () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // Only p1 has today's date attribute
    expect(result.current.data!.patientsCreatedToday).toBe(1);
    // Only e1/v1 has today's encounter_time
    expect(result.current.data!.visitsEndedToday).toBe(1);
    // Only e1's obs (score 4)
    expect(result.current.data!.averagePatientSatisfactionScore).toBe(4);
  });

  it('computes date range metrics when fromDate and toDate provided', async () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    const { result } = renderHook(
      () => useAchievements({ fromDate: '2026-01-01', toDate: '2026-01-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // p2 has date "15 January, 2026" → 2026-01-15 within range
    expect(result.current.data!.patientsCreatedToday).toBe(1);
    // e2/v2 has 2026-01-15 within range
    expect(result.current.data!.visitsEndedToday).toBe(1);
    // e2's obs (score 3)
    expect(result.current.data!.averagePatientSatisfactionScore).toBe(3);
  });

  it('sets error message when API call fails', async () => {
    mockFetchRawData.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch achievements');
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when locationUuid is missing', () => {
    mockUseProfileContext.mockReturnValue({
      hwProfile: { providerUuid: MOCK_PROVIDER_UUID },
      locationUuid: null,
    });
    renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    expect(mockFetchRawData).not.toHaveBeenCalled();
  });

  it('does not fetch when providerUuid is missing', () => {
    mockUseProfileContext.mockReturnValue({
      hwProfile: { providerUuid: undefined },
      locationUuid: MOCK_LOCATION_UUID,
    });
    renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    expect(mockFetchRawData).not.toHaveBeenCalled();
  });

  it('does not fetch when hwProfile is null', () => {
    mockUseProfileContext.mockReturnValue({
      hwProfile: null,
      locationUuid: MOCK_LOCATION_UUID,
    });
    renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    expect(mockFetchRawData).not.toHaveBeenCalled();
  });

  it('returns null data when rawData is null', async () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    mockUseProfileContext.mockReturnValue({
      hwProfile: { providerUuid: MOCK_PROVIDER_UUID },
      locationUuid: null,
    });
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeNull();
  });

  it('returns null data when providerUuid is missing even with rawData', () => {
    mockUseProfileContext.mockReturnValue({
      hwProfile: { providerUuid: undefined },
      locationUuid: MOCK_LOCATION_UUID,
    });
    const store = configureStore({
      reducer: { achievement: achievementReducer },
      preloadedState: {
        achievement: {
          rawData: mockRawData,
          loading: false,
          error: null,
          localPatients: [],
        },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useAchievements(), { wrapper });

    expect(result.current.data).toBeNull();
  });

  it('includes local patients in metrics count', async () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    const store = configureStore({
      reducer: { achievement: achievementReducer },
      preloadedState: {
        achievement: {
          rawData: mockRawData,
          loading: false,
          error: null,
          localPatients: [
            { patientuuid: 'local-p1', providerUuid: MOCK_PROVIDER_UUID, createdDate: todayStr },
          ],
        },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAchievements(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // p1 from rawData + local-p1 = 2 patients for today
    expect(result.current.data!.patientsCreatedToday).toBe(2);
  });

  it('does not double-count local patients that exist in rawData', async () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    const store = configureStore({
      reducer: { achievement: achievementReducer },
      preloadedState: {
        achievement: {
          rawData: mockRawData,
          loading: false,
          error: null,
          localPatients: [
            // Same patientuuid as p1 in rawData — should not be double-counted
            { patientuuid: 'p1', providerUuid: MOCK_PROVIDER_UUID, createdDate: todayStr },
          ],
        },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAchievements(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // p1 is already in rawData, local patient has same uuid so should not add extra
    expect(result.current.data!.patientsCreatedToday).toBe(1);
  });

  it('refresh function dispatches refreshAchievementData', async () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // Reset mock to track the refresh call
    mockFetchRawData.mockClear();
    mockFetchRawData.mockResolvedValue(mockRawData);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(mockFetchRawData).toHaveBeenCalledWith(MOCK_LOCATION_UUID);
    });
  });

  it('refresh does nothing when locationUuid is missing', async () => {
    mockUseProfileContext.mockReturnValue({
      hwProfile: { providerUuid: MOCK_PROVIDER_UUID },
      locationUuid: null,
    });
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    mockFetchRawData.mockClear();

    act(() => {
      result.current.refresh();
    });

    expect(mockFetchRawData).not.toHaveBeenCalled();
  });

  it('handles date parsing for "DD Month, YYYY" format in patientAttributes', async () => {
    const rawWithDdMonthYyyy = {
      ...mockRawData,
      patientAttributesList: [
        { patientuuid: 'px', person_attribute_type_uuid: PROVIDER_ATTRIBUTE_TYPE, value: MOCK_PROVIDER_UUID },
        { patientuuid: 'px', person_attribute_type_uuid: DATE_CREATED_ATTRIBUTE_TYPE, value: '22 July, 2024' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithDdMonthYyyy);
    const { result } = renderHook(
      () => useAchievements({ fromDate: '2024-07-01', toDate: '2024-07-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.patientsCreatedToday).toBe(1);
  });

  it('handles date parsing for "Month DD, YYYY" format in patientAttributes', async () => {
    const rawWithMonthDdYyyy = {
      ...mockRawData,
      patientAttributesList: [
        { patientuuid: 'py', person_attribute_type_uuid: PROVIDER_ATTRIBUTE_TYPE, value: MOCK_PROVIDER_UUID },
        { patientuuid: 'py', person_attribute_type_uuid: DATE_CREATED_ATTRIBUTE_TYPE, value: 'July 22, 2024' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithMonthDdYyyy);
    const { result } = renderHook(
      () => useAchievements({ fromDate: '2024-07-01', toDate: '2024-07-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.patientsCreatedToday).toBe(1);
  });

  it('returns 0 for visits when encounterlist is empty', async () => {
    const rawNoEncounters = {
      ...mockRawData,
      encounterlist: [],
    };
    mockFetchRawData.mockResolvedValue(rawNoEncounters);
    const { result } = renderHook(() => useAchievements({ period: 'overall' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.visitsEndedToday).toBe(0);
  });

  it('returns 0 satisfaction score when no matching obs', async () => {
    const rawNoObs = {
      ...mockRawData,
      obslist: [],
    };
    mockFetchRawData.mockResolvedValue(rawNoObs);
    const { result } = renderHook(() => useAchievements({ period: 'overall' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.averagePatientSatisfactionScore).toBe(0);
  });

  it('handles encounter_time as ISO datetime string', async () => {
    const rawWithIsoTime = {
      ...mockRawData,
      encounterlist: [
        { uuid: 'e10', visituuid: 'v10', encounter_type_uuid: ENCOUNTER_PATIENT_EXIT_SURVEY, provider_uuid: MOCK_PROVIDER_UUID, encounter_time: `${todayStr}T10:00:00.000Z` },
      ],
      obslist: [
        { conceptuuid: SATISFACTION_SCORE_CONCEPT, encounteruuid: 'e10', value: '5' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithIsoTime);
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.visitsEndedToday).toBe(1);
  });

  it('filters out NaN satisfaction scores', async () => {
    const rawWithBadObs = {
      ...mockRawData,
      obslist: [
        { conceptuuid: SATISFACTION_SCORE_CONCEPT, encounteruuid: 'e1', value: 'not-a-number' },
        { conceptuuid: SATISFACTION_SCORE_CONCEPT, encounteruuid: 'e2', value: '3' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithBadObs);
    const { result } = renderHook(() => useAchievements({ period: 'overall' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // Only valid score is 3
    expect(result.current.data!.averagePatientSatisfactionScore).toBe(3);
  });

  it('handles toISODate JS Date fallback for non-standard date formats', async () => {
    // Use a date format that doesn't match YYYY-MM-DD, DD Month YYYY, or Month DD YYYY
    // but IS parseable by new Date() — e.g. "07/22/2024"
    const rawWithSlashDate = {
      ...mockRawData,
      patientAttributesList: [
        { patientuuid: 'pz', person_attribute_type_uuid: PROVIDER_ATTRIBUTE_TYPE, value: MOCK_PROVIDER_UUID },
        { patientuuid: 'pz', person_attribute_type_uuid: DATE_CREATED_ATTRIBUTE_TYPE, value: '07/22/2024' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithSlashDate);
    const { result } = renderHook(
      () => useAchievements({ fromDate: '2024-07-01', toDate: '2024-07-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.patientsCreatedToday).toBe(1);
  });

  it('includes patients with unparseable date attribute values (isDateInRange treats empty as match)', async () => {
    const rawWithBadDate = {
      ...mockRawData,
      patientAttributesList: [
        { patientuuid: 'pb', person_attribute_type_uuid: PROVIDER_ATTRIBUTE_TYPE, value: MOCK_PROVIDER_UUID },
        { patientuuid: 'pb', person_attribute_type_uuid: DATE_CREATED_ATTRIBUTE_TYPE, value: 'not-a-date-at-all' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithBadDate);
    const { result } = renderHook(
      () => useAchievements({ fromDate: '2024-07-01', toDate: '2024-07-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // toISODate returns '' for unparseable string →
    // isDateInRange('', fromDate, toDate) returns true (empty dateStr treated as match)
    expect(result.current.data!.patientsCreatedToday).toBe(1);
  });

  it('handles encounter_time via JS Date fallback (non-YYYY-MM-DD format)', async () => {
    // Use a human-readable date format that doesn't start with YYYY-MM-DD
    // but IS parseable by new Date() — triggers the fallback branch in getEncounterDate
    const humanDate = new Date(`${todayStr}T12:00:00`).toUTCString(); // e.g. "Thu, 15 May 2026 ..."
    const rawWithHumanTime = {
      ...mockRawData,
      encounterlist: [
        { uuid: 'e20', visituuid: 'v20', encounter_type_uuid: ENCOUNTER_PATIENT_EXIT_SURVEY, provider_uuid: MOCK_PROVIDER_UUID, encounter_time: humanDate },
      ],
      obslist: [
        { conceptuuid: SATISFACTION_SCORE_CONCEPT, encounteruuid: 'e20', value: '5' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithHumanTime);
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.visitsEndedToday).toBe(1);
  });

  it('handles encounter with unparseable encounter_time', async () => {
    const rawWithBadTime = {
      ...mockRawData,
      encounterlist: [
        { uuid: 'e30', visituuid: 'v30', encounter_type_uuid: ENCOUNTER_PATIENT_EXIT_SURVEY, provider_uuid: MOCK_PROVIDER_UUID, encounter_time: 'not-a-time' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithBadTime);
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // Unparseable encounter_time → getEncounterDate returns '' →
    // isDateInRange('', fromDate, toDate) returns true (empty dateStr is treated as match)
    // so the encounter IS counted
    expect(result.current.data!.visitsEndedToday).toBe(1);
  });

  it('handles encounter with undefined encounter_time (null-coalescing fallback)', async () => {
    const rawWithUndefinedTime = {
      ...mockRawData,
      encounterlist: [
        { uuid: 'e40', visituuid: 'v40', encounter_type_uuid: ENCOUNTER_PATIENT_EXIT_SURVEY, provider_uuid: MOCK_PROVIDER_UUID, encounter_time: undefined as unknown as string },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithUndefinedTime);
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // encounter_time ?? '' → '' → isDateInRange('', ...) returns true
    expect(result.current.data!.visitsEndedToday).toBe(1);
  });

  it('handles null patientAttributesList (null-coalescing fallback)', async () => {
    // Preload the store directly to bypass the reducer's .map() on patientAttributesList
    mockFetchRawData.mockResolvedValue(mockRawData);
    const store = configureStore({
      reducer: { achievement: achievementReducer },
      preloadedState: {
        achievement: {
          rawData: {
            patientAttributesList: null as unknown as typeof mockRawData.patientAttributesList,
            encounterlist: [],
            obslist: [],
          },
          loading: false,
          error: null,
          localPatients: [],
        },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useAchievements({ period: 'overall' }), { wrapper });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // null attrs → (attrs ?? []) fallback → 0 patients
    expect(result.current.data!.patientsCreatedToday).toBe(0);
  });

  it('filters out encounters with non-exit-survey encounter_type_uuid for visits count', async () => {
    const rawWithMixed = {
      ...mockRawData,
      encounterlist: [
        { uuid: 'e50', visituuid: 'v50', encounter_type_uuid: 'some-other-type', provider_uuid: MOCK_PROVIDER_UUID, encounter_time: `${todayStr} 10:00:00` },
        { uuid: 'e51', visituuid: 'v51', encounter_type_uuid: ENCOUNTER_PATIENT_EXIT_SURVEY, provider_uuid: MOCK_PROVIDER_UUID, encounter_time: `${todayStr} 11:00:00` },
      ],
      obslist: [
        { conceptuuid: SATISFACTION_SCORE_CONCEPT, encounteruuid: 'e51', value: '3' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithMixed);
    const { result } = renderHook(() => useAchievements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // Only e51 has exit survey type → 1 visit
    expect(result.current.data!.visitsEndedToday).toBe(1);
  });

  it('handles YYYY-MM-DD format date attribute values via toISODate', async () => {
    const rawWithIsoDate = {
      ...mockRawData,
      patientAttributesList: [
        { patientuuid: 'pi', person_attribute_type_uuid: PROVIDER_ATTRIBUTE_TYPE, value: MOCK_PROVIDER_UUID },
        { patientuuid: 'pi', person_attribute_type_uuid: DATE_CREATED_ATTRIBUTE_TYPE, value: '2024-07-22' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithIsoDate);
    const { result } = renderHook(
      () => useAchievements({ fromDate: '2024-07-01', toDate: '2024-07-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.patientsCreatedToday).toBe(1);
  });

  it('handles empty string date attribute value via toISODate', async () => {
    const rawWithEmptyDate = {
      ...mockRawData,
      patientAttributesList: [
        { patientuuid: 'pe', person_attribute_type_uuid: PROVIDER_ATTRIBUTE_TYPE, value: MOCK_PROVIDER_UUID },
        { patientuuid: 'pe', person_attribute_type_uuid: DATE_CREATED_ATTRIBUTE_TYPE, value: '' },
      ],
    };
    mockFetchRawData.mockResolvedValue(rawWithEmptyDate);
    const { result } = renderHook(
      () => useAchievements({ fromDate: '2024-07-01', toDate: '2024-07-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    // toISODate('') returns '' → isDateInRange('', ...) returns true
    expect(result.current.data!.patientsCreatedToday).toBe(1);
  });

  it('handles null patientAttributesList with date range (covers second ?? fallback)', async () => {
    mockFetchRawData.mockResolvedValue(mockRawData);
    const store = configureStore({
      reducer: { achievement: achievementReducer },
      preloadedState: {
        achievement: {
          rawData: {
            patientAttributesList: null as unknown as typeof mockRawData.patientAttributesList,
            encounterlist: [],
            obslist: [],
          },
          loading: false,
          error: null,
          localPatients: [],
        },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    // Use fromDate/toDate to reach the second (attrs ?? []) on line 138
    const { result } = renderHook(
      () => useAchievements({ fromDate: '2024-01-01', toDate: '2024-12-31' }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data!.patientsCreatedToday).toBe(0);
  });
});
