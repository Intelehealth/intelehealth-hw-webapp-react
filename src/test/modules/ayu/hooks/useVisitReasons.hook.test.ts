import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from '../../../../utils/storage';
import { useVisitReasons } from '../../../../modules/ayu/hooks/useVisitReasons.hook';
import {
  EXT_URL_AGE_MAX,
  EXT_URL_AGE_MIN,
  EXT_URL_GENDER,
} from '../../../../modules/ayu-library/utils/constants';

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

  it('should return multiple selectedComplaints matching multiple selectedReasons', () => {
    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.addReason('Fever');
      result.current.addReason('Cough');
    });

    expect(result.current.selectedComplaints).toHaveLength(2);
    const names = result.current.selectedComplaints.map(c => c.name);
    expect(names).toContain('Fever.json');
    expect(names).toContain('Cough.json');
  });

  it('should return empty selectedComplaints when no reasons selected', () => {
    const { result } = renderHook(() => useVisitReasons());

    expect(result.current.selectedComplaints).toHaveLength(0);
  });

  it('resolves selectedComplaints when the source filename has trailing whitespace', () => {
    mockUseAyuJsonList.mockReturnValue([
      { name: 'Abdominal Pain .json' },
    ] as any);

    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.addReason('Abdominal Pain');
    });

    expect(result.current.selectedReasons).toEqual(['Abdominal Pain']);
    expect(result.current.selectedComplaints).toHaveLength(1);
    expect(result.current.selectedComplaints[0].name).toBe(
      'Abdominal Pain .json'
    );
  });

  it('matches ayuConfigFiles even when the source filename has trailing whitespace', () => {
    mockUseAyuJsonList.mockReturnValue([
      { name: 'physExam .json' },
      { name: 'Fever.json' },
    ] as any);

    const { result } = renderHook(() => useVisitReasons());

    expect(result.current.ayuConfigFiles).toHaveLength(1);
    expect(result.current.ayuConfigFiles[0].name).toBe('physExam .json');
  });

  it('should filter names case-insensitively', () => {
    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.setSearch('fever');
    });

    expect(result.current.filteredNames).toContain('Fever');
  });

  it('should handle removing a reason that does not exist', () => {
    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.addReason('Fever');
      result.current.removeReason('NonExistent');
    });

    expect(result.current.selectedReasons).toEqual(['Fever']);
  });

  it('should handle empty ayuJsonList', () => {
    mockUseAyuJsonList.mockReturnValue([] as any);

    const { result } = renderHook(() => useVisitReasons());

    expect(result.current.grouped).toEqual({});
    expect(result.current.filteredNames).toEqual([]);
  });

  it('should update filteredNames reactively when search changes', () => {
    const { result } = renderHook(() => useVisitReasons());

    act(() => {
      result.current.setSearch('Co');
    });

    expect(result.current.filteredNames).toContain('Cough');
    expect(result.current.filteredNames).not.toContain('Fever');

    act(() => {
      result.current.setSearch('Fe');
    });

    expect(result.current.filteredNames).toContain('Fever');
    expect(result.current.filteredNames).not.toContain('Cough');
  });

  describe('demographics filtering', () => {
    const pregnancyItem = {
      name: 'Pregnancy.json',
      json: {
        resourceType: 'Questionnaire',
        extension: [
          { url: EXT_URL_GENDER, valueString: 'female' },
          { url: EXT_URL_AGE_MIN, valueString: '14' },
          { url: EXT_URL_AGE_MAX, valueString: '49' },
        ],
      },
    };

    const setPatient = (age: string | null, gender: string | null) => {
      vi.spyOn(storage, 'get').mockImplementation((key: string) => {
        if (key === 'patientAge') return age;
        if (key === 'patientGender') return gender;
        return null;
      });
    };

    it('still lists protocols excluded by demographics but marks them disabled', () => {
      mockUseAyuJsonList.mockReturnValue([
        pregnancyItem,
        { name: 'Fever.json', json: { resourceType: 'Questionnaire' } },
      ] as any);
      setPatient('30', 'M');

      const { result } = renderHook(() => useVisitReasons());

      expect(result.current.grouped['P']).toContain('Pregnancy');
      expect(result.current.grouped['F']).toContain('Fever');
      expect(result.current.disabledReasons.has('Pregnancy')).toBe(true);
      expect(result.current.disabledReasons.has('Fever')).toBe(false);
    });

    it('does not disable protocols that match the patient demographics', () => {
      mockUseAyuJsonList.mockReturnValue([pregnancyItem] as any);
      setPatient('30', 'F');

      const { result } = renderHook(() => useVisitReasons());
      expect(result.current.grouped['P']).toContain('Pregnancy');
      expect(result.current.disabledReasons.has('Pregnancy')).toBe(false);
    });

    it('addReason ignores disabled reasons', () => {
      mockUseAyuJsonList.mockReturnValue([pregnancyItem] as any);
      setPatient('30', 'M');

      const { result } = renderHook(() => useVisitReasons());
      act(() => {
        result.current.addReason('Pregnancy');
      });
      expect(result.current.selectedReasons).toEqual([]);
    });
  });
});
