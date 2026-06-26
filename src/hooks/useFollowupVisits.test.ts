import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfileContext } from '../context/ProfileContext';
import { useFollowupVisits } from '../hooks/useFollowupVisits';
import { patientService } from '../services/patient.service';

vi.mock('../context/ProfileContext');
vi.mock('../services/patient.service');

describe('useFollowupVisits', () => {
  const mockLocationUuid = 'test-location-uuid';
  const mockVisits = [
    {
      visitUuid: '1',
      patientName: 'John Doe',
      age: 30,
      visitCreatedDate: '2023-01-01',
      clinicName: 'Test Clinic',
      gender: 'M',
    },
  ];

  beforeEach(() => {
    (
      useProfileContext as unknown as { mockReturnValue: (v: any) => void }
    ).mockReturnValue({ locationUuid: mockLocationUuid });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch follow-up visits successfully', async () => {
    (
      patientService.getFollowupVisits as unknown as {
        mockResolvedValue: (v: any) => void;
      }
    ).mockResolvedValue({ visits: mockVisits });
    const { result } = renderHook(() => useFollowupVisits());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual(mockVisits);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should call getFollowupVisits with default params', async () => {
    (
      patientService.getFollowupVisits as unknown as {
        mockResolvedValue: (v: any) => void;
      }
    ).mockResolvedValue({ visits: [] });
    renderHook(() => useFollowupVisits());
    await waitFor(() => {
      expect(patientService.getFollowupVisits).toHaveBeenCalledWith(
        mockLocationUuid,
        0,
        50,
        undefined,
        undefined
      );
    });
  });

  it('should pass fromDate and toDate to the service', async () => {
    (
      patientService.getFollowupVisits as unknown as {
        mockResolvedValue: (v: any) => void;
      }
    ).mockResolvedValue({ visits: [] });
    renderHook(() => useFollowupVisits('2026-04-01', '2026-06-01'));
    await waitFor(() => {
      expect(patientService.getFollowupVisits).toHaveBeenCalledWith(
        mockLocationUuid,
        0,
        50,
        '2026-04-01',
        '2026-06-01'
      );
    });
  });

  it('should re-fetch when fromDate changes', async () => {
    (
      patientService.getFollowupVisits as unknown as {
        mockResolvedValue: (v: any) => void;
      }
    ).mockResolvedValue({ visits: mockVisits });
    const { rerender } = renderHook(
      ({ fromDate }: { fromDate?: string }) => useFollowupVisits(fromDate),
      { initialProps: { fromDate: undefined as string | undefined } }
    );

    await waitFor(() => {
      expect(patientService.getFollowupVisits).toHaveBeenCalledTimes(1);
    });

    (
      patientService.getFollowupVisits as unknown as {
        mockResolvedValue: (v: any) => void;
      }
    ).mockResolvedValue({ visits: [] });
    rerender({ fromDate: '2026-04-01' });

    await waitFor(() => {
      expect(patientService.getFollowupVisits).toHaveBeenCalledTimes(2);
      expect(patientService.getFollowupVisits).toHaveBeenLastCalledWith(
        mockLocationUuid,
        0,
        50,
        '2026-04-01',
        undefined
      );
    });
  });

  it('should handle fetch error', async () => {
    (
      patientService.getFollowupVisits as unknown as {
        mockRejectedValue: (v: any) => void;
      }
    ).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useFollowupVisits());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to fetch follow-up visits');
  });

  it('should not fetch if locationUuid is missing', () => {
    (
      useProfileContext as unknown as { mockReturnValue: (v: any) => void }
    ).mockReturnValue({ locationUuid: null });
    const { result } = renderHook(() => useFollowupVisits());
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch if locationUuid is undefined', () => {
    (
      useProfileContext as unknown as { mockReturnValue: (v: any) => void }
    ).mockReturnValue({ locationUuid: undefined });
    const { result } = renderHook(() => useFollowupVisits());
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
