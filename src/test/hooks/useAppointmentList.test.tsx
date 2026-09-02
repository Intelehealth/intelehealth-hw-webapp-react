import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetBookedAppointments, locationHolder } = vi.hoisted(() => ({
  mockGetBookedAppointments: vi.fn(),
  locationHolder: { value: null as string | null },
}));

vi.mock('../../modules/appointment-visit/appointment.service', () => ({
  appointmentService: {
    getBookedAppointments: (...args: unknown[]) =>
      mockGetBookedAppointments(...args),
  },
}));

vi.mock('../../utils/storage', () => ({
  storage: { getLocationUuid: () => locationHolder.value },
}));

import { useAppointmentList } from '../../hooks/useAppointmentList';
import { appointmentsListData } from '../../assets/data/appointments.data';

describe('useAppointmentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationHolder.value = 'location-uuid-1';
    mockGetBookedAppointments.mockResolvedValue(appointmentsListData);
  });

  it('fetches appointments for the stored location', async () => {
    const { result } = renderHook(() => useAppointmentList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetBookedAppointments).toHaveBeenCalledWith(
      'location-uuid-1',
      expect.any(String),
      expect.any(String)
    );
    expect(result.current.data).toEqual(appointmentsListData);
    expect(result.current.error).toBeNull();
  });

  it('starts in the loading state', () => {
    const { result } = renderHook(() => useAppointmentList());
    expect(result.current.loading).toBe(true);
  });

  it('returns data items with required AppointmentListItem fields', async () => {
    const { result } = renderHook(() => useAppointmentList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const item = result.current.data[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('patientName');
    expect(item).toHaveProperty('gender');
    expect(item).toHaveProperty('age');
    expect(item).toHaveProperty('visitId');
    expect(item).toHaveProperty('symptom');
    expect(item).toHaveProperty('dateTime');
    expect(item).toHaveProperty('slotDay');
    expect(item).toHaveProperty('status');
    expect(item).toHaveProperty('speciality');
    expect(item).toHaveProperty('type');
  });

  it('sets an error and skips the request when no location is stored', async () => {
    locationHolder.value = null;
    const { result } = renderHook(() => useAppointmentList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetBookedAppointments).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(
      'No clinic location found for the logged in user.'
    );
  });

  it('sets an error when the request fails', async () => {
    mockGetBookedAppointments.mockRejectedValueOnce(
      new Error('Network error')
    );
    const { result } = renderHook(() => useAppointmentList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(
      'Unable to load appointments. Please try again.'
    );
  });

  it('refetches on demand', async () => {
    const { result } = renderHook(() => useAppointmentList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetBookedAppointments).toHaveBeenCalledTimes(1);
    await result.current.refetch();
    expect(mockGetBookedAppointments).toHaveBeenCalledTimes(2);
  });

  it('does not refetch on rerender', async () => {
    const { result, rerender } = renderHook(() => useAppointmentList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender();
    expect(mockGetBookedAppointments).toHaveBeenCalledTimes(1);
  });
});
