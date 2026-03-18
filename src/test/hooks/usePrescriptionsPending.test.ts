import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPrescriptionsPending = vi.fn();
const MOCK_LOCATION_UUID = 'loc-uuid-789';
const mockUseProfileContext = vi.fn();

vi.mock('../../context/ProfileContext', () => ({
  useProfileContext: () => mockUseProfileContext(),
}));

vi.mock('../../services/patient.service', () => ({
  patientService: {
    getPrescriptionsPending: (...args: unknown[]) => mockGetPrescriptionsPending(...args),
  },
}));

import { usePrescriptionsPending } from '../../hooks/usePrescriptionsPending';

const mockPendingVisits = [
  {
    visitUuid: 'p-1',
    patientName: 'Ravi Kumar',
    gender: 'M',
    age: 35,
    visitCreatedDate: '2025-04-21',
    clinicName: 'TM Clinic 1',
    uploadTimestamp: '30 min ago',
  },
  {
    visitUuid: 'p-2',
    patientName: 'Priya Singh',
    gender: 'F',
    age: 28,
    visitCreatedDate: '2025-04-20',
    clinicName: 'TM Clinic 2',
    uploadTimestamp: '1 hr ago',
  },
];

describe('usePrescriptionsPending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileContext.mockReturnValue({ locationUuid: MOCK_LOCATION_UUID });
  });

  it('initialises with empty data, loading false, no error', () => {
    mockGetPrescriptionsPending.mockResolvedValue([]);
    const { result } = renderHook(() => usePrescriptionsPending());

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.totalCount).toBe(0);
  });

  it('sets loading true while fetching and false after', async () => {
    mockGetPrescriptionsPending.mockResolvedValue(mockPendingVisits);
    const { result } = renderHook(() => usePrescriptionsPending());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('fetches pending prescriptions and populates data', async () => {
    mockGetPrescriptionsPending.mockResolvedValue(mockPendingVisits);
    const { result } = renderHook(() => usePrescriptionsPending());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPendingVisits);
    });

    expect(result.current.totalCount).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls getPrescriptionsPending with the location uuid', async () => {
    mockGetPrescriptionsPending.mockResolvedValue([]);
    renderHook(() => usePrescriptionsPending());

    await waitFor(() => {
      expect(mockGetPrescriptionsPending).toHaveBeenCalledWith(MOCK_LOCATION_UUID);
    });
  });

  it('sets error message when API call fails', async () => {
    mockGetPrescriptionsPending.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => usePrescriptionsPending());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch pending prescriptions');
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when locationUuid is null', () => {
    mockUseProfileContext.mockReturnValue({ locationUuid: null });
    renderHook(() => usePrescriptionsPending());

    expect(mockGetPrescriptionsPending).not.toHaveBeenCalled();
  });

  it('does not fetch when locationUuid is undefined', () => {
    mockUseProfileContext.mockReturnValue({ locationUuid: undefined });
    renderHook(() => usePrescriptionsPending());

    expect(mockGetPrescriptionsPending).not.toHaveBeenCalled();
  });

  it('totalCount reflects length of data array', async () => {
    mockGetPrescriptionsPending.mockResolvedValue(mockPendingVisits);
    const { result } = renderHook(() => usePrescriptionsPending());

    await waitFor(() => {
      expect(result.current.totalCount).toBe(mockPendingVisits.length);
    });
  });

  it('re-fetches when locationUuid changes', async () => {
    mockGetPrescriptionsPending.mockResolvedValue(mockPendingVisits);
    let locationUuid = MOCK_LOCATION_UUID;
    mockUseProfileContext.mockImplementation(() => ({ locationUuid }));

    const { rerender } = renderHook(() => usePrescriptionsPending());
    await waitFor(() => {
      expect(mockGetPrescriptionsPending).toHaveBeenCalledTimes(1);
    });

    locationUuid = 'loc-uuid-new';
    mockGetPrescriptionsPending.mockResolvedValue([]);
    rerender();

    await waitFor(() => {
      expect(mockGetPrescriptionsPending).toHaveBeenCalledTimes(2);
      expect(mockGetPrescriptionsPending).toHaveBeenLastCalledWith('loc-uuid-new');
    });
  });
});
