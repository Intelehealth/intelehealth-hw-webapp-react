import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { storage } from '../../../utils/storage';
import {
  extractVisitReasonNames,
  filterNamesBySearch,
  groupByFirstLetter,
} from '../../ayu-library/logic/visit-reasons.logic';
import { EXCLUDED_JSON_NAMES } from '../../ayu-library/utils/constants';
import {
  type PatientDemographics,
  parsePatientAgeYears,
  questionnaireMatchesDemographics,
} from '../../ayu-library/utils/fhir-to-ayu.util';
import {
  AYU_JSON_KEY_NAME,
  PATIENT_AGE_KEY,
  PATIENT_GENDER_KEY,
} from '../utils/ayu.constants';
import { useAyuJsonList } from './useAyuJson.hook';

export type VisitReasonsResult = ReturnType<typeof useVisitReasons>;

interface NavigationPatientState {
  patientAge?: number | string | null;
  patientGender?: string | null;
}

export const usePatientDemographics = (): PatientDemographics => {
  const { state } = useLocation();
  const navState = state as NavigationPatientState | null;

  const age = navState?.patientAge ?? storage.get(PATIENT_AGE_KEY);
  const gender = navState?.patientGender ?? storage.get(PATIENT_GENDER_KEY);

  return useMemo(
    () => ({
      age: parsePatientAgeYears(age),
      gender,
    }),
    [age, gender]
  );
};

export const useVisitReasons = () => {
  const ayuJsonList = useAyuJsonList(AYU_JSON_KEY_NAME);

  const patientDemographics = usePatientDemographics();

  // Protocols whose top-level gender/age extensions exclude the current
  const disabledReasons = useMemo(() => {
    const excludedSet = new Set(EXCLUDED_JSON_NAMES);
    const disabled = new Set<string>();
    for (const item of ayuJsonList) {
      const name = item.name.replace(/\.json$/i, '').trim();
      if (excludedSet.has(name)) continue;
      if (!questionnaireMatchesDemographics(item.json, patientDemographics)) {
        disabled.add(name);
      }
    }
    return disabled;
  }, [ayuJsonList, patientDemographics]);

  const names = useMemo(() => {
    return extractVisitReasonNames(ayuJsonList, EXCLUDED_JSON_NAMES);
  }, [ayuJsonList]);

  const [search, setSearch] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const filteredNames = useMemo(() => {
    return filterNamesBySearch(names, search);
  }, [search, names]);

  const addReason = (reason: string) => {
    if (disabledReasons.has(reason)) return;
    setSelectedReasons(prev => {
      if (prev.includes(reason)) return prev;
      return [...prev, reason];
    });
    setSearch('');
  };

  const removeReason = (reason: string) => {
    setSelectedReasons(prev => prev.filter(r => r !== reason));
  };

  const grouped = useMemo(() => {
    return groupByFirstLetter(names);
  }, [names]);

  const selectedComplaints = useMemo(() => {
    const set = new Set(selectedReasons);
    return ayuJsonList.filter(item =>
      set.has(item.name.replace(/\.json$/i, '').trim())
    );
  }, [ayuJsonList, selectedReasons]);

  const ayuConfigFiles = useMemo(() => {
    const excludedSet = new Set(EXCLUDED_JSON_NAMES);
    return ayuJsonList.filter(item =>
      excludedSet.has(item.name.replace(/\.json$/i, '').trim())
    );
  }, [ayuJsonList]);

  return {
    search,
    setSearch,
    filteredNames,
    selectedReasons,
    disabledReasons,
    addReason,
    removeReason,
    grouped,
    selectedComplaints,
    ayuConfigFiles,
  };
};
