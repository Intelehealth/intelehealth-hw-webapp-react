import { useCallback, useEffect, useState } from 'react';
import type { RawBookedAppointment } from '../assets/data/appointments.data';
import { appointmentService } from '../modules/appointment-visit/appointment.service';
import { storage } from '../utils/storage';

const dateWindow = () => {
  const from = new Date();
  from.setMonth(from.getMonth() - 6);
  const to = new Date();
  to.setMonth(to.getMonth() + 6);
  return [from.toLocaleDateString('en-CA'), to.toLocaleDateString('en-CA')];
};

export const useAppointmentDetail = (id: number | null) => {
  const [data, setData] = useState<RawBookedAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointment = useCallback(async () => {
    const locationUuid = storage.getLocationUuid();
    if (!locationUuid || id == null || Number.isNaN(id)) {
      setData(null);
      setLoading(false);
      setError('Appointment not found.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [from, to] = dateWindow();
      const appointment = await appointmentService.getAppointmentById(
        locationUuid,
        id,
        from,
        to
      );
      setData(appointment);
      if (!appointment) setError('Appointment not found.');
    } catch (error) {
      console.error('Failed to load appointment:', error);
      setData(null);
      setError('Unable to load the appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  return { data, loading, error, refetch: fetchAppointment };
};
