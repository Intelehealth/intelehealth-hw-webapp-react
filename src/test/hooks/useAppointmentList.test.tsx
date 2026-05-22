import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAppointmentList } from '../../hooks/useAppointmentList';
import { appointmentsListData } from '../../assets/data/appointments.data';

describe('useAppointmentList', () => {
  it('returns static appointments data', () => {
    const { result } = renderHook(() => useAppointmentList());
    expect(result.current.data).toEqual(appointmentsListData);
  });

  it('returns loading as false', () => {
    const { result } = renderHook(() => useAppointmentList());
    expect(result.current.loading).toBe(false);
  });

  it('returns error as null', () => {
    const { result } = renderHook(() => useAppointmentList());
    expect(result.current.error).toBeNull();
  });

  it('returns data with correct length', () => {
    const { result } = renderHook(() => useAppointmentList());
    expect(result.current.data).toHaveLength(appointmentsListData.length);
  });

  it('returns data items with required AppointmentListItem fields', () => {
    const { result } = renderHook(() => useAppointmentList());
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

  it('returns stable references across rerenders', () => {
    const { result, rerender } = renderHook(() => useAppointmentList());
    const firstData = result.current.data;
    rerender();
    expect(result.current.data).toBe(firstData);
  });

  it('contains both upcoming and past appointment types', () => {
    const { result } = renderHook(() => useAppointmentList());
    const types = new Set(result.current.data.map(item => item.type));
    expect(types.has('upcoming')).toBe(true);
    expect(types.has('past')).toBe(true);
  });
});
