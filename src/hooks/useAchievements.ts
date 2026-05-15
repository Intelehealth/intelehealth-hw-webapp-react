import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useProfileContext } from '../context/ProfileContext';
import { useAppDispatch } from '../store/hooks';
import {
  fetchAchievementData,
  refreshAchievementData,
} from '../actions/achievement.actions';
import {
  ENCOUNTER_PATIENT_EXIT_SURVEY,
  SATISFACTION_SCORE_CONCEPT,
  PROVIDER_ATTRIBUTE_TYPE,
  DATE_CREATED_ATTRIBUTE_TYPE,
} from '../utils/achievement.constants';
import type {
  AchievementsData,
  PullRawData,
  LocalPatient,
  Encounter,
  Obs,
  PatientAttribute,
  UseAchievementsParams,
} from '../types/achievement.types';
import type { RootState } from '../reducers';

/** Get today's date as YYYY-MM-DD */
function getTodayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const MONTH_MAP: Record<string, string> = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

/**
 * Parse date strings to YYYY-MM-DD.
 * Handles: "2024-07-22", "22 July, 2024", "22 Jul 2024", "July 22, 2024",
 * and any format JS Date can parse as fallback.
 * Returns empty string if unparseable.
 */
function toISODate(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();

  // Already YYYY-MM-DD (or starts with it, e.g. ISO datetime)
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  // "22 July, 2024" or "22 Jul 2024" format (DD Month YYYY)
  const ddMonYyyy = trimmed.match(/^(\d{1,2})\s+(\w+),?\s+(\d{4})$/);
  if (ddMonYyyy) {
    const day = ddMonYyyy[1].padStart(2, '0');
    const month = MONTH_MAP[ddMonYyyy[2].toLowerCase()];
    const year = ddMonYyyy[3];
    if (month) return `${year}-${month}-${day}`;
  }

  // "July 22, 2024" or "Jul 22 2024" format (Month DD YYYY)
  const monDdYyyy = trimmed.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monDdYyyy) {
    const month = MONTH_MAP[monDdYyyy[1].toLowerCase()];
    const day = monDdYyyy[2].padStart(2, '0');
    const year = monDdYyyy[3];
    if (month) return `${year}-${month}-${day}`;
  }

  // Fallback: try JS Date constructor
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return '';
}

/**
 * Extract YYYY-MM-DD from encounter_time.
 * encounter_time may be a datetime string or timestamp.
 */
function getEncounterDate(e: Encounter): string {
  const t = e.encounter_time ?? '';
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const d = new Date(t);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return '';
}

function isDateInRange(
  dateStr: string,
  fromDate?: string,
  toDate?: string
): boolean {
  if (!dateStr || !fromDate) return true;
  if (dateStr < fromDate) return false;
  if (toDate && dateStr > toDate) return false;
  return true;
}

/**
 * Count patients created by this provider, optionally within a date range.
 * Merges pulldata patients with locally tracked patients (not yet synced to middleware).
 */
function countPatientsCreated(
  attrs: PatientAttribute[],
  providerUuid: string,
  localPatients: LocalPatient[],
  fromDate?: string,
  toDate?: string
): number {
  // Patients from pulldata API
  const providerPatients = new Set(
    (attrs ?? [])
      .filter(
        a =>
          a.person_attribute_type_uuid === PROVIDER_ATTRIBUTE_TYPE &&
          a.value === providerUuid
      )
      .map(a => a.patientuuid)
  );

  // Merge locally tracked patients (not yet in pulldata)
  const localForProvider = localPatients.filter(
    lp =>
      lp.providerUuid === providerUuid && !providerPatients.has(lp.patientuuid)
  );

  if (!fromDate) return providerPatients.size + localForProvider.length;

  const dateFiltered = new Set(
    (attrs ?? [])
      .filter(a => {
        if (a.person_attribute_type_uuid !== DATE_CREATED_ATTRIBUTE_TYPE)
          return false;
        if (!providerPatients.has(a.patientuuid)) return false;
        const dateStr = toISODate(a.value);
        return isDateInRange(dateStr, fromDate, toDate);
      })
      .map(a => a.patientuuid)
  );

  // Add local patients that match the date range
  for (const lp of localForProvider) {
    if (isDateInRange(lp.createdDate, fromDate, toDate)) {
      dateFiltered.add(lp.patientuuid);
    }
  }

  return dateFiltered.size;
}

