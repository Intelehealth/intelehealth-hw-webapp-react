import { useEffect, useState } from 'react';
import { appointmentService } from '../modules/appointment-visit/appointment.service';
import type { AppointmentListItem } from '../assets/data/appointments.data';

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const useAppointmentList = () => {
  const [data, setData] = useState<AppointmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const today = new Date();
    const from = new Date(today);
    from.setMonth(from.getMonth() - 6);

    appointmentService
      .getUserAppointments(toISODate(from), toISODate(today))
      .then(setData)
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch appointments';
        console.error('[useAppointmentList]', message, err);
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
};
