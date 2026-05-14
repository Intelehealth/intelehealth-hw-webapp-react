import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSortByName } from './useSortByName';

describe('useSortByName', () => {
  it('returns initial sortOrder as null', () => {
    const { result } = renderHook(() => useSortByName());
    expect(result.current.sortOrder).toBeNull();
  });

  it('toggleSort cycles null → asc → desc → null', () => {
    const { result } = renderHook(() => useSortByName());

    expect(result.current.sortOrder).toBeNull();

    act(() => result.current.toggleSort());
    expect(result.current.sortOrder).toBe('asc');

    act(() => result.current.toggleSort());
    expect(result.current.sortOrder).toBe('desc');

    act(() => result.current.toggleSort());
    expect(result.current.sortOrder).toBeNull();
  });

  it('applySort returns data unchanged when sortOrder is null', () => {
    const { result } = renderHook(() => useSortByName());
    const data = [{ patientName: 'Zara' }, { patientName: 'Alice' }];
    expect(result.current.applySort(data)).toBe(data);
  });

  it('applySort sorts ascending by patientName', () => {
    const { result } = renderHook(() => useSortByName());

    act(() => result.current.toggleSort()); // asc

    const data = [
      { patientName: 'Zara', id: 1 },
      { patientName: 'Alice', id: 2 },
      { patientName: 'Mike', id: 3 },
    ];
    const sorted = result.current.applySort(data);
    expect(sorted.map(d => d.patientName)).toEqual(['Alice', 'Mike', 'Zara']);
  });

  it('applySort sorts descending by patientName', () => {
    const { result } = renderHook(() => useSortByName());

    act(() => result.current.toggleSort()); // asc
    act(() => result.current.toggleSort()); // desc

    const data = [
      { patientName: 'Alice', id: 1 },
      { patientName: 'Zara', id: 2 },
      { patientName: 'Mike', id: 3 },
    ];
    const sorted = result.current.applySort(data);
    expect(sorted.map(d => d.patientName)).toEqual(['Zara', 'Mike', 'Alice']);
  });

  it('applySort does not mutate original array', () => {
    const { result } = renderHook(() => useSortByName());

    act(() => result.current.toggleSort()); // asc

    const data = [{ patientName: 'Zara' }, { patientName: 'Alice' }];
    const sorted = result.current.applySort(data);
    expect(sorted).not.toBe(data);
    expect(data[0].patientName).toBe('Zara');
  });

  it('applySort handles empty array', () => {
    const { result } = renderHook(() => useSortByName());

    act(() => result.current.toggleSort()); // asc

    expect(result.current.applySort([])).toEqual([]);
  });

  it('applySort handles single-element array', () => {
    const { result } = renderHook(() => useSortByName());

    act(() => result.current.toggleSort()); // asc

    const data = [{ patientName: 'Alice' }];
    expect(result.current.applySort(data)).toEqual([{ patientName: 'Alice' }]);
  });
});
