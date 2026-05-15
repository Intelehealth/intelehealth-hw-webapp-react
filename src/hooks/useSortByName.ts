import { useCallback, useState } from 'react';

type SortOrder = 'asc' | 'desc' | null;

export function useSortByName() {
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const toggleSort = useCallback(
    () =>
      setSortOrder(prev =>
        prev === null ? 'asc' : prev === 'asc' ? 'desc' : null
      ),
    []
  );

  const applySort = useCallback(
    <T extends { patientName: string }>(data: T[]): T[] => {
      if (!sortOrder) return data;
      return [...data].sort((a, b) => {
        const cmp = a.patientName.localeCompare(b.patientName);
        return sortOrder === 'asc' ? cmp : -cmp;
      });
    },
    [sortOrder]
  );

  return { sortOrder, toggleSort, applySort };
}
