import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useColumnSort } from './useColumnSort';

describe('useColumnSort', () => {
  it('initial state has null sortKey and sortOrder', () => {
    const { result } = renderHook(() => useColumnSort());
    expect(result.current.sortKey).toBeNull();
    expect(result.current.sortOrder).toBeNull();
  });

  it('toggleSort sets ascending on first click', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('name'));
    expect(result.current.sortKey).toBe('name');
    expect(result.current.sortOrder).toBe('asc');
  });

  it('toggleSort sets descending on second click of same key', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('name'));
    expect(result.current.sortKey).toBe('name');
    expect(result.current.sortOrder).toBe('desc');
  });

  it('toggleSort resets to null on third click of same key', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('name'));
    expect(result.current.sortKey).toBeNull();
    expect(result.current.sortOrder).toBeNull();
  });

  it('toggleSort on a different key resets to ascending', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('age'));
    expect(result.current.sortKey).toBe('age');
    expect(result.current.sortOrder).toBe('asc');
  });

  it('applySort returns data unchanged when no sort is active', () => {
    const { result } = renderHook(() => useColumnSort());
    const data = [{ name: 'B' }, { name: 'A' }];
    expect(result.current.applySort(data)).toEqual([
      { name: 'B' },
      { name: 'A' },
    ]);
  });

  it('applySort sorts strings ascending', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('name'));
    const data = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
    const sorted = result.current.applySort(data);
    expect(sorted.map(d => d.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('applySort sorts strings descending', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('name'));
    const data = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];
    const sorted = result.current.applySort(data);
    expect(sorted.map(d => d.name)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('applySort sorts numbers ascending', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('age'));
    const data = [{ age: 30 }, { age: 10 }, { age: 20 }];
    const sorted = result.current.applySort(data);
    expect(sorted.map(d => d.age)).toEqual([10, 20, 30]);
  });

  it('applySort sorts numbers descending', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('age'));
    act(() => result.current.toggleSort('age'));
    const data = [{ age: 10 }, { age: 30 }, { age: 20 }];
    const sorted = result.current.applySort(data);
    expect(sorted.map(d => d.age)).toEqual([30, 20, 10]);
  });

  it('applySort does not mutate original array', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('name'));
    const data = [{ name: 'B' }, { name: 'A' }];
    const sorted = result.current.applySort(data);
    expect(sorted).not.toBe(data);
    expect(data[0].name).toBe('B');
  });

  it('applySort handles empty array', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('name'));
    expect(result.current.applySort([])).toEqual([]);
  });

  it('applySort handles null/undefined values gracefully', () => {
    const { result } = renderHook(() => useColumnSort());
    act(() => result.current.toggleSort('name'));
    const data = [
      { name: undefined },
      { name: 'Alice' },
      { name: null },
    ] as Record<string, unknown>[];
    const sorted = result.current.applySort(data);
    expect(sorted.map(d => d.name)).toEqual([undefined, null, 'Alice']);
  });
});
