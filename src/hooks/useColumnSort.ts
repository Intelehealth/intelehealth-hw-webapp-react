import { useCallback, useState } from 'react';

type SortOrder = 'asc' | 'desc' | null;

export function useColumnSort() {
  const [sort, setSort] = useState<{ key: string | null; order: SortOrder }>({
    key: null,
    order: null,
  });

  const toggleSort = useCallback((key: string) => {
    setSort(prev => {
      if (prev.key !== key) return { key, order: 'asc' as const };
      if (prev.order === 'asc') return { key, order: 'desc' as const };
      return { key: null, order: null };
    });
  }, []);

  const applySort = useCallback(
    <T>(data: T[]): T[] => {
      if (!sort.key || !sort.order) return data;
      const k = sort.key;
      return [...data].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[k];
        const bVal = (b as Record<string, unknown>)[k];
        let cmp: number;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
        }
        return sort.order === 'asc' ? cmp : -cmp;
      });
    },
    [sort.key, sort.order]
  );

  return {
    sortKey: sort.key,
    sortOrder: sort.order,
    toggleSort,
    applySort,
  };
}
