import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetPrescriptionsReceived = vi.fn();
const mockProfile = { id: 'hw-uuid-456' };
const mockUseProfileContext = vi.fn();

vi.mock('../../context/ProfileContext', () => ({
  useProfileContext: () => mockUseProfileContext(),
}));

vi.mock('../../services/patient.service', () => ({
  patientService: {
    getPrescriptionsReceived: (...args: unknown[]) => mockGetPrescriptionsReceived(...args),
  },
}));

import { usePrescriptionsReceived } from '../../hooks/usePrescriptionsReceived';

const mockPrescriptions = [
  {
    visitUuid: 'r-1',
    patientName: 'Sarrah Paul',
    gender: 'F',
    age: 41,
    visitCreatedDate: '2025-04-21',
    clinicName: 'TM Clinic 2',
    prescriptionReceivedTimestamp: '1 hr ago',
  },
  {
    visitUuid: 'r-2',
    patientName: 'Nikita Agrawal',
    gender: 'F',
    age: 32,
    visitCreatedDate: '2025-04-20',
    clinicName: 'TM Clinic 1',
    prescriptionReceivedTimestamp: '2 hr ago',
  },
];

describe('usePrescriptionsReceived', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProfileContext.mockReturnValue({ profile: mockProfile });
  });

  it('initialises with empty data, loading false, no error', () => {
    mockGetPrescriptionsReceived.mockResolvedValue([]);
    const { result } = renderHook(() => usePrescriptionsReceived());

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.totalCount).toBe(0);
  });

  it('sets loading true while fetching and false after', async () => {
    mockGetPrescriptionsReceived.mockResolvedValue(mockPrescriptions);
    const { result } = renderHook(() => usePrescriptionsReceived());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('fetches prescriptions and populates data', async () => {
    mockGetPrescriptionsReceived.mockResolvedValue(mockPrescriptions);
    const { result } = renderHook(() => usePrescriptionsReceived());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockPrescriptions);
    });

    expect(result.current.totalCount).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls getPrescriptionsReceived with the profile id', async () => {
    mockGetPrescriptionsReceived.mockResolvedValue([]);
    renderHook(() => usePrescriptionsReceived());

    await waitFor(() => {
      expect(mockGetPrescriptionsReceived).toHaveBeenCalledWith('hw-uuid-456');
    });
  });

  it('sets error message when API call fails', async () => {
    mockGetPrescriptionsReceived.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => usePrescriptionsReceived());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch prescriptions');
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when profile is null', () => {
    mockUseProfileContext.mockReturnValue({ profile: null });
    renderHook(() => usePrescriptionsReceived());

    expect(mockGetPrescriptionsReceived).not.toHaveBeenCalled();
  });

  it('does not fetch when profile has no id', () => {
    mockUseProfileContext.mockReturnValue({ profile: {} });
    renderHook(() => usePrescriptionsReceived());

    expect(mockGetPrescriptionsReceived).not.toHaveBeenCalled();
  });

  it('totalCount reflects length of data array', async () => {
    mockGetPrescriptionsReceived.mockResolvedValue(mockPrescriptions);
    const { result } = renderHook(() => usePrescriptionsReceived());

    await waitFor(() => {
      expect(result.current.totalCount).toBe(mockPrescriptions.length);
    });
  });
});
