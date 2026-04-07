import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetAppointmentSlots = vi.fn();

vi.mock('../../modules/appointment-visit/appointment.service', () => ({
  appointmentService: {
    getAppointmentSlots: (...args: unknown[]) =>
      mockGetAppointmentSlots(...args),
  },
}));

import { useAppointmentSlots } from '../../hooks/useAppointmentSlots';

const mockSlots = [
  {
    slotId: 's1',
    date: '2026-04-01',
    time: '09:00 am',
    isAvailable: true,
    period: 'Morning' as const,
  },
  {
    slotId: 's2',
    date: '2026-04-01',
    time: '02:00 pm',
    isAvailable: false,
    period: 'Afternoon' as const,
  },
];

describe('useAppointmentSlots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initialises with empty data, loading false, no error', () => {
    mockGetAppointmentSlots.mockResolvedValue([]);
    const { result } = renderHook(() =>
      useAppointmentSlots('2026-04-01', '2026-04-13', 'location-uuid-123')
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches slots and populates data', async () => {
    mockGetAppointmentSlots.mockResolvedValue(mockSlots);
    const { result } = renderHook(() =>
      useAppointmentSlots('2026-04-01', '2026-04-13', 'location-uuid-123')
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockSlots);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls getAppointmentSlots with correct params', async () => {
    mockGetAppointmentSlots.mockResolvedValue([]);
    renderHook(() =>
      useAppointmentSlots('2026-04-01', '2026-04-13', 'location-uuid-123')
    );

    await waitFor(() => {
      expect(mockGetAppointmentSlots).toHaveBeenCalledWith(
        '2026-04-01',
        '2026-04-13',
        'location-uuid-123'
      );
    });
  });

  it('sets error message when API call fails', async () => {
    mockGetAppointmentSlots.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() =>
      useAppointmentSlots('2026-04-01', '2026-04-13', 'location-uuid-123')
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch appointment slots');
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when fromDate is empty', () => {
    renderHook(() =>
      useAppointmentSlots('', '2026-04-13', 'location-uuid-123')
    );

    expect(mockGetAppointmentSlots).not.toHaveBeenCalled();
  });

  it('does not fetch when toDate is empty', () => {
    renderHook(() =>
      useAppointmentSlots('2026-04-01', '', 'location-uuid-123')
    );

    expect(mockGetAppointmentSlots).not.toHaveBeenCalled();
  });

  it('does not fetch when locationUuid is empty', () => {
    renderHook(() =>
      useAppointmentSlots('2026-04-01', '2026-04-13', '')
    );

    expect(mockGetAppointmentSlots).not.toHaveBeenCalled();
  });

  it('re-fetches when params change', async () => {
    mockGetAppointmentSlots.mockResolvedValue(mockSlots);
    let fromDate = '2026-04-01';

    const { rerender } = renderHook(() =>
      useAppointmentSlots(fromDate, '2026-04-13', 'location-uuid-123')
    );

    await waitFor(() => {
      expect(mockGetAppointmentSlots).toHaveBeenCalledTimes(1);
    });

    fromDate = '2026-05-01';
    mockGetAppointmentSlots.mockResolvedValue([]);
    rerender();

    await waitFor(() => {
      expect(mockGetAppointmentSlots).toHaveBeenCalledTimes(2);
      expect(mockGetAppointmentSlots).toHaveBeenLastCalledWith(
        '2026-05-01',
        '2026-04-13',
        'location-uuid-123'
      );
    });
  });
});
