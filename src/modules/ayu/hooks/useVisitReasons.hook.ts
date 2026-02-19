import { useMemo, useState } from 'react';
import { useAyuJsonList } from './useAyuJson.hook';

export const useVisitReasons = () => {
  const ayuJsonList = useAyuJsonList('IDA6');

  const names = useMemo(() => {
    return ayuJsonList
      .map(item => item.name.replace(/\.json$/i, ''))
      .sort((a, b) => a.localeCompare(b));
  }, [ayuJsonList]);

  const [search, setSearch] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const filteredNames = useMemo(() => {
    if (!search) return [];
    return names.filter(n => n.toLowerCase().includes(search.toLowerCase()));
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
    const map: Record<string, string[]> = {};

    names.forEach(name => {
      const clean = name?.replace(/\s+/g, ' ').trim();
      const letter = clean.charAt(0).toUpperCase();

      if (!map[letter]) map[letter] = [];
      map[letter].push(clean);
    });

    Object.keys(map).forEach(letter => map[letter].sort());

    return map;
  }, [names]);

  const selectedComplaints = useMemo(() => {
    const set = new Set(selectedReasons);
    return ayuJsonList.filter(item =>
      set.has(item.name.replace(/\.json$/i, ''))
    );
  }, [ayuJsonList, selectedReasons]);

  return {
    search,
    setSearch,
    filteredNames,
    selectedReasons,
    addReason,
    removeReason,
    grouped,
    selectedComplaints,
  };
};
