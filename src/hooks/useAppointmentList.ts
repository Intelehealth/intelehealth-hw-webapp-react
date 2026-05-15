import { useState } from 'react';
import type { AppointmentListItem } from '../assets/data/appointments.data';
import { appointmentsListData } from '../assets/data/appointments.data';

export const useAppointmentList = () => {
  const [data] = useState<AppointmentListItem[]>(appointmentsListData);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  return { data, loading, error };
};
