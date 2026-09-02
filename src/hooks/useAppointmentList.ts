import { useCallback, useEffect, useState } from 'react';
import type { AppointmentListItem } from '../assets/data/appointments.data';
import { appointmentService } from '../modules/appointment-visit/appointment.service';
import { storage } from '../utils/storage';

export const useAppointmentList = () => {
  const [data, setData] = useState<AppointmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    const locationUuid = storage.getLocationUuid();
    if (!locationUuid) {
      setData([]);
      setLoading(false);
      setError('No clinic location found for the logged in user.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const from = new Date();
      from.setMonth(from.getMonth() - 6);
      const to = new Date();
      to.setMonth(to.getMonth() + 6);
      const appointments = await appointmentService.getBookedAppointments(
        locationUuid,
        from.toLocaleDateString('en-CA'),
        to.toLocaleDateString('en-CA')
      );
      setData(appointments);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setData([]);
      setError('Unable to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { data, loading, error, refetch: fetchAppointments };
};