/**
 * Count visits ended by this provider, optionally within a date range.
 */
function countVisitsEnded(
  encounters: Encounter[],
  providerUuid: string,
  fromDate?: string,
  toDate?: string
): number {
  if (!encounters?.length) return 0;
  const visitUuids = new Set(
    encounters
      .filter(e => {
        if (e.encounter_type_uuid !== ENCOUNTER_PATIENT_EXIT_SURVEY)
          return false;
        if (e.provider_uuid !== providerUuid) return false;
        if (fromDate) {
          const dateStr = getEncounterDate(e);
          if (!isDateInRange(dateStr, fromDate, toDate)) return false;
        }
        return true;
      })
      .map(e => e.visituuid)
  );
  return visitUuids.size;
}

/**
 * Average satisfaction score for this provider's encounters, optionally within a date range.
 */
function calcAverageSatisfactionScore(
  obslist: Obs[],
  encounters: Encounter[],
  providerUuid: string,
  fromDate?: string,
  toDate?: string
): number {
  if (!obslist?.length || !encounters?.length) return 0;
  const providerEncounterUuids = new Set(
    encounters
      .filter(e => {
        if (e.provider_uuid !== providerUuid) return false;
        if (fromDate) {
          const dateStr = getEncounterDate(e);
          if (!isDateInRange(dateStr, fromDate, toDate)) return false;
        }
        return true;
      })
      .map(e => e.uuid)
  );
  const scores = obslist
    .filter(
      o =>
        o.conceptuuid === SATISFACTION_SCORE_CONCEPT &&
        providerEncounterUuids.has(o.encounteruuid)
    )
    .map(o => parseFloat(o.value))
    .filter(v => !isNaN(v));
  if (scores.length === 0) return 0;
  return scores.reduce((sum, v) => sum + v, 0) / scores.length;
}

function computeMetrics(
  raw: PullRawData,
  providerUuid: string,
  localPatients: LocalPatient[],
  params?: UseAchievementsParams
): AchievementsData {
  let fromDate: string | undefined;
  let toDate: string | undefined;

  if (!params?.period) {
    if (params?.fromDate) {
      fromDate = params.fromDate;
      toDate = params.toDate;
    } else {
      const today = getTodayStr();
      fromDate = today;
      toDate = today;
    }
  }

  return {
    patientsCreatedToday: countPatientsCreated(
      raw.patientAttributesList,
      providerUuid,
      localPatients,
      fromDate,
      toDate
    ),
    visitsEndedToday: countVisitsEnded(
      raw.encounterlist,
      providerUuid,
      fromDate,
      toDate
    ),
    averagePatientSatisfactionScore: calcAverageSatisfactionScore(
      raw.obslist,
      raw.encounterlist,
      providerUuid,
      fromDate,
      toDate
    ),
  };
}

export const useAchievements = (params?: UseAchievementsParams) => {
  const dispatch = useAppDispatch();
  const { hwProfile, locationUuid } = useProfileContext();
  const providerUuid = hwProfile?.providerUuid;

  const { rawData, loading, error, localPatients } = useSelector(
    (state: RootState) => state.achievement
  );

  // Dispatch fetch only once — action guards against duplicates
  useEffect(() => {
    if (!locationUuid || !providerUuid) return;
    dispatch(fetchAchievementData(locationUuid));
  }, [dispatch, locationUuid, providerUuid]);

  // Compute metrics client-side whenever tab/params change
  const data = useMemo<AchievementsData | null>(() => {
    if (!rawData || !providerUuid) return null;
    return computeMetrics(rawData, providerUuid, localPatients, params);
  }, [
    rawData,
    providerUuid,
    localPatients,
    params?.period,
    params?.fromDate,
    params?.toDate,
  ]);

  const refresh = () => {
    if (locationUuid) {
      dispatch(refreshAchievementData(locationUuid));
    }
  };

  return { data, loading, error, refresh };
};
