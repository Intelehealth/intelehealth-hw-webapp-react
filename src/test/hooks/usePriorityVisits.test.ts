import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPriorityVisits = vi.fn();
const MOCK_LOCATION_UUID = 'loc-uuid-123';
const mockUseProfileContext = vi.fn();

vi.mock('../../context/ProfileContext', () => ({
  useProfileContext: () => mockUseProfileContext(),
}));

vi.mock('../../services/patient.service', () => ({
  patientService: {
    getPriorityVisits: (...args: unknown[]) => mockGetPriorityVisits(...args),
  },
}));

import { usePriorityVisits } from '../../hooks/usePriorityVisits';

const mockVisits = [
  {
    visitUuid: 'pv-1',
    patientName: 'Anita Desai',
    gender: 'F',
    age: 42,
    visitCreatedDate: '2025-04-20',
    clinicName: 'TM Clinic 2',
    uploadTimestamp: '1 hr ago',
    isPriority: true,
  },
];

describe('usePriorityVisits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileContext.mockReturnValue({ locationUuid: MOCK_LOCATION_UUID });
  });

  it('initialises with empty data, loading false, no error', () => {
    mockGetPriorityVisits.mockResolvedValue({ visits: [], totalCount: 0 });
    const { result } = renderHook(() => usePriorityVisits());

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.totalCount).toBe(0);
  });

  it('fetches priority visits and populates data', async () => {
    mockGetPriorityVisits.mockResolvedValue({
      visits: mockVisits,
      totalCount: mockVisits.length,
    });
    const { result } = renderHook(() => usePriorityVisits());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockVisits);
    });

    expect(result.current.totalCount).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls getPriorityVisits with the location uuid', async () => {
    mockGetPriorityVisits.mockResolvedValue({ visits: [], totalCount: 0 });
    renderHook(() => usePriorityVisits());

    await waitFor(() => {
      expect(mockGetPriorityVisits).toHaveBeenCalledWith(MOCK_LOCATION_UUID);
    });
  });

  it('sets error message when API call fails', async () => {
    mockGetPriorityVisits.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => usePriorityVisits());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch priority visits');
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when locationUuid is null', () => {
    mockUseProfileContext.mockReturnValue({ locationUuid: null });
    renderHook(() => usePriorityVisits());

    expect(mockGetPriorityVisits).not.toHaveBeenCalled();
  });

  it('re-fetches when locationUuid changes', async () => {
    mockGetPriorityVisits.mockResolvedValue({
      visits: mockVisits,
      totalCount: mockVisits.length,
    });
    let locationUuid = MOCK_LOCATION_UUID;
    mockUseProfileContext.mockImplementation(() => ({ locationUuid }));

    const { rerender } = renderHook(() => usePriorityVisits());
    await waitFor(() => {
      expect(mockGetPriorityVisits).toHaveBeenCalledTimes(1);
    });

    locationUuid = 'loc-uuid-new';
    mockGetPriorityVisits.mockResolvedValue({ visits: [], totalCount: 0 });
    rerender();

    await waitFor(() => {
      expect(mockGetPriorityVisits).toHaveBeenCalledTimes(2);
      expect(mockGetPriorityVisits).toHaveBeenLastCalledWith('loc-uuid-new');
    });
  });
});
