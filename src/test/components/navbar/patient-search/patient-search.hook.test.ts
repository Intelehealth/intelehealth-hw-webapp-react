import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { usePatientSearch } from '../../../../components/navbar/patient-search/patient-search.hook';
import { PatientSearchService } from '../../../../components/navbar/patient-search/patient-search.service';

vi.mock(
  '../../../../components/navbar/patient-search/patient-search.service',
  () => ({
    PatientSearchService: {
      searchPatient: vi.fn(),
    },
  })
);

const mockResults = [
  {
    uuid: 'uuid-1',
    identifiers: [
      { identifier: 'OPM-100', identifierType: { name: 'OpenMRS ID' } },
    ],
    person: { display: 'John Doe', gender: 'M', age: 30, attributes: [] },
  },
];

describe('usePatientSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(PatientSearchService.searchPatient).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial empty state', () => {
    const { result } = renderHook(() => usePatientSearch(''));

    expect(result.current.patients).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should clear patients when search term is empty', () => {
    const { result, rerender } = renderHook(
      ({ term }) => usePatientSearch(term),
      { initialProps: { term: '' } }
    );

    expect(result.current.patients).toEqual([]);

    rerender({ term: '' });
    expect(result.current.patients).toEqual([]);
  });

  it('should clear patients when search term is whitespace', () => {
    const { result } = renderHook(() => usePatientSearch('   '));

    expect(result.current.patients).toEqual([]);
    expect(PatientSearchService.searchPatient).not.toHaveBeenCalled();
  });

  it('should debounce API calls by 500ms', async () => {
    vi.mocked(PatientSearchService.searchPatient).mockResolvedValue({
      results: mockResults,
    });

    renderHook(() => usePatientSearch('John'));

    // Should not call API immediately
    expect(PatientSearchService.searchPatient).not.toHaveBeenCalled();

    // Advance past debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(PatientSearchService.searchPatient).toHaveBeenCalledWith('John');
  });

  it('should set patients from API response', async () => {
    vi.mocked(PatientSearchService.searchPatient).mockResolvedValue({
      results: mockResults,
    });

    const { result } = renderHook(() => usePatientSearch('John'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.patients).toEqual(mockResults);
    expect(result.current.loading).toBe(false);
  });

  it('should set loading to false after API resolves', async () => {
    vi.mocked(PatientSearchService.searchPatient).mockResolvedValue({
      results: mockResults,
    });

    const { result } = renderHook(() => usePatientSearch('John'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.loading).toBe(false);
  });

  it('should handle empty results from API', async () => {
    vi.mocked(PatientSearchService.searchPatient).mockResolvedValue({
      results: [],
    });

    const { result } = renderHook(() => usePatientSearch('xyz'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.patients).toEqual([]);
  });

  it('should handle API response without results key', async () => {
    vi.mocked(PatientSearchService.searchPatient).mockResolvedValue({});

    const { result } = renderHook(() => usePatientSearch('test'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.patients).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(PatientSearchService.searchPatient).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => usePatientSearch('John'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.loading).toBe(false);
    consoleSpy.mockRestore();
  });

  it('should cancel previous in-flight request when a new search is triggered', async () => {
    const mockCancel = vi.fn();
    const axios = await import('axios');
    vi.spyOn(axios.default.CancelToken, 'source').mockReturnValue({
      token: {} as any,
      cancel: mockCancel,
    });

    vi.mocked(PatientSearchService.searchPatient).mockResolvedValue({
      results: mockResults,
    });

    const { rerender } = renderHook(
      ({ term }) => usePatientSearch(term),
      { initialProps: { term: 'John' } }
    );

    // Let first debounce fire and fetchPatients run (sets cancelTokenRef)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Change term to trigger a second fetchPatients
    rerender({ term: 'Jane' });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // The second fetchPatients should have cancelled the first token
    expect(mockCancel).toHaveBeenCalled();
  });

  it('should cancel previous debounce when search term changes', async () => {
    vi.mocked(PatientSearchService.searchPatient).mockResolvedValue({
      results: mockResults,
    });

    const { rerender } = renderHook(
      ({ term }) => usePatientSearch(term),
      { initialProps: { term: 'J' } }
    );

    // Advance partially
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // Change term before debounce fires
    rerender({ term: 'Jo' });

    // Advance past the original debounce time
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // First search should NOT have been called
    expect(PatientSearchService.searchPatient).not.toHaveBeenCalledWith('J');

    // Advance remaining for the new debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(PatientSearchService.searchPatient).toHaveBeenCalledWith('Jo');
  });

  it('should reset patients when search term becomes empty', async () => {
    vi.mocked(PatientSearchService.searchPatient).mockResolvedValue({
      results: mockResults,
    });

    const { result, rerender } = renderHook(
      ({ term }) => usePatientSearch(term),
      { initialProps: { term: 'John' } }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.patients).toEqual(mockResults);

    // Clear the search term
    rerender({ term: '' });

    expect(result.current.patients).toEqual([]);
  });
});
