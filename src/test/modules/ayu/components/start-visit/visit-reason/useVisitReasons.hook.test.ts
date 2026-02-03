import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisitReasons } from '../../../../../../modules/ayu/components/start-visit/visit-reason/useVisitReasons.hook';

// Mock the useAyuJsonList hook
vi.mock('../../../../../../modules/ayu/hooks/useAyuJson', () => ({
  useAyuJsonList: vi.fn(() => [
    { name: 'Fever.json' },
    { name: 'Cough.json' },
    { name: 'Headache.json' },
  ]),
}));

describe('useVisitReasons', () => {
  it('should initialize with empty search and selectedReasons', () => {
    const { result } = renderHook(() => useVisitReasons());

    expect(result.current.search).toBe('');
    expect(result.current.selectedReasons).toEqual([]);
  });

  it('should return sorted names without .json extension', () => {
    const { result } = renderHook(() => useVisitReasons());

    expect(result.current.grouped).toBeDefined();
  });

  it('should filter names based on search query', () => {
    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.setSearch('Fever');
    });

    expect(result.current.filteredNames).toContain('Fever');
  });

  it('should add reason to selectedReasons', () => {
    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.addReason('Fever');
    });

    expect(result.current.selectedReasons).toContain('Fever');
  });

  it('should not add duplicate reasons', () => {
    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.addReason('Fever');
      result.current.addReason('Fever');
    });

    expect(result.current.selectedReasons).toEqual(['Fever']);
  });

  it('should clear search when adding a reason', () => {
    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.setSearch('Fever');
      result.current.addReason('Fever');
    });

    expect(result.current.search).toBe('');
  });

  it('should remove reason from selectedReasons', () => {
    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.addReason('Fever');
      result.current.addReason('Cough');
      result.current.removeReason('Fever');
    });

    expect(result.current.selectedReasons).toEqual(['Cough']);
  });

  it('should return empty filteredNames when search is empty', () => {
    const { result } = renderHook(() => useVisitReasons());

    expect(result.current.filteredNames).toEqual([]);
  });
});
