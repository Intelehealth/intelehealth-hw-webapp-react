import { useEffect, useState } from 'react';
import {
  appointmentService,
  type AppointmentSlot,
} from '../modules/appointment-visit/appointment.service';

export const useAppointmentSlots = (
  fromDate: string,
  toDate: string,
  speciality: string
) => {
  const [data, setData] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromDate || !toDate || !speciality) {
      return;
    }
    setLoading(true);
    setError(null);
    appointmentService
      .getAppointmentSlots(fromDate, toDate, speciality)
      .then(slots => {
        setData(slots);
      })
      .catch(() => {
        setError('Failed to fetch appointment slots');
      })
      .finally(() => setLoading(false));
  }, [fromDate, toDate, speciality]);

  return { data, loading, error };
};
