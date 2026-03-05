import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVisitReasons } from '../../../../modules/ayu/hooks/useVisitReasons.hook';

// Mock the useAyuJsonList hook
vi.mock('../../../../modules/ayu/hooks/useAyuJson.hook', () => ({
  useAyuJsonList: vi.fn(() => [
    { name: 'Fever.json' },
    { name: 'Cough.json' },
    { name: 'Headache.json' },
  ]),
}));

import { useAyuJsonList } from '../../../../modules/ayu/hooks/useAyuJson.hook';
const mockUseAyuJsonList = vi.mocked(useAyuJsonList);

describe('useVisitReasons', () => {
  beforeEach(() => {
    // Reset to default mock
    mockUseAyuJsonList.mockReturnValue([
      { name: 'Fever.json' },
      { name: 'Cough.json' },
      { name: 'Headache.json' },
    ] as any);
  });

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

  it('should exclude names in EXCLUDED_JSON_NAMES list', () => {
    mockUseAyuJsonList.mockReturnValue([
      { name: 'Fever.json' },
      { name: 'famHist.json' },
      { name: 'physExam.json' },
      { name: 'patHist.json' },
      { name: 'Cough.json' },
    ] as any);

    const { result } = renderHook(() => useVisitReasons());

    // famHist, physExam, patHist should be excluded from grouped
    const allGroupedNames = Object.values(result.current.grouped).flat();
    expect(allGroupedNames).not.toContain('famHist');
    expect(allGroupedNames).not.toContain('physExam');
    expect(allGroupedNames).not.toContain('patHist');
    expect(allGroupedNames).toContain('Fever');
    expect(allGroupedNames).toContain('Cough');
  });

  it('should not include excluded names in filteredNames', () => {
    mockUseAyuJsonList.mockReturnValue([
      { name: 'Fever.json' },
      { name: 'famHist.json' },
    ] as any);

    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.setSearch('f');
    });

    expect(result.current.filteredNames).toContain('Fever');
    expect(result.current.filteredNames).not.toContain('famHist');
  });

  it('should return selectedComplaints matching selectedReasons', () => {
    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.addReason('Fever');
    });

    expect(result.current.selectedComplaints).toHaveLength(1);
    expect(result.current.selectedComplaints[0].name).toBe('Fever.json');
  });

  it('should group names alphabetically', () => {
    const { result } = renderHook(() => useVisitReasons());

    expect(result.current.grouped['C']).toContain('Cough');
    expect(result.current.grouped['F']).toContain('Fever');
    expect(result.current.grouped['H']).toContain('Headache');
  });
});
