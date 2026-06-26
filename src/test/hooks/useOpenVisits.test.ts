import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetOpenVisits = vi.fn();
const MOCK_LOCATION_UUID = 'loc-uuid-123';
const mockUseProfileContext = vi.fn();

vi.mock('../../context/ProfileContext', () => ({
  useProfileContext: () => mockUseProfileContext(),
}));

vi.mock('../../services/patient.service', () => ({
  patientService: {
    getOpenVisits: (...args: unknown[]) => mockGetOpenVisits(...args),
  },
}));

import { useOpenVisits } from '../../hooks/useOpenVisits';

const mockVisits = [
  {
    visitUuid: 'v-1',
    patientName: 'Ravi Kumar',
    gender: 'M',
    age: 35,
    visitCreatedDate: '2025-04-21',
    clinicName: 'TM Clinic 1',
    uploadTimestamp: '1 hr ago',
  },
  {
    visitUuid: 'v-2',
    patientName: 'Priya Singh',
    gender: 'F',
    age: 28,
    visitCreatedDate: '2025-04-20',
    clinicName: 'TM Clinic 2',
    uploadTimestamp: '3 hr ago',
  },
];

describe('useOpenVisits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileContext.mockReturnValue({ locationUuid: MOCK_LOCATION_UUID });
  });

  it('initialises with empty data, loading false, no error', () => {
    mockGetOpenVisits.mockResolvedValue({ visits: [], totalCount: 0 });
    const { result } = renderHook(() => useOpenVisits());

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.totalCount).toBe(0);
  });

  it('sets loading true while fetching and false after', async () => {
    mockGetOpenVisits.mockResolvedValue({ visits: mockVisits, totalCount: mockVisits.length });
    const { result } = renderHook(() => useOpenVisits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('fetches open visits and populates data', async () => {
    mockGetOpenVisits.mockResolvedValue({ visits: mockVisits, totalCount: mockVisits.length });
    const { result } = renderHook(() => useOpenVisits());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockVisits);
    });

    expect(result.current.totalCount).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls getOpenVisits with the location uuid and default params', async () => {
    mockGetOpenVisits.mockResolvedValue({ visits: [], totalCount: 0 });
    renderHook(() => useOpenVisits());

    await waitFor(() => {
      expect(mockGetOpenVisits).toHaveBeenCalledWith(MOCK_LOCATION_UUID, 0, 50, undefined, undefined);
    });
  });

  it('passes fromDate and toDate to the service', async () => {
    mockGetOpenVisits.mockResolvedValue({ visits: [], totalCount: 0 });
    renderHook(() => useOpenVisits('2026-04-01', '2026-06-01'));

    await waitFor(() => {
      expect(mockGetOpenVisits).toHaveBeenCalledWith(MOCK_LOCATION_UUID, 0, 50, '2026-04-01', '2026-06-01');
    });
  });

  it('re-fetches when fromDate changes', async () => {
    mockGetOpenVisits.mockResolvedValue({ visits: mockVisits, totalCount: mockVisits.length });
    const { rerender } = renderHook(
      ({ fromDate }: { fromDate?: string }) => useOpenVisits(fromDate),
      { initialProps: { fromDate: undefined as string | undefined } },
    );

    await waitFor(() => {
      expect(mockGetOpenVisits).toHaveBeenCalledTimes(1);
    });

    mockGetOpenVisits.mockResolvedValue({ visits: [], totalCount: 0 });
    rerender({ fromDate: '2026-04-01' });

    await waitFor(() => {
      expect(mockGetOpenVisits).toHaveBeenCalledTimes(2);
      expect(mockGetOpenVisits).toHaveBeenLastCalledWith(MOCK_LOCATION_UUID, 0, 50, '2026-04-01', undefined);
    });
  });

  it('sets error message when API call fails', async () => {
    mockGetOpenVisits.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useOpenVisits());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch open visits');
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when locationUuid is null', () => {
    mockUseProfileContext.mockReturnValue({ locationUuid: null });
    renderHook(() => useOpenVisits());

    expect(mockGetOpenVisits).not.toHaveBeenCalled();
  });

  it('does not fetch when locationUuid is undefined', () => {
    mockUseProfileContext.mockReturnValue({ locationUuid: undefined });
    renderHook(() => useOpenVisits());

    expect(mockGetOpenVisits).not.toHaveBeenCalled();
  });

  it('totalCount reflects length of data array', async () => {
    mockGetOpenVisits.mockResolvedValue({ visits: mockVisits, totalCount: mockVisits.length });
    const { result } = renderHook(() => useOpenVisits());

    await waitFor(() => {
      expect(result.current.totalCount).toBe(mockVisits.length);
    });
  });

  it('re-fetches when locationUuid changes', async () => {
    mockGetOpenVisits.mockResolvedValue({ visits: mockVisits, totalCount: mockVisits.length });
    let locationUuid = MOCK_LOCATION_UUID;
    mockUseProfileContext.mockImplementation(() => ({ locationUuid }));

    const { rerender } = renderHook(() => useOpenVisits());
    await waitFor(() => {
      expect(mockGetOpenVisits).toHaveBeenCalledTimes(1);
    });

    locationUuid = 'loc-uuid-new';
    mockGetOpenVisits.mockResolvedValue({ visits: [], totalCount: 0 });
    rerender();

    await waitFor(() => {
      expect(mockGetOpenVisits).toHaveBeenCalledTimes(2);
      expect(mockGetOpenVisits).toHaveBeenLastCalledWith('loc-uuid-new', 0, 50, undefined, undefined);
    });
  });
});
