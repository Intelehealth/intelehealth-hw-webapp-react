import { useMemo, useState } from 'react';
import {
  extractVisitReasonNames,
  filterNamesBySearch,
  groupByFirstLetter,
} from '../../ayu-library/logic/visit-reasons.logic';
import { EXCLUDED_JSON_NAMES } from '../../ayu-library/utils/constants';
import { AYU_JSON_KEY_NAME } from '../utils/ayu.constants';
import { useAyuJsonList } from './useAyuJson.hook';

export type VisitReasonsResult = ReturnType<typeof useVisitReasons>;

export const useVisitReasons = () => {
  const ayuJsonList = useAyuJsonList(AYU_JSON_KEY_NAME);

  const names = useMemo(() => {
    return extractVisitReasonNames(ayuJsonList, EXCLUDED_JSON_NAMES);
  }, [ayuJsonList]);

  const [search, setSearch] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const filteredNames = useMemo(() => {
    return filterNamesBySearch(names, search);
  }, [search, names]);

  const addReason = (reason: string) => {
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
      set.has(item.name.replace(/\.json$/i, ''))
    );
  }, [ayuJsonList, selectedReasons]);

  const ayuConfigFiles = useMemo(() => {
    const excludedSet = new Set(EXCLUDED_JSON_NAMES);
    return ayuJsonList.filter(item =>
      excludedSet.has(item.name.replace(/\.json$/i, ''))
    );
  }, [ayuJsonList]);

  return {
    search,
    setSearch,
    filteredNames,
    selectedReasons,
    addReason,
    removeReason,
    grouped,
    selectedComplaints,
    ayuConfigFiles,
  };
};
