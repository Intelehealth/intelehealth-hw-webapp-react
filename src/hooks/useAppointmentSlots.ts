import { useEffect, useState } from 'react';
import {
  appointmentService,
  type AppointmentSlot,
} from '../modules/appointment-visit/appointment.service';

export const useAppointmentSlots = (
  fromDate: string,
  toDate: string,
  locationUuid: string
) => {
  const [data, setData] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromDate || !toDate || !locationUuid) return;
    setLoading(true);
    setError(null);
    appointmentService
      .getAppointmentSlots(fromDate, toDate, locationUuid)
      .then(setData)
      .catch(err => {
        console.error('Appointment slots API error:', err);
        setError('Failed to fetch appointment slots');
      })
      .finally(() => setLoading(false));
  }, [fromDate, toDate, locationUuid]);

  return { data, loading, error };
};
